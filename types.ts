// FIX: Import Dispatch and SetStateAction from react to resolve namespace error.
import type { Dispatch, SetStateAction } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Database } from 'sql.js';

export enum ReadingMode {
    Reading = 'reading',
    Memorization = 'memorization',
}

export enum AyahWordState {
    Hidden = 'hidden',
    Waiting = 'waiting',
    Correct = 'correct',
    Incorrect = 'incorrect',
    Skipped = 'skipped',
    Hinted = 'hinted',
    Revealed = 'revealed',
}

export enum Panel {
    Menu = 'menu',
    Index = 'index',
    Settings = 'settings',
    Bookmarks = 'bookmarks',
    Search = 'search',
    Statistics = 'statistics',
    Khatmahs = 'khatmahs',
    Supplications = 'supplications',
    Tasbeeh = 'tasbeeh',
    Notes = 'notes',
    Dashboard = 'dashboard',
    ThematicIndex = 'thematic_index',
    PrayerTimes = 'prayer_times',
    OfflineManager = 'offline_manager',
    Audio = 'audio',
    Hadith = 'hadith',
    Achievements = 'achievements',
}

export enum RepeatMode {
    Off = 'off',
    One = 'one',
    All = 'all',
}

export type Theme = 'light' | 'dark' | 'classic' | 'custom';
export type Font = 'qpc-v1';

export interface Surah {
    id: number;
    revelation_place: string;
    revelation_order: number;
    bismillah_pre: boolean;
    name_simple: string;
    name_complex: string;
    name_arabic: string;
    verses_count: number;
    pages: number[];
    translated_name: {
        language_name: string;
        name: string;
    };
}

export interface Reciter {
    id: number;
    reciter_name: string;
    style: string;
    translated_name?: {
        name: string;
        language_name: string;
    };
}

export interface Tafsir {
    id: number;
    name: string;
    author_name: string;
    language_name: string;
}

export interface Translation {
    id: number;
    name: string;
    author_name: string;
    language_name: string;
}

export interface Audio {
    url: string;
    segments: number[][];
}

export interface Word {
    id: number;
    position: number;
    audio_url: string | null;
    char_type_name: string;
    text_uthmani: string;
    translation: {
        text: string;
        language_name: string;
    }
}




export interface Verse {
    id: number;
    verse_number: number;
    verse_key: string;
    juz_number: number;
    page_number: number;
    text_uthmani: string;
    audio?: Audio;
    words: Word[];
    tafsirs?: { id: number, text: string }[];
    translations?: { id: number, text: string }[];
    chapter_id: number;
}

export interface Bookmark {
    verseKey: string;
    verseText: string;
    surahName: string;
    timestamp: number;
}

export interface Khatmah {
    id: string;
    name: string;
    startDate: string;
    duration: number; // in days
    pagesRead: number;
    completed: boolean;
}

export interface Note {
    id: string;
    verseKey: string;
    verseText: string;
    surahName: string;
    text: string;
    timestamp: number;
}

export interface TasbeehCounter {
    id: string;
    name: string;
    count: number;
    target: number;
    lastModified: number;
}

export interface SearchResultItem {
    verse_key: string;
    verse_id: number;
    text: string;
    highlighted?: string | null;
    words?: { char_type: string; text: string }[];
}

export interface SearchResponse {
    search: {
        query: string;
        total_results: number;
        current_page: number;
        total_pages: number;
        results: SearchResultItem[];
    }
}

export type DownloadStatus = 'downloading' | 'paused' | 'completed' | 'error' | 'deleting';

export interface AppState {
    isInitialized: boolean;
    currentPage: number;
    theme: Theme;
    font: Font;
    fontSize: number;
    readingMode: ReadingMode;
    surahs: Surah[];
    reciters: Reciter[];
    pageData: {
        left: Verse[] | null;
        right: Verse[] | null;
    };
    isLoading: boolean;
    error: string | null;
    activePanel: Panel | null;
    selectedAyah: Verse | null;
    showTafsir: boolean;
    isPlaying: boolean;
    currentAudioIndex: number;
    audioQueue: { url: string; verseKey: string }[];
    bookmarks: Bookmark[];
    khatmahs: Khatmah[];
    notes: Note[];
    tasbeehCounters: TasbeehCounter[];
    readingLog: { [date: string]: number[] }; // date: YYYY-MM-DD, value: array of page numbers
    noteVerseTarget: Verse | null;
    ai: GoogleGenAI | null;
    tafsirs: Tafsir[];
    translations: Translation[];
    selectedReciterId: number;
    selectedTafsirId: number;
    selectedTranslationId: number;
    playingVerseHighlightColor: string;
    isUIVisible: boolean;
    showShareImageModal: boolean;
    isAIAssistantOpen: boolean;
    aiAutoPrompt: string | null;
    isFirstLaunch: boolean;
    selectedWord: { verse: Verse, word: Word } | null;
    highlightedAyahKey: string | null;
    contextMenuInitialWordPosition: number | null;
    playbackRate: number;
    isAutoScrolling: boolean;
    autoScrollSpeed: number;
    downloadProgress: { [key: string]: { loaded: number; total: number; status: DownloadStatus } };
    offlineStatus: {
        quranText: boolean;
        reciters: number[];
        translations: number[];
    };
    repeatMode: RepeatMode;
    audioDuration: number;
    audioCurrentTime: number;
    isVerseByVerseLayout: boolean;
    favoriteReciters: number[];
    favoriteTafsirs: number[];
    favoriteTranslations: number[];
    isReciterModalOpen: boolean;
    isTafsirModalOpen: boolean;
    isTranslationModalOpen: boolean;
    isRangeModalOpen: boolean;
    wordGlyphData: { [key: string]: { id: number; text: string } } | null;
    layoutDb: Database | null;
    prayerTimes: { [key: string]: string; } | null;
    locationName: string | null;
    prayerTimesStatus: 'idle' | 'loading' | 'success' | 'error';
    notificationPermission: NotificationPermission;
    customThemeColor: string;
    areNotificationsEnabled: boolean;
    lastRead: { verseKey: string; pageNumber: number; text: string; surahName: string } | null;
    memorizationStats: { points: number; streak: number };
}

export type DownloadableItem = {
    id: number | string;
    name: string;
}

export interface AppActions {
    loadPage: (pageNumber: number) => Promise<void>;
    setTheme: (theme: Theme) => void;
    setFont: (font: Font) => void;
    setFontSize: (size: number) => void;
    openPanel: (panel: Panel | null) => void;
    setReadingMode: (mode: ReadingMode) => void;
    selectAyah: (ayah: Verse | null, initialActiveWordPosition?: number) => void;
    clearAyahHighlight: () => void;
    togglePlayPause: () => void;
    playNext: () => void;
    playPrev: () => void;
    playRange: (startVerseKey: string, endVerseKey: string) => Promise<void>;
    toggleBookmark: (verse: Verse) => void;
    addKhatmah: (khatmah: Omit<Khatmah, 'id' | 'completed' | 'pagesRead'>) => void;
    updateKhatmahProgress: (id: string, pagesRead: number) => void;
    deleteKhatmah: (id: string) => void;
    addNote: (note: Omit<Note, 'id' | 'timestamp'>) => Note;
    updateNote: (note: Note) => void;
    deleteNote: (id: string) => void;
    addTasbeehCounter: (counter: Omit<TasbeehCounter, 'id' | 'lastModified' | 'count'>) => void;
    updateTasbeehCounter: (id: string, count: number) => void;
    updateTasbeehCounterDetails: (id: string, details: Partial<Omit<TasbeehCounter, 'id'>>) => void;
    deleteTasbeehCounter: (id: string) => void;
    resetTasbeehCounter: (id: string) => void;
    resetAllTasbeehCounters: () => void;
    setReciter: (id: number) => void;
    setTafsir: (id: number) => void;
    setTranslation: (id: number) => void;
    fetchWithRetry: <T, >(url: string, retries?: number) => Promise<T>;
    setState: Dispatch<SetStateAction<AppState>>;
    recordUserActivity: () => void;
    toggleUIVisibility: () => void;
    selectWord: (verse: Verse, word: Word) => void;
    setPlaybackRate: (rate: number) => void;
    toggleAutoScroll: () => void;
    setAutoScrollSpeed: (speed: number) => void;
    startDownload: (type: 'quranText' | 'reciter' | 'translation', item: DownloadableItem) => Promise<void>;
    deleteDownloadedContent: (type: 'quranText' | 'reciter' | 'translation', id: number | string) => Promise<void>;
    setRepeatMode: (mode: RepeatMode) => void;
    toggleVerseByVerseLayout: () => void;
    getPageData: (pageNumber: number) => Promise<Verse[] | null>;
    toggleFavoriteReciter: (id: number) => void;
    toggleFavoriteTafsir: (id: number) => void;
    toggleFavoriteTranslation: (id: number) => void;
    loadPrayerTimes: () => Promise<void>;
    toggleNotifications: () => Promise<void>;
    setCustomColor: (color: string) => void;
    addMemorizationPoints: (points: number) => void;
}

export interface AppContextType {
    state: AppState;
    actions: AppActions;
}