import React, { useState, useEffect, useRef, useCallback } from 'react';
import Panel from './Panel';
import { Panel as PanelType, SearchResponse, SearchResultItem } from '../../types';
import { useApp } from '../../hooks/useApp';
import { API_BASE, AUDIO_BASE } from '../../constants';

// FIX: Encapsulated all logic within the component and added the main return statement.
// This resolves all scope-related "Cannot find name" errors and the missing return type error.
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
        if (searchQuery.trim().length < 3) {
            setResults([]);
            setError(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}/search?q=${encodeURIComponent(searchQuery)}&language=ar`;
            const data = await actions.fetchWithRetry<SearchResponse>(url);
            setResults(data.search.results);
            if (data.search.results.length === 0) {
                setError('لم يتم العثور على نتائج.');
            }
        } catch (err) {
            console.error('Search failed:', err);
            setError('فشل البحث. يرجى المحاولة مرة أخرى.');
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

        try {
            const verseData = await actions.fetchWithRetry<{ verse: { audio: { url: string } } }>(`${API_BASE}/verses/by_key/${verseKey}?audio=${state.selectedReciterId}`);
            if (verseData.verse.audio?.url) {
                const audio = new Audio(`${AUDIO_BASE}${verseData.verse.audio.url}`);
                audioRef.current = audio;
                audio.play();
                audio.onended = () => setPlayingVerseKey(null);
                audio.onerror = () => {
                    console.error("Audio playback error");
                    setPlayingVerseKey(null);
                };
            } else {
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
        if (!query || query.trim().length < 3) {
             return (
                <div className="text-center py-10 text-text-secondary">
                    <i className="fas fa-search text-3xl mb-2"></i>
                    <p>ابحث عن آية في القرآن الكريم</p>
                    <p className="text-xs mt-1">اكتب ٣ أحرف على الأقل لبدء البحث</p>
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
                                    dangerouslySetInnerHTML={{ __html: result.text.replace(/<mark>/g, '<mark class="bg-secondary/30 rounded px-1">') }}
                                ></p>
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
