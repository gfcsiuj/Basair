import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import initSqlJs, { type Database } from 'sql.js';
import { Surah, Verse, Reciter, Tafsir, Translation, Bookmark, Khatmah, AppState, AppContextType, Panel, Theme, Font, ReadingMode, SearchResponse, Note, TasbeehCounter, Word, DownloadableItem, RepeatMode } from './types';
import { API_BASE, AUDIO_BASE, TOTAL_PAGES } from './constants';
import * as offlineManager from './offlineManager';
import { useApp } from './hooks/useApp';
import MainReadingInterface from './components/MainReadingInterface';

import AIAssistant from './components/AIAssistant';
import { MenuPanel, StatisticsPanel, SupplicationsPanel, TasbeehPanel, NotesPanel } from './components/panels/MenuPanel';
import IndexPanel from './components/panels/IndexPanel';
import SettingsPanel from './components/panels/SettingsPanel';
import BookmarksPanel from './components/panels/BookmarksPanel';
import SearchPanel from './components/panels/SearchPanel';
import KhatmahPanel from './components/panels/KhatmahPanel';
import DashboardPanel from './components/panels/DashboardPanel';
import ThematicIndexPanel from './components/panels/ThematicIndexPanel';
import PrayerTimesPanel from './components/panels/PrayerTimesPanel';
import OfflineManagerPanel from './components/panels/OfflineManagerPanel';
import TafsirPopup from './components/TafsirPopup';
import ShareImageGenerator from './components/ShareImageGenerator';
import Onboarding from './components/Onboarding';
import WordPopup from './components/WordPopup';
import AyahContextMenu from './components/AyahContextMenu';
import SelectionModal from './components/modals/SelectionModal';
import { AppContext } from './context';

// Polyfill for crypto.randomUUID() which is not available in non-secure contexts (HTTP)
const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for non-secure contexts
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};


// Create a context to provide state and actions to all components


const customReciters: Reciter[] = [
    { id: 1001, reciter_name: 'أبو بكر الشاطري', style: 'The Quran Project' },
    { id: 1002, reciter_name: 'ناصر القطامي', style: 'The Quran Project' },
    { id: 1003, reciter_name: 'ياسر الدوسري', style: 'The Quran Project' },
    { id: 1004, reciter_name: 'هاني الرفاعي', style: 'The Quran Project' },
];

// --- Reusable Modals (Moved here to avoid stacking context issues) ---

const RangeSelectionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state, actions } = useApp();

    const [startSurah, setStartSurah] = useState('1');
    const [startAyah, setStartAyah] = useState('1');
    const [endSurah, setEndSurah] = useState('1');
    const [endAyah, setEndAyah] = useState('1');

    const startSurahInfo = useMemo(() => state.surahs.find(s => s.id === parseInt(startSurah, 10)), [state.surahs, startSurah]);
    const endSurahInfo = useMemo(() => state.surahs.find(s => s.id === parseInt(endSurah, 10)), [state.surahs, endSurah]);

    useEffect(() => {
        const rightPageFirstVerse = state.pageData.right?.[0];
        const leftPageFirstVerse = state.pageData.left?.[0];
        const currentVerse = rightPageFirstVerse || leftPageFirstVerse;
        const currentSurahId = currentVerse?.chapter_id || 1;

        const surahInfo = state.surahs.find(s => s.id === currentSurahId);
        setStartSurah(String(currentSurahId));
        setEndSurah(String(currentSurahId));
        setStartAyah('1');
        setEndAyah(String(surahInfo?.verses_count || 1));
    }, [state.pageData, state.surahs]);

    const handleStartSurahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStartSurah = e.target.value;
        setStartSurah(newStartSurah);
        setStartAyah('1');
        if (parseInt(newStartSurah, 10) > parseInt(endSurah, 10)) {
            setEndSurah(newStartSurah);
            const newEndSurahInfo = state.surahs.find(s => s.id === parseInt(newStartSurah, 10));
            setEndAyah(String(newEndSurahInfo?.verses_count || 1));
        }
    };

    const handleEndSurahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newEndSurah = e.target.value;
        setEndSurah(newEndSurah);
        const newEndSurahInfo = state.surahs.find(s => s.id === parseInt(newEndSurah, 10));
        setEndAyah(String(newEndSurahInfo?.verses_count || 1));
    };

    const handlePlay = () => {
        if (parseInt(startSurah) > parseInt(endSurah) || (parseInt(startSurah) === parseInt(endSurah) && parseInt(startAyah) > parseInt(endAyah))) {
            alert('نطاق التلاوة غير صحيح. يجب أن تكون البداية قبل النهاية.');
            return;
        }
        const startVerseKey = `${startSurah}:${startAyah}`;
        const endVerseKey = `${endSurah}:${endAyah}`;
        actions.playRange(startVerseKey, endVerseKey);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] grid place-items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-bg-primary rounded-xl w-full max-w-sm shadow-xl p-6 animate-scaleIn" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4 text-text-primary">تحديد نطاق التلاوة</h3>
                <div className="space-y-4">
                    <fieldset className="border border-border p-3 rounded-lg">
                        <legend className="px-2 text-sm text-text-secondary">من</legend>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-text-tertiary">السورة</label>
                                <select value={startSurah} onChange={handleStartSurahChange} className="input w-full bg-bg-secondary border-border text-sm p-2">
                                    {state.surahs.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name_arabic}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-tertiary">الآية</label>
                                <select value={startAyah} onChange={e => setStartAyah(e.target.value)} className="input w-full bg-bg-secondary border-border text-sm p-2">
                                    {Array.from({ length: startSurahInfo?.verses_count || 0 }, (_, i) => i + 1).map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset className="border border-border p-3 rounded-lg">
                        <legend className="px-2 text-sm text-text-secondary">إلى</legend>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-text-tertiary">السورة</label>
                                <select value={endSurah} onChange={handleEndSurahChange} className="input w-full bg-bg-secondary border-border text-sm p-2">
                                    {state.surahs.filter(s => s.id >= parseInt(startSurah, 10)).map(s => <option key={s.id} value={s.id}>{s.id} - {s.name_arabic}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-tertiary">الآية</label>
                                <select value={endAyah} onChange={e => setEndAyah(e.target.value)} className="input w-full bg-bg-secondary border-border text-sm p-2">
                                    {Array.from({ length: endSurahInfo?.verses_count || 0 }, (_, i) => i + 1).map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={handlePlay} className="btn-primary flex-1">بدء التلاوة</button>
                    <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const preloadAudioRef = useRef<HTMLAudioElement>(null);
    const isInitialMount = useRef(true);
    const downloadControllerRef = useRef<AbortController | null>(null);
    const notificationTimers = useRef<number[]>([]);

    const [state, setState] = useState<AppState>({
        isInitialized: false,
        isFirstLaunch: !localStorage.getItem('hasLaunched'),
        currentPage: parseInt(localStorage.getItem('lastPage') || '1'),
        theme: (localStorage.getItem('theme') as Theme) || 'light',
        font: 'qpc-v1',
        fontSize: parseInt(localStorage.getItem('fontSize') || '22'),
        readingMode: ReadingMode.Reading,
        surahs: [],
        reciters: [],
        pageData: { left: null, right: null },
        isLoading: true,
        error: null,
        activePanel: !localStorage.getItem('hasLaunched') ? Panel.Dashboard : null,
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
        showShareImageModal: false,
        isAIAssistantOpen: false,
        aiAutoPrompt: null,
        selectedWord: null,
        playbackRate: parseFloat(localStorage.getItem('playbackRate') || '1'),
        isAutoScrolling: false,
        autoScrollSpeed: 1,
        downloadProgress: {},
        offlineStatus: {
            quranText: false,
            reciters: [],
            translations: [],
        },
        repeatMode: (localStorage.getItem('repeatMode') as RepeatMode) || RepeatMode.Off,
        audioDuration: 0,
        audioCurrentTime: 0,
        isVerseByVerseLayout: JSON.parse(localStorage.getItem('isVerseByVerseLayout') || 'false'),
        favoriteReciters: JSON.parse(localStorage.getItem('favoriteReciters') || '[]'),
        favoriteTafsirs: JSON.parse(localStorage.getItem('favoriteTafsirs') || '[]'),
        favoriteTranslations: JSON.parse(localStorage.getItem('favoriteTranslations') || '[]'),
        isReciterModalOpen: false,
        isTafsirModalOpen: false,
        isTranslationModalOpen: false,
        isRangeModalOpen: false,
        wordGlyphData: null,
        layoutDb: null,
        prayerTimes: null,
        locationName: null,
        prayerTimesStatus: 'idle',
        notificationPermission: 'default',
        areNotificationsEnabled: JSON.parse(localStorage.getItem('areNotificationsEnabled') || 'false'),
        customThemeColor: localStorage.getItem('customThemeColor') || '#10b981',
    });

    // --- API & Data Loading ---
    const fetchWithRetry = useCallback(async <T,>(url: string, retries = 3, signal?: AbortSignal): Promise<T> => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    signal,
                    headers: { 'Accept': 'application/json' },
                });
                const responseText = await response.text();

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);

                if (!responseText) {
                    if (url.includes('/search')) {
                        const emptySearchResponse: SearchResponse = { search: { query: '', total_results: 0, current_page: 1, total_pages: 0, results: [] } };
                        return emptySearchResponse as unknown as T;
                    }
                    throw new Error("API returned an empty response body.");
                }

                return JSON.parse(responseText);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    console.log('Fetch aborted.');
                    throw error;
                }
                console.error(`Fetch attempt ${i + 1} for ${url} failed with error:`, error);
                if (i === retries - 1) throw error;
                await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
        }
        throw new Error("API request failed after multiple retries");
    }, []);

    const getAudioUrlForVerse = useCallback((verse: Verse, reciterId: number): string => {
        if (reciterId >= 1001) {
            const surahId = verse.chapter_id;
            const ayahId = verse.verse_number;
            let reciterCode = 0;
            switch (reciterId) {
                case 1001: reciterCode = 2; break;
                case 1002: reciterCode = 3; break;
                case 1003: reciterCode = 4; break;
                case 1004: reciterCode = 5; break;
            }
            return reciterCode > 0 ? `https://the-quran-project.github.io/Quran-Audio/Data/${reciterCode}/${surahId}_${ayahId}.mp3` : '';
        }
        return verse.audio?.url ? `${AUDIO_BASE}${verse.audio.url}` : '';
    }, []);

    const getPageData = useCallback(async (pageNumber: number, signal?: AbortSignal): Promise<Verse[] | null> => {
        if (pageNumber < 1 || pageNumber > TOTAL_PAGES) return null;
        const apiReciterId = state.selectedReciterId >= 1001 ? 7 : state.selectedReciterId;
        const tafsirId = state.selectedTafsirId;
        const translationId = state.selectedTranslationId;
        const wordParams = state.font === 'qpc-v1' ? '' : '&words=true&word_fields=text_uthmani,translation';
        const url = `${API_BASE}/verses/by_page/${pageNumber}?language=ar${wordParams}&audio=${apiReciterId}&tafsirs=${tafsirId}&translations=${translationId}&fields=text_uthmani,chapter_id,juz_number,page_number,verse_key,verse_number,words,audio`;
        const data = await fetchWithRetry<{ verses: Verse[] }>(url, 3, signal);

        // Manually inject the full audio URL for custom reciters
        return data.verses.map(verse => {
            if (state.selectedReciterId >= 1001) {
                return {
                    ...verse,
                    audio: {
                        url: getAudioUrlForVerse(verse, state.selectedReciterId),
                        segments: []
                    }
                }
            }
            return verse;
        });
    }, [fetchWithRetry, state.selectedReciterId, state.selectedTafsirId, state.selectedTranslationId, getAudioUrlForVerse, state.font]);

    const loadPage = useCallback(async (pageNumber: number) => {
        if (pageNumber < 1 || pageNumber > TOTAL_PAGES) return;
        setState(s => ({ ...s, isLoading: true, error: null }));

        try {
            const fetchAndProcessPage = async (pageNum: number): Promise<Verse[] | null> => {
                if (pageNum < 1 || pageNum > TOTAL_PAGES) return null;
                const offlineData = await offlineManager.getPageData(pageNum);
                return offlineData || await getPageData(pageNum);
            };

            const pageData = await fetchAndProcessPage(pageNumber);
            const allVerses = pageData || [];

            const audioQueue = await Promise.all(allVerses.map(async v => {
                let audioUrl = '';
                const offlineAudio = await offlineManager.getRecitationAudio(state.selectedReciterId, v.verse_key);
                if (offlineAudio) {
                    audioUrl = URL.createObjectURL(offlineAudio);
                } else {
                    audioUrl = getAudioUrlForVerse(v, state.selectedReciterId);
                }
                return { url: audioUrl, verseKey: v.verse_key };
            }));

            setState(s => ({
                ...s,
                currentPage: pageNumber,
                // Always render as a single page view. `right` holds the data. `left` is null.
                pageData: { left: null, right: pageData },
                audioQueue,
                currentAudioIndex: 0,
                isLoading: false
            }));
            localStorage.setItem('lastPage', String(pageNumber));

            const today = new Date().toISOString().split('T')[0];
            setState(s => {
                const newLog = { ...s.readingLog };
                if (!newLog[today]) newLog[today] = [];
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
    }, [getPageData, state.selectedReciterId, getAudioUrlForVerse]);

    const playRange = useCallback(async (startVerseKey: string, endVerseKey: string) => {
        try {
            const [startSurah, startAyah] = startVerseKey.split(':').map(Number);
            const [endSurah, endAyah] = endVerseKey.split(':').map(Number);

            const verseKeysInRange: string[] = [];
            for (let s = startSurah; s <= endSurah; s++) {
                const surahInfo = state.surahs.find(surah => surah.id === s);
                if (!surahInfo) continue;

                const firstAyah = (s === startSurah) ? startAyah : 1;
                const lastAyah = (s === endSurah) ? endAyah : surahInfo.verses_count;

                for (let a = firstAyah; a <= lastAyah; a++) {
                    verseKeysInRange.push(`${s}:${a}`);
                }
            }

            const newQueue = verseKeysInRange.map(key => ({ verseKey: key, url: '' }));

            setState(s => ({
                ...s,
                isPlaying: false, // Stop any current playback
            }));

            // Use a timeout to ensure the state updates before starting the new queue
            setTimeout(() => {
                setState(s => ({
                    ...s,
                    audioQueue: newQueue,
                    currentAudioIndex: 0,
                    isPlaying: newQueue.length > 0,
                    activePanel: Panel.Audio,
                    error: null,
                }));
            }, 50);

        } catch (error) {
            console.error("Failed to create playback range:", error);
            setState(s => ({ ...s, isLoading: false, error: 'Failed to create playback range.' }));
        }
    }, [state.surahs]);

    const startDownload = useCallback(async (type: 'quranText' | 'reciter' | 'translation', item: DownloadableItem) => {
        const key = `${type}-${item.id}`;
        if (state.downloadProgress[key]?.status === 'downloading') return;

        downloadControllerRef.current = new AbortController();
        const signal = downloadControllerRef.current.signal;

        setState(s => ({ ...s, downloadProgress: { ...s.downloadProgress, [key]: { loaded: 0, total: TOTAL_PAGES, status: 'downloading' } } }));

        try {
            if (type === 'quranText') {
                for (let i = 1; i <= TOTAL_PAGES; i++) {
                    if (signal.aborted) throw new Error('Download aborted');
                    const existing = await offlineManager.getPageData(i);
                    if (!existing) {
                        const verses = await getPageData(i, signal);
                        if (verses) await offlineManager.savePageData(i, verses);
                    }
                    setState(s => ({ ...s, downloadProgress: { ...s.downloadProgress, [key]: { ...s.downloadProgress[key], loaded: i } } }));
                }
            } else if (type === 'reciter') {
                for (let i = 1; i <= TOTAL_PAGES; i++) {
                    if (signal.aborted) throw new Error('Download aborted');
                    const verses = await getPageData(i, signal);
                    if (!verses) continue;
                    for (const verse of verses) {
                        if (signal.aborted) throw new Error('Download aborted');
                        const audioUrl = getAudioUrlForVerse(verse, item.id as number);
                        if (audioUrl) {
                            const existing = await offlineManager.getRecitationAudio(item.id as number, verse.verse_key);
                            if (!existing) {
                                const response = await fetch(audioUrl, { signal });
                                const audioBlob = await response.blob();
                                await offlineManager.saveRecitationAudio(item.id as number, verse.verse_key, audioBlob);
                            }
                        }
                    }
                    setState(s => ({ ...s, downloadProgress: { ...s.downloadProgress, [key]: { ...s.downloadProgress[key], loaded: i } } }));
                }
            }
            // Handle translation downloads similarly if needed

            setState(s => {
                const newProgress = { ...s.downloadProgress };
                delete newProgress[key];
                const newOfflineStatus = { ...s.offlineStatus };
                if (type === 'quranText') newOfflineStatus.quranText = true;
                if (type === 'reciter' && !newOfflineStatus.reciters.includes(item.id as number)) newOfflineStatus.reciters.push(item.id as number);
                return { ...s, downloadProgress: newProgress, offlineStatus: newOfflineStatus };
            });

        } catch (error) {
            console.error(`Download failed for ${key}:`, error);
            setState(s => ({ ...s, downloadProgress: { ...s.downloadProgress, [key]: { ...s.downloadProgress[key], status: 'error' } } }));
        }

    }, [state.downloadProgress, getPageData, getAudioUrlForVerse]);

    const deleteDownloadedContent = useCallback(async (type: 'quranText' | 'reciter' | 'translation', id: number | string) => {
        const key = `${type}-${id}`;
        setState(s => ({ ...s, downloadProgress: { ...s.downloadProgress, [key]: { loaded: 0, total: 1, status: 'deleting' } } }));

        if (type === 'quranText') {
            await offlineManager.clearStore('quranPages');
            setState(s => ({ ...s, offlineStatus: { ...s.offlineStatus, quranText: false } }));
        } else if (type === 'reciter') {
            await offlineManager.deleteReciter(id as number);
            setState(s => ({ ...s, offlineStatus: { ...s.offlineStatus, reciters: s.offlineStatus.reciters.filter(rId => rId !== id) } }));
        }

        setState(s => {
            const newProgress = { ...s.downloadProgress };
            delete newProgress[key];
            return { ...s, downloadProgress: newProgress };
        });
    }, []);

    const loadPrayerTimes = useCallback(async () => {
        setState(s => ({ ...s, prayerTimesStatus: 'loading' }));

        const onLocationSuccess = async (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;

            try {
                const cityResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`);
                const cityData = await cityResponse.json();
                const locationName = cityData.city || cityData.locality || 'موقع غير معروف';
                setState(s => ({ ...s, locationName }));
            } catch (e) {
                console.error("Failed to fetch city name", e);
                setState(s => ({ ...s, locationName: 'موقع غير معروف' }));
            }

            const date = new Date();
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const formattedDate = `${day}-${month}-${year}`;
            const method = 5;

            try {
                const prayerTimesUrl = `https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
                const response = await fetchWithRetry<{ code: number; data: { timings: { [key: string]: string } } }>(prayerTimesUrl);

                if (response.code === 200) {
                    setState(s => ({
                        ...s,
                        prayerTimes: response.data.timings,
                        prayerTimesStatus: 'success',
                    }));
                } else {
                    throw new Error('API returned non-200 code');
                }
            } catch (error) {
                console.error('Error fetching prayer times:', error);
                setState(s => ({ ...s, prayerTimesStatus: 'error' }));
            }
        };

        const onLocationError = (error: GeolocationPositionError) => {
            console.error("Error getting location:", error.message);
            setState(s => ({ ...s, prayerTimesStatus: 'error' }));
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);
        } else {
            setState(s => ({ ...s, prayerTimesStatus: 'error' }));
        }
    }, [fetchWithRetry]);

    const toggleNotifications = useCallback(async () => {
        let currentPermission = state.notificationPermission;

        if (!('Notification' in window)) {
            alert('هذا المتصفح لا يدعم الإشعارات.');
            return;
        }

        if (currentPermission === 'default') {
            currentPermission = await Notification.requestPermission();
            setState(s => ({ ...s, notificationPermission: currentPermission }));
        }

        if (currentPermission === 'denied') {
            alert('تم رفض إذن الإشعارات. يرجى تفعيلها من إعدادات المتصفح.');
            return;
        }

        if (currentPermission === 'granted') {
            setState(s => {
                const newIsEnabled = !s.areNotificationsEnabled;
                localStorage.setItem('areNotificationsEnabled', JSON.stringify(newIsEnabled));
                if (newIsEnabled) {
                    alert('تم تفعيل إشعارات الصلاة.');
                } else {
                    alert('تم إيقاف إشعارات الصلاة.');
                }
                return { ...s, areNotificationsEnabled: newIsEnabled };
            });
        }
    }, [state.notificationPermission]);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

                if ('Notification' in window) {
                    setState(s => ({ ...s, notificationPermission: Notification.permission }));
                }

                await offlineManager.openDB();
                const quranTextStatus = await offlineManager.isQuranTextDownloaded();
                const recitersStatus = await offlineManager.getDownloadedReciters();

                const [chaptersData, recitationsData, tafsirsData, translationsData, wordGlyphData, dbBuffer] = await Promise.all([
                    fetchWithRetry<{ chapters: Surah[] }>(`${API_BASE}/chapters?language=ar`),
                    fetchWithRetry<{ recitations: Reciter[] }>(`${API_BASE}/resources/recitations?language=ar`),
                    fetchWithRetry<{ tafsirs: Tafsir[] }>(`${API_BASE}/resources/tafsirs?language=ar`),
                    fetchWithRetry<{ translations: Translation[] }>(`${API_BASE}/resources/translations?language=ar`),
                    fetch('/qpc-v4.json').then(res => res.json()),
                    fetch('/qpc-v4-tajweed-15-lines.db').then(res => res.arrayBuffer())
                ]);

                const SQL = await initSqlJs({ locateFile: file => `/${file}` });
                const db = new SQL.Database(new Uint8Array(dbBuffer));

                const processedApiReciters = recitationsData.recitations.map(reciter => ({
                    ...reciter,
                    reciter_name: reciter.translated_name?.name || reciter.reciter_name,
                }));

                const allReciters = [
                    ...processedApiReciters,
                    ...customReciters
                ].sort((a, b) => a.reciter_name.localeCompare(b.reciter_name, 'ar'));

                setState(s => ({
                    ...s,
                    surahs: chaptersData.chapters,
                    reciters: allReciters,
                    tafsirs: tafsirsData.tafsirs,
                    translations: translationsData.translations,
                    ai: aiInstance,
                    offlineStatus: { ...s.offlineStatus, quranText: quranTextStatus, reciters: recitersStatus },
                    wordGlyphData: wordGlyphData,
                    layoutDb: db,
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
        if (state.readingMode === ReadingMode.Reading && (state.pageData.left || state.pageData.right)) {
            loadPage(state.currentPage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.selectedReciterId, state.selectedTafsirId, state.selectedTranslationId]);

    // Effect for prayer time notifications
    useEffect(() => {
        notificationTimers.current.forEach(clearTimeout);
        notificationTimers.current = [];

        if (state.areNotificationsEnabled && state.prayerTimes && state.notificationPermission === 'granted') {
            const now = new Date();
            const prayerNames: { [key: string]: string } = {
                Fajr: 'الفجر',
                Sunrise: 'الشروق',
                Dhuhr: 'الظهر',
                Asr: 'العصر',
                Maghrib: 'المغرب',
                Isha: 'العشاء',
            };

            Object.entries(state.prayerTimes).forEach(([key, time]) => {
                const prayerName = prayerNames[key];
                if (prayerName && time) {
                    const [hours, minutes] = (time as string).split(':').map(Number);
                    const prayerDate = new Date();
                    prayerDate.setHours(hours, minutes, 0, 0);

                    if (prayerDate <= now) {
                        prayerDate.setDate(prayerDate.getDate() + 1);
                    }

                    const timeout = prayerDate.getTime() - now.getTime();
                    if (timeout > 0) {
                        const timerId = setTimeout(() => {
                            try {
                                new Notification(`حان الآن موعد أذان ${prayerName}`, {
                                    body: `حسب التوقيت المحلي لمدينة ${state.locationName || 'موقعك'}.`,
                                    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23059669;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2310b981;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grad)' rx='20'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='45' font-family='Arial' font-weight='bold'%3E%D8%A8%3C/text%3E%3C/svg%3E",
                                    tag: 'basaier-prayer-time'
                                });
                            } catch (e) {
                                console.error("Notification Error:", e);
                            }
                        }, timeout);
                        notificationTimers.current.push(timerId as unknown as number);
                    }
                }
            });
        }

        return () => {
            notificationTimers.current.forEach(clearTimeout);
        };
    }, [state.prayerTimes, state.areNotificationsEnabled, state.notificationPermission, state.locationName]);

    // --- State Management Actions ---
    const setTheme = useCallback((theme: Theme) => {
        setState(s => ({ ...s, theme }));
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        // Apply custom theme colors if switching to custom
        if (theme === 'custom') {
            const savedColor = localStorage.getItem('customThemeColor') || '#10b981';
            applyCustomColor(savedColor);
        }
    }, []);

    const applyCustomColor = useCallback((hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        // Generate lighter and darker variants
        const lighten = (c: number, amt: number) => Math.min(255, Math.round(c + (255 - c) * amt));
        const darken = (c: number, amt: number) => Math.max(0, Math.round(c * (1 - amt)));
        const toHex = (r2: number, g2: number, b2: number) => `#${[r2, g2, b2].map(c => c.toString(16).padStart(2, '0')).join('')}`;

        const root = document.documentElement;
        root.style.setProperty('--custom-primary', hex);
        root.style.setProperty('--custom-primary-light', toHex(lighten(r, 0.3), lighten(g, 0.3), lighten(b, 0.3)));
        root.style.setProperty('--custom-primary-dark', toHex(darken(r, 0.2), darken(g, 0.2), darken(b, 0.2)));
        root.style.setProperty('--custom-secondary', toHex(lighten(r, 0.1), lighten(g, 0.2), lighten(b, 0.4)));
        root.style.setProperty('--custom-highlight', `${r}, ${g}, ${b}`);
        // Keep background/text as light theme defaults for custom
        root.style.setProperty('--custom-bg-primary', '#ffffff');
        root.style.setProperty('--custom-bg-secondary', '#f9fafb');
        root.style.setProperty('--custom-bg-tertiary', '#f3f4f6');
        root.style.setProperty('--custom-text-primary', '#111827');
        root.style.setProperty('--custom-text-secondary', '#6b7280');
        root.style.setProperty('--custom-text-tertiary', '#9ca3af');
        root.style.setProperty('--custom-border', '#e5e7eb');
    }, []);

    const setCustomColor = useCallback((color: string) => {
        setState(s => ({ ...s, customThemeColor: color, theme: 'custom' as Theme }));
        localStorage.setItem('customThemeColor', color);
        localStorage.setItem('theme', 'custom');
        document.documentElement.setAttribute('data-theme', 'custom');
        applyCustomColor(color);
    }, [applyCustomColor]);

    const setFont = useCallback((font: Font) => {
        setState(s => ({ ...s, font }));
        localStorage.setItem('font', font);
    }, []);

    const setFontSize = useCallback((size: number) => {
        setState(s => ({ ...s, fontSize: size }));
        localStorage.setItem('fontSize', String(size));
    }, []);

    const openPanel = useCallback((panel: Panel | null) => {
        setState(s => ({ ...s, activePanel: panel, readingMode: ReadingMode.Reading }));
    }, []);

    const setReadingMode = useCallback((mode: ReadingMode) => {
        setState(s => ({ ...s, readingMode: mode, activePanel: null }));
    }, []);

    const selectAyah = useCallback((ayah: Verse | null) => {
        setState(s => ({ ...s, selectedAyah: ayah, selectedWord: null }));
    }, []);

    const selectWord = useCallback((verse: Verse, word: Word) => {
        try { navigator.vibrate(10); } catch (e) { }
        setState(s => ({ ...s, selectedWord: { verse, word }, selectedAyah: null }));
    }, []);

    const togglePlayPause = useCallback(() => {
        const audioEl = audioRef.current;
        if (!audioEl) return;
        setState(s => ({ ...s, isPlaying: !s.isPlaying }));
    }, []);

    const playNext = useCallback(() => {
        const preloadAudioEl = preloadAudioRef.current;
        if (preloadAudioEl) {
            preloadAudioEl.removeAttribute('src');
            preloadAudioEl.load();
        }

        if (state.currentAudioIndex < state.audioQueue.length - 1) {
            setState(s => ({ ...s, currentAudioIndex: s.currentAudioIndex + 1 }));
        } else if (state.repeatMode === RepeatMode.All) {
            setState(s => ({ ...s, currentAudioIndex: 0 }));
        } else if (state.currentPage < TOTAL_PAGES) {
            const nextPage = state.currentPage + 1;
            loadPage(nextPage).then(() => setState(s => ({ ...s, isPlaying: true })));
        } else {
            setState(s => ({ ...s, isPlaying: false }));
        }
    }, [state.currentAudioIndex, state.audioQueue.length, state.currentPage, loadPage, state.repeatMode]);

    const playPrev = useCallback(() => {
        const preloadAudioEl = preloadAudioRef.current;
        if (preloadAudioEl) {
            preloadAudioEl.removeAttribute('src');
            preloadAudioEl.load();
        }

        if (state.currentAudioIndex > 0) {
            setState(s => ({ ...s, currentAudioIndex: s.currentAudioIndex - 1 }));
        }
    }, [state.currentAudioIndex]);

    const toggleBookmark = useCallback((verse: Verse) => {
        try { navigator.vibrate(20); } catch (e) { }
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
            return { ...s, bookmarks: newBookmarks };
        });
    }, []);

    const toggleFavoriteReciter = useCallback((id: number) => {
        setState(s => {
            const newFavorites = s.favoriteReciters.includes(id)
                ? s.favoriteReciters.filter(favId => favId !== id)
                : [...s.favoriteReciters, id];
            localStorage.setItem('favoriteReciters', JSON.stringify(newFavorites));
            return { ...s, favoriteReciters: newFavorites };
        });
    }, []);

    const toggleFavoriteTafsir = useCallback((id: number) => {
        setState(s => {
            const newFavorites = s.favoriteTafsirs.includes(id)
                ? s.favoriteTafsirs.filter(favId => favId !== id)
                : [...s.favoriteTafsirs, id];
            localStorage.setItem('favoriteTafsirs', JSON.stringify(newFavorites));
            return { ...s, favoriteTafsirs: newFavorites };
        });
    }, []);

    const toggleFavoriteTranslation = useCallback((id: number) => {
        setState(s => {
            const newFavorites = s.favoriteTranslations.includes(id)
                ? s.favoriteTranslations.filter(favId => favId !== id)
                : [...s.favoriteTranslations, id];
            localStorage.setItem('favoriteTranslations', JSON.stringify(newFavorites));
            return { ...s, favoriteTranslations: newFavorites };
        });
    }, []);

    // New CRUD Actions
    const addKhatmah = useCallback((k: Omit<Khatmah, 'id' | 'completed' | 'pagesRead'>) => {
        setState(s => {
            const newKhatmah: Khatmah = { ...k, id: generateUUID(), completed: false, pagesRead: 0 };
            const newKhatmahs = [...s.khatmahs, newKhatmah];
            localStorage.setItem('khatmahs', JSON.stringify(newKhatmahs));
            return { ...s, khatmahs: newKhatmahs };
        });
    }, []);

    const updateKhatmahProgress = useCallback((id: string, pagesRead: number) => {
        setState(s => {
            const newKhatmahs = s.khatmahs.map(k => k.id === id ? { ...k, pagesRead, completed: pagesRead >= TOTAL_PAGES } : k);
            localStorage.setItem('khatmahs', JSON.stringify(newKhatmahs));
            return { ...s, khatmahs: newKhatmahs };
        });
    }, []);

    const deleteKhatmah = useCallback((id: string) => {
        setState(s => {
            const newKhatmahs = s.khatmahs.filter(k => k.id !== id);
            localStorage.setItem('khatmahs', JSON.stringify(newKhatmahs));
            return { ...s, khatmahs: newKhatmahs };
        });
    }, []);

    const addNote = useCallback((n: Omit<Note, 'id' | 'timestamp'>): Note => {
        const newNote: Note = { ...n, id: generateUUID(), timestamp: Date.now() };
        setState(s => {
            const newNotes = [...s.notes, newNote];
            localStorage.setItem('notes', JSON.stringify(newNotes));
            return { ...s, notes: newNotes };
        });
        return newNote;
    }, []);

    const updateNote = useCallback((note: Note) => {
        setState(s => {
            const newNotes = s.notes.map(n => n.id === note.id ? note : n);
            localStorage.setItem('notes', JSON.stringify(newNotes));
            return { ...s, notes: newNotes };
        });
    }, []);

    const deleteNote = useCallback((id: string) => {
        setState(s => {
            const newNotes = s.notes.filter(n => n.id !== id);
            localStorage.setItem('notes', JSON.stringify(newNotes));
            return { ...s, notes: newNotes };
        });
    }, []);

    const addTasbeehCounter = useCallback((c: Omit<TasbeehCounter, 'id' | 'lastModified' | 'count'>) => {
        setState(s => {
            const newCounter: TasbeehCounter = { ...c, id: generateUUID(), count: 0, lastModified: Date.now() };
            const newCounters = [...s.tasbeehCounters, newCounter];
            localStorage.setItem('tasbeehCounters', JSON.stringify(newCounters));
            return { ...s, tasbeehCounters: newCounters };
        });
    }, []);

    const updateTasbeehCounter = useCallback((id: string, count: number) => {
        setState(s => {
            const newCounters = s.tasbeehCounters.map(c => c.id === id ? { ...c, count, lastModified: Date.now() } : c);
            localStorage.setItem('tasbeehCounters', JSON.stringify(newCounters));
            return { ...s, tasbeehCounters: newCounters };
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
            return { ...s, tasbeehCounters: newCounters };
        });
    }, []);

    const resetTasbeehCounter = useCallback((id: string) => {
        updateTasbeehCounter(id, 0);
    }, [updateTasbeehCounter]);

    const resetAllTasbeehCounters = useCallback(() => {
        setState(prevState => {
            const { tasbeehCounters } = prevState;
            if (tasbeehCounters.length === 0) return prevState;
            const anyChanges = tasbeehCounters.some(c => c.count !== 0);
            if (!anyChanges) return prevState;
            const updatedCounters = tasbeehCounters.map(counter => ({ ...counter, count: 0, lastModified: Date.now() }));
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

    const setPlaybackRate = useCallback((rate: number) => {
        setState(s => ({ ...s, playbackRate: rate }));
        localStorage.setItem('playbackRate', String(rate));
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
        }
    }, []);

    const setRepeatMode = useCallback((mode: RepeatMode) => {
        setState(s => ({ ...s, repeatMode: mode }));
        localStorage.setItem('repeatMode', mode);
    }, []);

    const toggleAutoScroll = useCallback(() => {
        setState(s => ({ ...s, isAutoScrolling: !s.isAutoScrolling }));
    }, []);

    const setAutoScrollSpeed = useCallback((speed: number) => {
        setState(s => ({ ...s, autoScrollSpeed: speed }));
    }, []);

    const recordUserActivity = useCallback(() => {
        setState(s => ({ ...s, isUIVisible: true }));
    }, []);

    const toggleUIVisibility = useCallback(() => {
        setState(s => ({
            ...s,
            isUIVisible: !s.isUIVisible,
        }));
    }, []);

    const toggleVerseByVerseLayout = useCallback(() => {
        setState(s => {
            const newValue = !s.isVerseByVerseLayout;
            localStorage.setItem('isVerseByVerseLayout', JSON.stringify(newValue));
            return { ...s, isVerseByVerseLayout: newValue };
        });
    }, []);

    const contextValue: AppContextType = useMemo(() => ({
        state,
        actions: {
            loadPage, setTheme, setFont, setFontSize, openPanel, setReadingMode, selectAyah, togglePlayPause, playNext, playPrev,
            playRange, toggleBookmark, addKhatmah, updateKhatmahProgress, deleteKhatmah, addNote, updateNote, deleteNote,
            addTasbeehCounter, updateTasbeehCounter, updateTasbeehCounterDetails, deleteTasbeehCounter, resetTasbeehCounter, resetAllTasbeehCounters,
            setReciter, setTafsir, setTranslation, fetchWithRetry, setState, recordUserActivity, toggleUIVisibility, selectWord,
            setPlaybackRate, toggleAutoScroll, setAutoScrollSpeed,
            startDownload, deleteDownloadedContent, setRepeatMode, toggleVerseByVerseLayout,
            getPageData, toggleFavoriteReciter, toggleFavoriteTafsir, toggleFavoriteTranslation,
            loadPrayerTimes,
            toggleNotifications,
            setCustomColor,
        }
    }), [state, loadPage, setTheme, setFont, setFontSize, openPanel, setReadingMode, selectAyah, togglePlayPause, playNext, playPrev,
        playRange, toggleBookmark, addKhatmah, updateKhatmahProgress, deleteKhatmah, addNote, updateNote, deleteNote, addTasbeehCounter,
        updateTasbeehCounter, updateTasbeehCounterDetails, deleteTasbeehCounter, resetTasbeehCounter, resetAllTasbeehCounters, setReciter,
        setTafsir, setTranslation, fetchWithRetry, recordUserActivity, toggleUIVisibility, selectWord, setPlaybackRate,
        toggleAutoScroll, setAutoScrollSpeed, startDownload, deleteDownloadedContent, setRepeatMode, toggleVerseByVerseLayout, getPageData, toggleFavoriteReciter, toggleFavoriteTafsir, toggleFavoriteTranslation, loadPrayerTimes, toggleNotifications, setCustomColor]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', state.theme);
        if (state.theme === 'custom') {
            applyCustomColor(state.customThemeColor);
        }
    }, [state.theme, state.customThemeColor, applyCustomColor]);

    useEffect(() => {
        const audioEl = audioRef.current;
        const preloadAudioEl = preloadAudioRef.current;
        if (!audioEl || !preloadAudioEl) return;

        audioEl.playbackRate = state.playbackRate;

        const handleEnded = () => {
            if (state.repeatMode === RepeatMode.One) {
                audioEl.currentTime = 0;
                audioEl.play().catch(e => console.error("Repeat playback failed", e));
                return;
            }
            playNext();
        };

        const handleTimeUpdate = () => {
            setState(s => ({ ...s, audioCurrentTime: audioEl.currentTime }));
        };

        const handleLoadedMetadata = () => {
            setState(s => ({ ...s, audioDuration: audioEl.duration }));
        };

        const playCurrentAudio = async () => {
            const currentAudioItem = state.audioQueue[state.currentAudioIndex];

            if (!currentAudioItem) {
                if (state.isPlaying) playNext();
                return;
            }

            // If we have a verse key, make sure we are on the right page.
            if (currentAudioItem.verseKey) {
                const allPageVerses = [...(state.pageData.left || []), ...(state.pageData.right || [])];
                const isVerseOnPage = allPageVerses.some(v => v.verse_key === currentAudioItem.verseKey);
                if (!isVerseOnPage) {
                    try {
                        const verseInfo = await fetchWithRetry<{ verse: { page_number: number } }>(`${API_BASE}/verses/by_key/${currentAudioItem.verseKey}?fields=page_number`);
                        const newPageNumber = verseInfo.verse.page_number;
                        if (newPageNumber !== state.currentPage) {
                            // The loadPage function will automatically handle fetching the correct spread
                            await loadPage(newPageNumber);
                            // The effect will re-run with the correct page data.
                            return;
                        }
                    } catch (e) {
                        console.error("Failed to navigate to verse page for playback:", e);
                        playNext(); // Skip to next if page load fails
                        return;
                    }
                }
            }

            let audioUrl = currentAudioItem.url;

            // If URL is missing (e.g., from range playback), fetch it
            if (!audioUrl && currentAudioItem.verseKey) {
                try {
                    const offlineAudio = await offlineManager.getRecitationAudio(state.selectedReciterId, currentAudioItem.verseKey);
                    if (offlineAudio) {
                        audioUrl = URL.createObjectURL(offlineAudio);
                    } else {
                        const apiReciterId = state.selectedReciterId >= 1001 ? 7 : state.selectedReciterId;
                        const verseData = await fetchWithRetry<{ verse: Verse }>(`${API_BASE}/verses/by_key/${currentAudioItem.verseKey}?fields=chapter_id,verse_number&audio=${apiReciterId}`);
                        audioUrl = getAudioUrlForVerse(verseData.verse, state.selectedReciterId);
                    }

                    // Update queue with the fetched URL for caching
                    const newQueue = [...state.audioQueue];
                    if (newQueue[state.currentAudioIndex]) {
                        newQueue[state.currentAudioIndex].url = audioUrl;
                        setState(s => ({ ...s, audioQueue: newQueue }));
                    }
                } catch (e) {
                    console.error("Failed to fetch audio URL for", currentAudioItem.verseKey, e);
                    playNext(); // Skip this verse
                    return;
                }
            }

            if (audioUrl) {
                if (audioEl.src !== audioUrl) {
                    audioEl.src = audioUrl;
                    audioEl.load(); // Important for metadata to load correctly
                }
                const playPromise = audioEl.play();
                if (playPromise) {
                    playPromise.catch(error => {
                        if (error.name !== 'AbortError') {
                            console.error("Audio play failed:", error);
                            setState(s => ({ ...s, isPlaying: false }));
                        }
                    });
                }

                // Preload next track
                const nextAudioIndex = state.currentAudioIndex + 1;
                if (nextAudioIndex < state.audioQueue.length) {
                    const nextAudioUrl = state.audioQueue[nextAudioIndex].url;
                    if (nextAudioUrl && preloadAudioEl.src !== nextAudioUrl) {
                        preloadAudioEl.src = nextAudioUrl;
                        preloadAudioEl.load();
                    }
                }
            } else {
                playNext();
            }
        };


        if (state.isPlaying) {
            playCurrentAudio();
        } else {
            audioEl.pause();
        }

        audioEl.addEventListener('ended', handleEnded);
        audioEl.addEventListener('timeupdate', handleTimeUpdate);
        audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            audioEl.removeEventListener('ended', handleEnded);
            audioEl.removeEventListener('timeupdate', handleTimeUpdate);
            audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [state.isPlaying, state.currentAudioIndex, state.audioQueue, playNext, state.playbackRate, state.repeatMode, fetchWithRetry, getAudioUrlForVerse, state.selectedReciterId, state.pageData, state.currentPage, loadPage]);


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
                {state.isFirstLaunch && <Onboarding />}
                <audio ref={audioRef} id="page-audio" className="hidden"></audio>
                <audio ref={preloadAudioRef} className="hidden" preload="auto"></audio>

                {state.readingMode === ReadingMode.Reading && <MainReadingInterface />}

                <AIAssistant />

                {/* Panels */}
                <MenuPanel />
                <DashboardPanel />
                <IndexPanel />
                <ThematicIndexPanel />
                <PrayerTimesPanel />
                <SettingsPanel />
                <BookmarksPanel />
                <SearchPanel />
                <StatisticsPanel />
                <KhatmahPanel />
                <SupplicationsPanel />
                <TasbeehPanel />
                <NotesPanel />
                <OfflineManagerPanel />

                {/* Popups / Modals */}
                <TafsirPopup />
                <WordPopup />
                <AyahContextMenu />
                <ShareImageGenerator />
                {state.isReciterModalOpen && (
                    <SelectionModal
                        title="اختر القارئ"
                        items={state.reciters.map(r => ({ id: r.id, name: r.reciter_name, subtext: r.style }))}
                        selectedId={state.selectedReciterId}
                        favorites={state.favoriteReciters}
                        onSelect={setReciter}
                        onToggleFavorite={toggleFavoriteReciter}
                        onClose={() => setState(s => ({ ...s, isReciterModalOpen: false }))}
                    />
                )}
                {state.isTafsirModalOpen && (
                    <SelectionModal
                        title="اختر التفسير"
                        items={state.tafsirs.map(t => ({ id: t.id, name: t.name, subtext: t.author_name }))}
                        selectedId={state.selectedTafsirId}
                        favorites={state.favoriteTafsirs}
                        onSelect={setTafsir}
                        onToggleFavorite={toggleFavoriteTafsir}
                        onClose={() => setState(s => ({ ...s, isTafsirModalOpen: false }))}
                    />
                )}
                {state.isTranslationModalOpen && (
                    <SelectionModal
                        title="اختر الترجمة"
                        items={state.translations.map(t => ({ id: t.id, name: t.name, subtext: t.language_name }))}
                        selectedId={state.selectedTranslationId}
                        favorites={state.favoriteTranslations}
                        onSelect={setTranslation}
                        onToggleFavorite={toggleFavoriteTranslation}
                        onClose={() => setState(s => ({ ...s, isTranslationModalOpen: false }))}
                    />
                )}
                {state.isRangeModalOpen && <RangeSelectionModal onClose={() => setState(s => ({ ...s, isRangeModalOpen: false }))} />}
            </div>
        </AppContext.Provider>
    );
};

export default App;