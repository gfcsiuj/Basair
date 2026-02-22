import React, { useState, useEffect, useRef, useCallback } from 'react';
import Panel from './Panel';
import { Panel as PanelType, SearchResultItem, SearchResponse } from '../../types';
import { useApp } from '../../hooks/useApp';
import { API_BASE, AUDIO_BASE } from '../../constants';

const SVG = {
    search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    exclamation: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
    play: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z',
    pause: 'M15.75 5.25v13.5m-7.5-13.5v13.5',
};

const SearchPanel: React.FC = () => {
    const { state, actions } = useApp();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.trim().length < 2) {
            setResults([]);
            setError(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const trimmedQuery = searchQuery.trim();
            const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(trimmedQuery)}/all/quran-simple-clean`;
            const data = await actions.fetchWithRetry<any>(url);

            if (data.code === 200 && data.data && data.data.matches) {
                const searchResults = data.data.matches.map((match: any) => ({
                    verse_key: `${match.surah.number}:${match.numberInSurah}`,
                    verse_id: match.number,
                    text: match.text,
                }));
                setResults(searchResults);
                if (searchResults.length === 0) {
                    setError('\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0646\u062a\u0627\u0626\u062c. \u062c\u0631\u0651\u0628 \u0643\u0644\u0645\u0627\u062a \u0645\u062e\u062a\u0644\u0641\u0629.');
                }
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (err) {
            console.error('Search failed:', err);
            setError('\u0641\u0634\u0644 \u0627\u0644\u0628\u062d\u062b. \u062a\u0623\u0643\u062f \u0645\u0646 \u0627\u062a\u0635\u0627\u0644\u0643 \u0628\u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a.');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [actions]);

    useEffect(() => {
        if (state.activePanel !== PanelType.Search) {
            setQuery('');
            setResults([]);
            setError(null);
            return;
        }

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            performSearch(query);
        }, 500);

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [query, performSearch, state.activePanel]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleNavigateToVerse = async (verseKey: string) => {
        actions.openPanel(null);
        try {
            const verseData = await actions.fetchWithRetry<{ verse: { page_number: number } }>(`${API_BASE}/verses/by_key/${verseKey}`);
            actions.loadPage(verseData.verse.page_number);
        } catch (err) {
            console.error('Failed to get page for verse:', err);
        }
    };

    const handlePlayAudio = async (e: React.MouseEvent, verseKey: string) => {
        e.stopPropagation();

        if (playingVerseKey === verseKey && audioRef.current) {
            audioRef.current.pause();
            setPlayingVerseKey(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        setPlayingVerseKey(verseKey);

        let audioUrl = '';
        const reciterId = state.selectedReciterId;

        try {
            if (reciterId >= 1001) {
                const [surahIdStr, ayahIdStr] = verseKey.split(':');
                const surahId = parseInt(surahIdStr);
                const ayahId = parseInt(ayahIdStr);
                let reciterCode = 0;
                switch (reciterId) {
                    case 1001: reciterCode = 2; break;
                    case 1002: reciterCode = 3; break;
                    case 1003: reciterCode = 4; break;
                    case 1004: reciterCode = 5; break;
                }
                if (reciterCode > 0) {
                    audioUrl = `https://the-quran-project.github.io/Quran-Audio/Data/${reciterCode}/${surahId}_${ayahId}.mp3`;
                }
            } else {
                const verseData = await actions.fetchWithRetry<{ verse: { audio: { url: string } } }>(`${API_BASE}/verses/by_key/${verseKey}?audio=${reciterId}`);
                if (verseData.verse.audio?.url) {
                    audioUrl = `${AUDIO_BASE}${verseData.verse.audio.url}`;
                }
            }

            if (audioUrl) {
                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.error("Audio playback error:", err);
                        setPlayingVerseKey(null);
                    });
                }
                audio.onended = () => setPlayingVerseKey(null);
                audio.onerror = () => {
                    console.error("Audio playback error on element.");
                    setPlayingVerseKey(null);
                };
            } else {
                console.warn(`No audio URL found for verse ${verseKey} with reciter ${reciterId}`);
                setPlayingVerseKey(null);
            }
        } catch (err) {
            console.error('Failed to play audio:', err);
            setPlayingVerseKey(null);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-text-secondary animate-fadeIn">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4"></div>
                    <p className="text-sm font-bold">{'\u062c\u0627\u0631\u064a \u0627\u0644\u0628\u062d\u062b...'}</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-text-secondary animate-fadeIn px-6 text-center">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.exclamation} />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-text-primary mb-1">{error}</p>
                </div>
            );
        }
        if (!query || query.trim().length < 2) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-text-secondary px-6 text-center animate-fadeIn">
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl"></div>
                        <div className="relative w-full h-full bg-gradient-to-br from-primary/15 to-bg-secondary rounded-3xl rotate-6 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                            <svg className="w-9 h-9 text-primary -rotate-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.search} />
                            </svg>
                        </div>
                    </div>
                    <h3 className="font-bold text-lg text-text-primary mb-2">{'\u0627\u0628\u062d\u062b \u0639\u0646 \u0622\u064a\u0629 \u0641\u064a \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064a\u0645'}</h3>
                    <p className="text-xs text-text-tertiary leading-relaxed max-w-[260px]">
                        {'\u062c\u0631\u0651\u0628 \u0627\u0644\u0628\u062d\u062b \u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629 \u0645\u062b\u0644: allah, rahman, salat'}
                        <br />
                        {'\u0623\u0648 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0645\u062b\u0644: \u0627\u0644\u0631\u062d\u0645\u0646\u060c \u0627\u0644\u0635\u0644\u0627\u0629'}
                    </p>
                </div>
            );
        }
        if (results.length > 0) {
            return (
                <div className="p-4 space-y-3 pb-8">
                    <p className="text-xs font-bold text-text-tertiary text-center mb-2">{results.length} {'\u0646\u062a\u064a\u062c\u0629'}</p>
                    {results.map((result, index) => {
                        const [surahNum, ayahNum] = result.verse_key.split(':');
                        const surahName = state.surahs.find(s => s.id === parseInt(surahNum))?.name_arabic || '';
                        const isPlaying = playingVerseKey === result.verse_key;
                        return (
                            <div
                                key={result.verse_key}
                                onClick={() => handleNavigateToVerse(result.verse_key)}
                                className="bg-bg-secondary p-5 rounded-3xl cursor-pointer hover:bg-bg-tertiary/50 transition-all active:scale-[0.98] animate-listItemEnter border border-border/40 hover:border-primary/30 shadow-sm group relative overflow-hidden"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className="absolute top-0 left-0 w-20 h-20 bg-primary/5 rounded-full blur-xl -translate-y-1/2 -translate-x-1/2"></div>
                                <p
                                    className="font-arabic text-[17px] mb-4 text-text-primary leading-[2.2] text-right relative z-10"
                                    dir="rtl"
                                    dangerouslySetInnerHTML={{ __html: result.text }}
                                />
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[11px] px-3 py-1.5 bg-primary/10 text-primary rounded-full font-bold border border-primary/20 shadow-sm">
                                        {surahName} : {ayahNum}
                                    </span>
                                    <button
                                        onClick={(e) => handlePlayAudio(e, result.verse_key)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 border shadow-sm ${isPlaying ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-bg-primary text-primary border-border/50 hover:bg-primary/10 hover:border-primary/30'}`}
                                    >
                                        <svg className="w-5 h-5" fill={isPlaying ? 'none' : 'currentColor'} viewBox="0 0 24 24" strokeWidth={isPlaying ? 2.5 : 0} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={isPlaying ? SVG.pause : SVG.play} />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    return (
        <Panel id={PanelType.Search} title={'\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0642\u0631\u0622\u0646'}>
            <div className="px-4 py-3 sticky top-0 bg-bg-primary/80 backdrop-blur-md z-10 border-b border-border/50 shadow-sm">
                <div className="relative group">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={'\u0627\u0628\u062d\u062b \u0639\u0646 \u0622\u064a\u0629...'}
                        className="w-full h-12 pr-12 pl-4 rounded-2xl bg-bg-secondary border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all duration-300 shadow-sm"
                        autoFocus
                    />
                    <svg className="w-5 h-5 absolute top-1/2 right-4 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={SVG.search} />
                    </svg>
                </div>
            </div>
            {renderContent()}
        </Panel>
    );
};

export default SearchPanel;
