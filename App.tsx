import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Surah, Verse, Reciter, Tafsir, Translation, Bookmark, Khatmah, AppState, AppContextType, Panel, Theme, Font, ReadingMode, AyahWordState, SearchResponse, Note, TasbeehCounter } from './types';
import { API_BASE, AUDIO_BASE, TOTAL_PAGES } from './constants';
import MainReadingInterface from './components/MainReadingInterface';
import MemorizationInterface from './components/MemorizationInterface';
import AIAssistant from './components/AIAssistant';
import { MenuPanel, StatisticsPanel, SupplicationsPanel, TasbeehPanel, NotesPanel } from './components/panels/MenuPanel';
import IndexPanel from './components/panels/IndexPanel';
import SettingsPanel from './components/panels/SettingsPanel';
import BookmarksPanel from './components/panels/BookmarksPanel';
import SearchPanel from './components/panels/SearchPanel';
import KhatmahPanel from './components/panels/KhatmahPanel';
import TafsirPopup from './components/TafsirPopup';
import ShareImageGenerator from './components/ShareImageGenerator';

// Create a context to provide state and actions to all components
export const AppContext = React.createContext<AppContextType | null>(null);

const App: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const isInitialMount = useRef(true);
    const [state, setState] = useState<AppState>({
        isInitialized: false,
        currentPage: parseInt(localStorage.getItem('lastPage') || '1'),
        theme: (localStorage.getItem('theme') as Theme) || 'light',
        font: (localStorage.getItem('font') as Font) || 'arabic',
        fontSize: parseInt(localStorage.getItem('fontSize') || '22'),
        readingMode: ReadingMode.Reading,
        surahs: [],
        reciters: [],
        pageData: null,
        isLoading: true,
        error: null,
        activePanel: null,
        selectedAyah: null,
        showTafsir: false,
        isPlaying: false,
        currentAudioIndex: 0,
        audioQueue: [],
        bookmarks: JSON.parse(localStorage.getItem('bookmarks') || '[]'),
        khatmahs: JSON.parse(localStorage.getItem('khatmahs') || '[]'),
        notes: JSON.parse(localStorage.getItem('notes') || '[]'),
        tasbeehCounters: JSON.parse(localStorage.getItem('tasbeehCounters') || '[]'),
        readingLog: JSON.parse(localStorage.getItem('readingLog') || '{}'),
        noteVerseTarget: null,
        ai: null,
        tafsirs: [],
        translations: [],
        selectedReciterId: parseInt(localStorage.getItem('selectedReciterId') || '7'),
        selectedTafsirId: parseInt(localStorage.getItem('selectedTafsirId') || '169'),
        selectedTranslationId: parseInt(localStorage.getItem('selectedTranslationId') || '131'),
        playingVerseHighlightColor: 'bg-emerald-500/20',
        isUIVisible: true,
        lastActivityTimestamp: Date.now(),
        showShareImageModal: false,
        isAIAssistantOpen: false,
        aiAutoPrompt: null,
    });
    
    // --- API & Data Loading ---
    const fetchWithRetry = useCallback(async <T,>(url: string, retries = 3): Promise<T> => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                const responseText = await response.text();

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
                }

                if (!responseText) {
                    if (url.includes('/search')) {
                        console.warn("Search API returned an empty response. Treating as no results.");
                        const emptySearchResponse: SearchResponse = {
                            search: {
                                query: '',
                                total_results: 0,
                                current_page: 1,
                                total_pages: 0,
                                results: [],
                            }
                        };
                        return emptySearchResponse as unknown as T;
                    }
                    throw new Error("API returned an empty response body.");
                }
                
                return JSON.parse(responseText);
            } catch (error) {
                console.error(`Fetch attempt ${i + 1} for ${url} failed with error:`, error);
                if (i === retries - 1) throw error;
                await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
        }
        throw new Error("API request failed after multiple retries");
    }, []);

    const getPageData = useCallback(async (pageNumber: number): Promise<Verse[]> => {
        const reciterId = state.selectedReciterId;
        const tafsirId = state.selectedTafsirId;
        const translationId = state.selectedTranslationId;
        const url = `${API_BASE}/verses/by_page/${pageNumber}?language=ar&words=true&word_fields=text_uthmani&audio=${reciterId}&tafsirs=${tafsirId}&translations=${translationId}&fields=text_uthmani,chapter_id,juz_number,page_number,verse_key,verse_number,words`;
        const data = await fetchWithRetry<{ verses: Verse[] }>(url);
        return data.verses;
    }, [fetchWithRetry, state.selectedReciterId, state.selectedTafsirId, state.selectedTranslationId]);

    const loadPage = useCallback(async (pageNumber: number) => {
        if (pageNumber < 1 || pageNumber > TOTAL_PAGES) return;
        setState(s => ({ ...s, isLoading: true, error: null }));
        try {
            const verses = await getPageData(pageNumber);
            const audioQueue = verses.map(v => ({
                url: `${AUDIO_BASE}${v.audio?.url}`,
                verseKey: v.verse_key
            }));
            setState(s => ({ ...s, currentPage: pageNumber, pageData: verses, audioQueue, currentAudioIndex: 0, isLoading: false }));
            localStorage.setItem('lastPage', String(pageNumber));
            
            // Track reading log
            const today = new Date().toISOString().split('T')[0];
            setState(s => {
                const newLog = { ...s.readingLog };
                if (!newLog[today]) {
                    newLog[today] = [];
                }
                if (!newLog[today].includes(pageNumber)) {
                    newLog[today].push(pageNumber);
                    localStorage.setItem('readingLog', JSON.stringify(newLog));
                    return { ...s, readingLog: newLog };
                }
                return s;
            });

        } catch (error) {
            console.error("Failed to load page:", error);
            setState(s => ({ ...s, isLoading: false, error: 'Failed to load page data.' }));
        }
    }, [getPageData]);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                
                const [chaptersData, recitationsData, tafsirsData, translationsData] = await Promise.all([
                    fetchWithRetry<{ chapters: Surah[] }>(`${API_BASE}/chapters?language=ar`),
                    fetchWithRetry<{ recitations: Reciter[] }>(`${API_BASE}/resources/recitations?language=ar`),
                    fetchWithRetry<{ tafsirs: Tafsir[] }>(`${API_BASE}/resources/tafsirs?language=ar`),
                    fetchWithRetry<{ translations: Translation[] }>(`${API_BASE}/resources/translations?language=ar`),
                ]);

                setState(s => ({ 
                    ...s, 
                    surahs: chaptersData.chapters, 
                    reciters: recitationsData.recitations, 
                    tafsirs: tafsirsData.tafsirs,
                    translations: translationsData.translations,
                    ai: aiInstance 
                }));
                await loadPage(state.currentPage);
                
            } catch (error) {
                console.error("Initialization failed:", error);
                setState(s => ({ ...s, error: 'Failed to initialize app.', isLoading: false }));
            } finally {
                setState(s => ({ ...s, isInitialized: true }));
            }
        };
        initializeApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
     // Effect to reload page data when content preferences change
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        loadPage(state.currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.selectedReciterId, state.selectedTafsirId, state.selectedTranslationId]);

    // Inactivity timer effect for auto-hiding UI
    useEffect(() => {
        const intervalId = setInterval(() => {
            const shouldAutoHide = 
                state.readingMode === ReadingMode.Reading && 
                state.activePanel === null && 
                !state.showTafsir && 
                !state.showShareImageModal && 
                !state.isAIAssistantOpen;

            if (state.isUIVisible && shouldAutoHide && (Date.now() - state.lastActivityTimestamp > 5000)) {
                setState(s => ({ ...s, isUIVisible: false }));
            }
        }, 1000); // Check every second

        return () => clearInterval(intervalId);
    }, [state.lastActivityTimestamp, state.isUIVisible, state.readingMode, state.activePanel, state.showTafsir, state.showShareImageModal, state.isAIAssistantOpen]);


    // --- State Management Actions ---
    const setTheme = useCallback((theme: Theme) => {
        setState(s => ({ ...s, theme }));
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    const setFont = useCallback((font: Font) => {
        setState(s => ({ ...s, font }));
        localStorage.setItem('font', font);
    }, []);
    
    const setFontSize = useCallback((size: number) => {
        setState(s => ({ ...s, fontSize: size }));
        localStorage.setItem('fontSize', String(size));
    }, []);
    
    const openPanel = useCallback((panel: Panel | null) => {
        setState(s => ({...s, activePanel: panel}));
    }, []);

    const setReadingMode = useCallback((mode: ReadingMode) => {
        setState(s => ({...s, readingMode: mode, activePanel: null}));
    }, []);
    
    const selectAyah = useCallback((ayah: Verse | null) => {
        setState(s => ({...s, selectedAyah: ayah}));
    }, []);

    const togglePlayPause = useCallback(() => {
        setState(s => ({ ...s, isPlaying: !s.isPlaying }));
    }, []);
    
    const playNext = useCallback(() => {
        if(state.currentAudioIndex < state.audioQueue.length - 1) {
            setState(s => ({...s, currentAudioIndex: s.currentAudioIndex + 1}));
        } else if (state.currentPage < TOTAL_PAGES) {
            loadPage(state.currentPage + 1).then(() => setState(s => ({...s, isPlaying: true})));
        } else {
            setState(s => ({...s, isPlaying: false}));
        }
    }, [state.currentAudioIndex, state.audioQueue.length, state.currentPage, loadPage]);

    const playPrev = useCallback(() => {
         if(state.currentAudioIndex > 0) {
            setState(s => ({...s, currentAudioIndex: s.currentAudioIndex - 1}));
        }
    }, []);

    const toggleBookmark = useCallback((verse: Verse) => {
        setState(s => {
            const existingIndex = s.bookmarks.findIndex(b => b.verseKey === verse.verse_key);
            let newBookmarks: Bookmark[];
            if (existingIndex > -1) {
                newBookmarks = s.bookmarks.filter(b => b.verseKey !== verse.verse_key);
            } else {
                const surah = s.surahs.find(su => su.id === verse.chapter_id);
                newBookmarks = [...s.bookmarks, {
                    verseKey: verse.verse_key,
                    verseText: verse.text_uthmani,
                    surahName: surah?.name_arabic || '',
                    timestamp: Date.now()
                }];
            }
            localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
            return {...s, bookmarks: newBookmarks};
        });
    }, []);

    // New CRUD Actions
    const addKhatmah = useCallback((k: Omit<Khatmah, 'id'|'completed'|'pagesRead'>) => {
        setState(s => {
            const newKhatmah: Khatmah = {...k, id: crypto.randomUUID(), completed: false, pagesRead: 0};
            const newKhatmahs = [...s.khatmahs, newKhatmah];
            localStorage.setItem('khatmahs', JSON.stringify(newKhatmahs));
            return {...s, khatmahs: newKhatmahs};
        });
    }, []);

    const updateKhatmahProgress = useCallback((id: string, pagesRead: number) => {
        setState(s => {
            const newKhatmahs = s.khatmahs.map(k => k.id === id ? {...k, pagesRead, completed: pagesRead >= TOTAL_PAGES} : k);
            localStorage.setItem('khatmahs', JSON.stringify(newKhatmahs));
            return {...s, khatmahs: newKhatmahs};
        });
    }, []);

    const deleteKhatmah = useCallback((id: string) => {
        setState(s => {
            const newKhatmahs = s.khatmahs.filter(k => k.id !== id);
            localStorage.setItem('khatmahs', JSON.stringify(newKhatmahs));
            return {...s, khatmahs: newKhatmahs};
        });
    }, []);

    const addNote = useCallback((n: Omit<Note, 'id'|'timestamp'>) : Note => {
        const newNote: Note = {...n, id: crypto.randomUUID(), timestamp: Date.now()};
        setState(s => {
            const newNotes = [...s.notes, newNote];
            localStorage.setItem('notes', JSON.stringify(newNotes));
            return {...s, notes: newNotes};
        });
        return newNote;
    }, []);
    
    const updateNote = useCallback((note: Note) => {
         setState(s => {
            const newNotes = s.notes.map(n => n.id === note.id ? note : n);
            localStorage.setItem('notes', JSON.stringify(newNotes));
            return {...s, notes: newNotes};
        });
    }, []);

    const deleteNote = useCallback((id: string) => {
        setState(s => {
            const newNotes = s.notes.filter(n => n.id !== id);
            localStorage.setItem('notes', JSON.stringify(newNotes));
            return {...s, notes: newNotes};
        });
    }, []);
    
    const addTasbeehCounter = useCallback((c: Omit<TasbeehCounter, 'id'|'lastModified'|'count'>) => {
        setState(s => {
            const newCounter: TasbeehCounter = {...c, id: crypto.randomUUID(), count: 0, lastModified: Date.now() };
            const newCounters = [...s.tasbeehCounters, newCounter];
            localStorage.setItem('tasbeehCounters', JSON.stringify(newCounters));
            return {...s, tasbeehCounters: newCounters};
        });
    }, []);
    
    const updateTasbeehCounter = useCallback((id: string, count: number) => {
        setState(s => {
            const newCounters = s.tasbeehCounters.map(c => c.id === id ? {...c, count, lastModified: Date.now()} : c);
            localStorage.setItem('tasbeehCounters', JSON.stringify(newCounters));
            return {...s, tasbeehCounters: newCounters};
        });
    }, []);
    
    const updateTasbeehCounterDetails = useCallback((id: string, details: Partial<Omit<TasbeehCounter, 'id'>>) => {
        setState(s => {
            const newCounters = s.tasbeehCounters.map(c => 
                c.id === id ? { ...c, ...details, lastModified: Date.now() } : c
            );
            localStorage.setItem('tasbeehCounters', JSON.stringify(newCounters));
            return { ...s, tasbeehCounters: newCounters };
        });
    }, []);
    
    const deleteTasbeehCounter = useCallback((id: string) => {
        setState(s => {
            const newCounters = s.tasbeehCounters.filter(c => c.id !== id);
            localStorage.setItem('tasbeehCounters', JSON.stringify(newCounters));
            return {...s, tasbeehCounters: newCounters};
        });
    }, []);

    const resetTasbeehCounter = useCallback((id: string) => {
        updateTasbeehCounter(id, 0);
    }, [updateTasbeehCounter]);

    const resetAllTasbeehCounters = useCallback(() => {
        setState(prevState => {
            const { tasbeehCounters } = prevState;
            if (tasbeehCounters.length === 0) {
                return prevState;
            }
            
            // Check if any counter actually needs resetting to avoid unnecessary re-renders.
            const anyChanges = tasbeehCounters.some(c => c.count !== 0);
            if (!anyChanges) {
                return prevState;
            }

            const updatedCounters = tasbeehCounters.map(counter => ({
                ...counter,
                count: 0,
                lastModified: Date.now(),
            }));

            localStorage.setItem('tasbeehCounters', JSON.stringify(updatedCounters));
            
            return { ...prevState, tasbeehCounters: updatedCounters };
        });
    }, []);

    const setReciter = useCallback((id: number) => {
        setState(s => ({ ...s, selectedReciterId: id, isPlaying: false, audioQueue: [], currentAudioIndex: 0 }));
        localStorage.setItem('selectedReciterId', String(id));
    }, []);

    const setTafsir = useCallback((id: number) => {
        setState(s => ({ ...s, selectedTafsirId: id }));
        localStorage.setItem('selectedTafsirId', String(id));
    }, []);

    const setTranslation = useCallback((id: number) => {
        setState(s => ({ ...s, selectedTranslationId: id }));
        localStorage.setItem('selectedTranslationId', String(id));
    }, []);
    
    const recordUserActivity = useCallback(() => {
        setState(s => ({ ...s, lastActivityTimestamp: Date.now(), isUIVisible: true }));
    }, []);

    const toggleUIVisibility = useCallback(() => {
        setState(s => ({
            ...s,
            isUIVisible: !s.isUIVisible,
            lastActivityTimestamp: Date.now(), // Reset timer on any manual interaction
        }));
    }, []);
    
    const contextValue: AppContextType = useMemo(() => ({
        state,
        actions: {
            loadPage,
            setTheme,
            setFont,
            setFontSize,
            openPanel,
            setReadingMode,
            selectAyah,
            togglePlayPause,
            playNext,
            playPrev,
            toggleBookmark,
            addKhatmah,
            updateKhatmahProgress,
            deleteKhatmah,
            addNote,
            updateNote,
            deleteNote,
            addTasbeehCounter,
            updateTasbeehCounter,
            updateTasbeehCounterDetails,
            deleteTasbeehCounter,
            resetTasbeehCounter,
            resetAllTasbeehCounters,
            setReciter,
            setTafsir,
            setTranslation,
            fetchWithRetry,
            setState,
            recordUserActivity,
            toggleUIVisibility,
        }
    }), [state, loadPage, setTheme, setFont, setFontSize, openPanel, setReadingMode, selectAyah, togglePlayPause, playNext, playPrev, toggleBookmark, addKhatmah, updateKhatmahProgress, deleteKhatmah, addNote, updateNote, deleteNote, addTasbeehCounter, updateTasbeehCounter, updateTasbeehCounterDetails, deleteTasbeehCounter, resetTasbeehCounter, resetAllTasbeehCounters, setReciter, setTafsir, setTranslation, fetchWithRetry, recordUserActivity, toggleUIVisibility]);
    
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', state.theme);
    }, [state.theme]);
    
     useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl) return;

        const handleEnded = () => playNext();
        const handleSrcAndPlay = () => {
            const currentAudioUrl = state.audioQueue[state.currentAudioIndex]?.url;
            if (currentAudioUrl && audioEl.src !== currentAudioUrl) {
                audioEl.src = currentAudioUrl;
            }
            if (state.isPlaying) {
                audioEl.play().catch(e => console.error("Audio play failed:", e));
            } else {
                audioEl.pause();
            }
        };
        
        handleSrcAndPlay();
        audioEl.addEventListener('ended', handleEnded);

        return () => {
            audioEl.removeEventListener('ended', handleEnded);
        };
    }, [state.isPlaying, state.currentAudioIndex, state.audioQueue, playNext]);


    if (!state.isInitialized && state.isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-bg-primary text-text-primary">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
                    <p className="mt-4">جاري تهيئة المصحف...</p>
                </div>
            </div>
        );
    }
    
    return (
        <AppContext.Provider value={contextValue}>
            <div className="h-screen w-screen flex flex-col bg-bg-primary font-ui overflow-hidden">
                <audio ref={audioRef} id="page-audio" className="hidden"></audio>
                {state.readingMode === ReadingMode.Reading && <MainReadingInterface />}
                {state.readingMode === ReadingMode.Memorization && <MemorizationInterface />}

                <AIAssistant />
                
                {/* Panels */}
                <MenuPanel />
                <IndexPanel />
                <SettingsPanel />
                <BookmarksPanel />
                <SearchPanel />
                <StatisticsPanel />
                <KhatmahPanel />
                <SupplicationsPanel />
                <TasbeehPanel />
                <NotesPanel />

                
                {/* Popups / Modals */}
                <TafsirPopup />
                <ShareImageGenerator />
            </div>
        </AppContext.Provider>
    );
};

export default App;