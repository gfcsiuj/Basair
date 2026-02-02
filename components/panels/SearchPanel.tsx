
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Panel from './Panel';
import { Panel as PanelType, SearchResultItem, SearchResponse } from '../../types';
import { useApp } from '../../hooks/useApp';
import { API_BASE, AUDIO_BASE } from '../../constants';

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
            // Use the search API endpoint with proper encoding
            const trimmedQuery = searchQuery.trim();
            const url = `${API_BASE}/search?q=${encodeURIComponent(trimmedQuery)}&size=50&page=1&language=ar`;
            const data = await actions.fetchWithRetry<SearchResponse>(url);

            if (data.search && data.search.results) {
                const searchResults = data.search.results;
                setResults(searchResults);
                if (searchResults.length === 0) {
                    setError('لم يتم العثور على نتائج. جرّب كلمات مختلفة.');
                }
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (err) {
            console.error('Search failed:', err);
            setError('فشل البحث. تأكد من اتصالك بالإنترنت.');
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
                    case 1001: reciterCode = 2; break; // Abu Bakr Al Shatri
                    case 1002: reciterCode = 3; break; // Nasser Al Qatami
                    case 1003: reciterCode = 4; break; // Yasser Al Dosari
                    case 1004: reciterCode = 5; break; // Hani Ar Rifai
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
                <div className="text-center py-10 text-text-secondary">
                    <i className="fas fa-spinner fa-spin text-3xl"></i>
                    <p className="mt-2">جاري البحث...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center py-10 text-text-secondary">
                    <i className="fas fa-exclamation-circle text-3xl mb-2"></i>
                    <p>{error}</p>
                </div>
            );
        }
        if (!query || query.trim().length < 2) {
            return (
                <div className="text-center py-10 text-text-secondary px-4">
                    <i className="fas fa-search text-3xl mb-3"></i>
                    <p className="font-medium">ابحث عن آية في القرآن الكريم</p>
                    <p className="text-xs mt-2 opacity-80">جرّب البحث بالإنجليزية مثل: allah, rahman, salat</p>
                    <p className="text-xs mt-1 opacity-60">أو بالعربية مثل: الرحمن، الصلاة</p>
                </div>
            );
        }
        if (results.length > 0) {
            return (
                <div className="p-4 space-y-3">
                    {results.map((result, index) => {
                        const [surahNum, ayahNum] = result.verse_key.split(':');
                        const surahName = state.surahs.find(s => s.id === parseInt(surahNum))?.name_arabic || '';
                        const isPlaying = playingVerseKey === result.verse_key;
                        return (
                            <div
                                key={result.verse_key}
                                onClick={() => handleNavigateToVerse(result.verse_key)}
                                className="card bg-bg-secondary p-4 rounded-lg cursor-pointer hover:bg-bg-tertiary transition-colors animate-listItemEnter"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <p
                                    className="font-arabic text-lg mb-3 text-text-primary text-right"
                                    dangerouslySetInnerHTML={{ __html: result.text }}
                                >
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-text-secondary font-medium">{surahName} : {ayahNum}</p>
                                    <button onClick={(e) => handlePlayAudio(e, result.verse_key)} className="w-8 h-8 flex items-center justify-center text-primary rounded-full hover:bg-primary/10 transition-colors">
                                        <i className={`fas ${isPlaying ? 'fa-pause-circle' : 'fa-play-circle'} text-xl`}></i>
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
        <Panel id={PanelType.Search} title="بحث في القرآن">
            <div className="p-4 sticky top-0 bg-bg-primary z-10 border-b border-border">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ابحث عن آية..."
                        className="input w-full pr-10 bg-bg-secondary border-border focus:border-primary"
                        autoFocus
                    />
                    <i className="fas fa-search absolute top-1/2 right-3 -translate-y-1/2 text-text-tertiary"></i>
                </div>
            </div>
            {renderContent()}
        </Panel>
    );
};

export default SearchPanel;
