import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';
import { showToast } from '../ToastContainer';

const HADITH_API = 'https://hadeethenc.com/api/v1';

interface HadithCategory {
    id: string;
    title: string;
    hadeeths_count: string;
    parent_id: string | null;
}

interface HadithListItem {
    id: string;
    title: string;
}

interface HadithMeta {
    current_page: string;
    last_page: number;
    total_items: number;
    per_page: string;
}

interface HadithDetail {
    id: string;
    title: string;
    hadeeth: string;
    attribution: string;
    grade: string;
    explanation: string;
    hints: string[];
    categories: string[];
    reference: string;
}

// SVG decorative element for hadith header
const HadithDecoration = () => (
    <svg viewBox="0 0 120 40" className="w-24 h-8 text-primary/30 mx-auto" fill="none">
        <path d="M0 20 Q15 5 30 20 Q45 35 60 20 Q75 5 90 20 Q105 35 120 20" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="60" cy="20" r="4" fill="currentColor" opacity="0.5" />
        <circle cx="30" cy="20" r="2.5" fill="currentColor" opacity="0.3" />
        <circle cx="90" cy="20" r="2.5" fill="currentColor" opacity="0.3" />
    </svg>
);

// Grade badge color
const gradeColor = (grade: string) => {
    if (!grade) return 'bg-gray-500/10 text-gray-500';
    if (grade.includes('\u0635\u062d\u064a\u062d')) return 'bg-emerald-500/15 text-emerald-600';
    if (grade.includes('\u062d\u0633\u0646')) return 'bg-amber-500/15 text-amber-600';
    if (grade.includes('\u0636\u0639\u064a\u0641')) return 'bg-red-500/15 text-red-500';
    return 'bg-blue-500/10 text-blue-500';
};

// Category icon mapping
const CATEGORY_ICONS: Record<string, string> = {
    '1': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', // Quran
    '2': 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', // Hadith
    '3': 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z', // Aqeedah
    '4': 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z', // Fiqh
    '5': 'M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z', // Virtues
    '6': 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46', // Da'wah
    '7': 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', // History
};

const getCategoryIcon = (id: string) => CATEGORY_ICONS[id] || CATEGORY_ICONS['1'];

const HadithPanel: React.FC = () => {
    const { state } = useApp();
    const [activeTab, setActiveTab] = useState<'browse' | 'search' | 'saved'>('browse');

    // Browse state
    const [rootCategories, setRootCategories] = useState<HadithCategory[]>([]);
    const [subCategories, setSubCategories] = useState<HadithCategory[]>([]);
    const [selectedRoot, setSelectedRoot] = useState<HadithCategory | null>(null);
    const [selectedSub, setSelectedSub] = useState<HadithCategory | null>(null);

    // Hadith list state
    const [hadithList, setHadithList] = useState<HadithListItem[]>([]);
    const [hadithMeta, setHadithMeta] = useState<HadithMeta | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Detail state
    const [selectedHadith, setSelectedHadith] = useState<HadithDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<HadithListItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    // Saved hadiths
    const [savedHadiths, setSavedHadiths] = useState<HadithDetail[]>(() => {
        try { return JSON.parse(localStorage.getItem('savedHadithsData') || '[]'); } catch { return []; }
    });
    const savedIds = useMemo(() => new Set(savedHadiths.map(h => h.id)), [savedHadiths]);

    // View: 'roots' | 'subs' | 'list' | 'detail'
    const [browseView, setBrowseView] = useState<'roots' | 'subs' | 'list' | 'detail'>('roots');

    // Load root categories
    useEffect(() => {
        if (state.activePanel !== PanelType.Hadith) return;
        if (rootCategories.length > 0) return;
        setIsLoading(true);
        fetch(`${HADITH_API}/categories/roots/?language=ar`)
            .then(r => r.json())
            .then((data: HadithCategory[]) => {
                setRootCategories(data);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
                showToast('\u0641\u0634\u0644 \u0641\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u0635\u0646\u064a\u0641\u0627\u062a', 'error');
            });
    }, [state.activePanel, rootCategories.length]);

    // Load sub-categories for a root
    const loadSubCategories = useCallback((root: HadithCategory) => {
        setSelectedRoot(root);
        setBrowseView('subs');
        setIsLoading(true);
        fetch(`${HADITH_API}/categories/list/?language=ar&category_id=${root.id}`)
            .then(r => r.json())
            .then((data: HadithCategory[]) => {
                // Filter to only direct children of this root
                const subs = data.filter(c => c.parent_id === root.id);
                setSubCategories(subs);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
                showToast('\u0641\u0634\u0644 \u0641\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u0635\u0646\u064a\u0641\u0627\u062a \u0627\u0644\u0641\u0631\u0639\u064a\u0629', 'error');
            });
    }, []);

    // Load hadith list for a category
    const loadHadithList = useCallback((category: HadithCategory, page = 1, append = false) => {
        if (!append) {
            setSelectedSub(category);
            setBrowseView('list');
            setIsLoading(true);
            setCurrentPage(1);
        } else {
            setIsLoadingMore(true);
        }
        fetch(`${HADITH_API}/hadeeths/list/?language=ar&category_id=${category.id}&page=${page}&per_page=15`)
            .then(r => r.json())
            .then((data: { data: HadithListItem[]; meta: HadithMeta }) => {
                if (append) {
                    setHadithList(prev => [...prev, ...(data.data || [])]);
                } else {
                    setHadithList(data.data || []);
                }
                setHadithMeta(data.meta);
                setCurrentPage(page);
                setIsLoading(false);
                setIsLoadingMore(false);
            })
            .catch(() => {
                setIsLoading(false);
                setIsLoadingMore(false);
                showToast('\u0641\u0634\u0644 \u0641\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0623\u062d\u0627\u062f\u064a\u062b', 'error');
            });
    }, []);

    // Load hadith detail
    const loadHadithDetail = useCallback((hadithId: string) => {
        setIsLoading(true);
        fetch(`${HADITH_API}/hadeeths/one/?language=ar&id=${hadithId}`)
            .then(r => r.json())
            .then((data: HadithDetail) => {
                setSelectedHadith(data);
                setBrowseView('detail');
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
                showToast('\u0641\u0634\u0644 \u0641\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062d\u062f\u064a\u062b', 'error');
            });
    }, []);

    // Search
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (searchTimer) clearTimeout(searchTimer);
        if (!query.trim()) { setSearchResults([]); return; }
        const timer = setTimeout(() => {
            setIsSearching(true);
            // Search across all root categories
            Promise.all(
                rootCategories.map(cat =>
                    fetch(`${HADITH_API}/hadeeths/list/?language=ar&category_id=${cat.id}&page=1&per_page=10`)
                        .then(r => r.json())
                        .then((d: { data: HadithListItem[] }) => d.data || [])
                        .catch(() => [] as HadithListItem[])
                )
            ).then(results => {
                const all = results.flat();
                const filtered = all.filter(h => h.title.includes(query));
                setSearchResults(filtered);
                setIsSearching(false);
            });
        }, 400);
        setSearchTimer(timer);
    }, [searchTimer, rootCategories]);

    // Save/unsave hadith
    const toggleSave = useCallback((hadith: HadithDetail) => {
        setSavedHadiths(prev => {
            const exists = prev.some(h => h.id === hadith.id);
            const next = exists ? prev.filter(h => h.id !== hadith.id) : [...prev, hadith];
            localStorage.setItem('savedHadithsData', JSON.stringify(next));
            showToast(exists ? '\u062a\u0645 \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u062d\u062f\u064a\u062b' : '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062d\u062f\u064a\u062b', exists ? 'info' : 'success');
            return next;
        });
    }, []);

    // Share hadith
    const shareHadith = useCallback((hadith: HadithDetail) => {
        const text = `${hadith.hadeeth}\n\n${hadith.attribution}\n\u2014 \u0628\u0635\u0627\u0626\u0631`;
        if (navigator.share) {
            navigator.share({ title: hadith.title, text });
        } else {
            navigator.clipboard.writeText(text);
            showToast('\u062a\u0645 \u0646\u0633\u062e \u0627\u0644\u062d\u062f\u064a\u062b', 'success');
        }
    }, []);

    // Navigation
    const goBack = () => {
        if (browseView === 'detail') {
            setSelectedHadith(null);
            setBrowseView('list');
        } else if (browseView === 'list') {
            setSelectedSub(null);
            setHadithList([]);
            setHadithMeta(null);
            setBrowseView('subs');
        } else if (browseView === 'subs') {
            setSelectedRoot(null);
            setSubCategories([]);
            setBrowseView('roots');
        }
    };

    // --- RENDER HELPERS ---

    const renderLoader = () => (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-[3px] border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin"></div>
            </div>
            <p className="text-text-tertiary text-sm">{'\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...'}</p>
        </div>
    );

    const renderRootCategories = () => (
        <div className="p-4 space-y-3">
            {/* Hero card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-bg-secondary to-primary/5 p-5 rounded-2xl border border-primary/10">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
                <div className="relative">
                    <HadithDecoration />
                    <h3 className="text-center text-lg font-bold text-text-primary mt-2">{'\u0623\u062d\u0627\u062f\u064a\u062b \u0627\u0644\u0646\u0628\u064a \ufdfa'}</h3>
                    <p className="text-center text-xs text-text-tertiary mt-1">{'\u0623\u0643\u062b\u0631 \u0645\u0646 4,000 \u062d\u062f\u064a\u062b \u0645\u0639 \u0627\u0644\u0634\u0631\u062d \u0648\u0627\u0644\u0641\u0648\u0627\u0626\u062f'}</p>
                </div>
            </div>

            {/* Category cards */}
            <div className="space-y-2.5">
                {rootCategories.map((cat, i) => (
                    <button
                        key={cat.id}
                        onClick={() => loadSubCategories(cat)}
                        className="w-full flex items-center gap-3.5 p-4 bg-bg-secondary rounded-2xl hover:bg-bg-tertiary transition-all animate-listItemEnter active:scale-[0.98] border border-border/30 hover:border-primary/30 group"
                        style={{ animationDelay: `${i * 40}ms` }}
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={getCategoryIcon(cat.id)} />
                            </svg>
                        </div>
                        <div className="flex-1 text-right min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate">{cat.title}</p>
                            <p className="text-[11px] text-text-tertiary mt-0.5">{cat.hadeeths_count} {'\u062d\u062f\u064a\u062b'}</p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                            <svg className="w-3.5 h-3.5 text-text-tertiary group-hover:text-primary transition-colors rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderSubCategories = () => (
        <div className="p-4 space-y-3">
            {/* Back + title */}
            <button onClick={goBack} className="flex items-center gap-2 text-primary text-sm font-medium hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span>{'\u0631\u062c\u0648\u0639'}</span>
            </button>
            <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={getCategoryIcon(selectedRoot?.id || '1')} />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-text-primary text-base">{selectedRoot?.title}</h3>
                    <p className="text-[11px] text-text-tertiary">{selectedRoot?.hadeeths_count} {'\u062d\u062f\u064a\u062b'}</p>
                </div>
            </div>

            <div className="space-y-2">
                {subCategories.map((cat, i) => (
                    <button
                        key={cat.id}
                        onClick={() => loadHadithList(cat)}
                        className="w-full flex items-center justify-between p-3.5 bg-bg-secondary rounded-xl hover:bg-bg-tertiary transition-all animate-listItemEnter active:scale-[0.98] border border-border/20"
                        style={{ animationDelay: `${i * 25}ms` }}
                    >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-primary/8 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-primary">{parseInt(cat.hadeeths_count)}</span>
                            </div>
                            <p className="text-sm font-medium text-text-primary truncate">{cat.title}</p>
                        </div>
                        <svg className="w-4 h-4 text-text-tertiary shrink-0 rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderHadithList = () => (
        <div className="p-4 space-y-3">
            <button onClick={goBack} className="flex items-center gap-2 text-primary text-sm font-medium hover:opacity-80">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span>{'\u0631\u062c\u0648\u0639'}</span>
            </button>
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary">{selectedSub?.title}</h3>
                {hadithMeta && <span className="text-[11px] text-text-tertiary bg-bg-tertiary px-2.5 py-1 rounded-full">{hadithMeta.total_items} {'\u062d\u062f\u064a\u062b'}</span>}
            </div>

            <div className="space-y-2">
                {hadithList.map((item, i) => (
                    <button
                        key={item.id}
                        onClick={() => loadHadithDetail(item.id)}
                        className="w-full text-right p-4 bg-bg-secondary rounded-xl hover:bg-bg-tertiary transition-all animate-listItemEnter active:scale-[0.98] border border-border/20 group"
                        style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary/8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                            </div>
                            <p className="text-sm font-medium text-text-primary flex-1 leading-relaxed">{item.title}</p>
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                {savedIds.has(item.id) && (
                                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                    </svg>
                                )}
                                <svg className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Load more */}
            {hadithMeta && currentPage < hadithMeta.last_page && (
                <button
                    onClick={() => selectedSub && loadHadithList(selectedSub, currentPage + 1, true)}
                    disabled={isLoadingMore}
                    className="w-full py-3.5 bg-primary/10 text-primary rounded-xl font-medium text-sm hover:bg-primary/15 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoadingMore ? (
                        <>
                            <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                            <span>{'\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...'}</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                            </svg>
                            <span>{'\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0632\u064a\u062f'} ({hadithMeta.total_items - hadithList.length} {'\u0645\u062a\u0628\u0642\u064a'})</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );

    const renderHadithDetail = () => {
        if (!selectedHadith) return null;
        const isSaved = savedIds.has(selectedHadith.id);
        return (
            <div className="p-4 space-y-4 pb-8">
                <button onClick={goBack} className="flex items-center gap-2 text-primary text-sm font-medium hover:opacity-80">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <span>{'\u0631\u062c\u0648\u0639'}</span>
                </button>

                {/* Hadith card */}
                <div className="relative overflow-hidden bg-bg-secondary rounded-2xl p-5 border border-border/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/3 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative">
                        <HadithDecoration />
                        <p className="font-arabic text-[17px] leading-[2.4] text-text-primary text-right mt-4" dir="rtl">
                            {selectedHadith.hadeeth}
                        </p>
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
                            <span className="text-xs text-text-tertiary max-w-[60%]">{selectedHadith.attribution}</span>
                            <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${gradeColor(selectedHadith.grade)}`}>
                                {selectedHadith.grade}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Explanation */}
                {selectedHadith.explanation && (
                    <div className="bg-bg-secondary rounded-2xl p-5 border border-border/30">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 01-.937-.171.75.75 0 11.374-1.453 5.261 5.261 0 002.626 0 .75.75 0 11.374 1.452 6.712 6.712 0 01-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-sm text-text-primary">{'\u0634\u0631\u062d \u0627\u0644\u062d\u062f\u064a\u062b'}</h4>
                        </div>
                        <div className="text-sm text-text-secondary leading-[1.9] text-right" dir="rtl" dangerouslySetInnerHTML={{ __html: selectedHadith.explanation }} />
                    </div>
                )}

                {/* Hints */}
                {selectedHadith.hints && selectedHadith.hints.length > 0 && (
                    <div className="bg-bg-secondary rounded-2xl p-5 border border-border/30">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-sm text-text-primary">{'\u0641\u0648\u0627\u0626\u062f \u0645\u0646 \u0627\u0644\u062d\u062f\u064a\u062b'}</h4>
                        </div>
                        <ul className="space-y-3">
                            {selectedHadith.hints.map((hint, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                                    <span className="text-sm text-text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: hint }} />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2.5">
                    <button
                        onClick={() => toggleSave(selectedHadith)}
                        className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95 ${isSaved ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}
                    >
                        <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={isSaved ? 0 : 1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        {isSaved ? '\u0625\u0632\u0627\u0644\u0629' : '\u062d\u0641\u0638'}
                    </button>
                    <button
                        onClick={() => shareHadith(selectedHadith)}
                        className="flex-1 py-3.5 rounded-xl bg-primary text-white flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                        </svg>
                        {'\u0645\u0634\u0627\u0631\u0643\u0629'}
                    </button>
                </div>
            </div>
        );
    };

    const renderSearchTab = () => (
        <div className="p-4 space-y-3">
            <div className="relative">
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder={'\u0627\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0623\u062d\u0627\u062f\u064a\u062b...'}
                    className="input w-full bg-bg-secondary border-border pr-10 text-right"
                    dir="rtl"
                />
            </div>

            {isSearching ? renderLoader() : searchResults.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs text-text-tertiary">{searchResults.length} {'\u0646\u062a\u064a\u062c\u0629'}</p>
                    {searchResults.map((item, i) => (
                        <button
                            key={item.id}
                            onClick={() => { loadHadithDetail(item.id); setActiveTab('browse'); }}
                            className="w-full text-right p-4 bg-bg-secondary rounded-xl hover:bg-bg-tertiary transition-all animate-listItemEnter active:scale-[0.98] border border-border/20"
                            style={{ animationDelay: `${i * 25}ms` }}
                        >
                            <p className="text-sm font-medium text-text-primary">{item.title}</p>
                        </button>
                    ))}
                </div>
            ) : searchQuery ? (
                <div className="text-center py-16 text-text-tertiary">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <p className="text-sm">{'\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c'}</p>
                </div>
            ) : (
                <div className="text-center py-16 text-text-tertiary">
                    <svg className="w-16 h-16 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <p className="text-sm font-medium">{'\u0627\u0628\u062d\u062b \u0639\u0646 \u062d\u062f\u064a\u062b'}</p>
                    <p className="text-xs mt-1">{'\u0627\u0643\u062a\u0628 \u0643\u0644\u0645\u0629 \u0644\u0644\u0628\u062d\u062b \u0641\u064a \u0639\u0646\u0627\u0648\u064a\u0646 \u0627\u0644\u0623\u062d\u0627\u062f\u064a\u062b'}</p>
                </div>
            )}
        </div>
    );

    const renderSavedTab = () => (
        <div className="p-4 space-y-3">
            {savedHadiths.length > 0 ? (
                <>
                    <p className="text-xs text-text-tertiary text-center">{savedHadiths.length} {'\u062d\u062f\u064a\u062b \u0645\u062d\u0641\u0648\u0638'}</p>
                    {savedHadiths.map((hadith, i) => (
                        <div
                            key={hadith.id}
                            className="bg-bg-secondary rounded-2xl p-4 border border-border/30 animate-listItemEnter"
                            style={{ animationDelay: `${i * 30}ms` }}
                        >
                            <p className="font-arabic text-sm leading-[2] text-text-primary text-right line-clamp-3" dir="rtl">
                                {hadith.hadeeth}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/30">
                                <span className="text-[11px] text-text-tertiary truncate max-w-[50%]">{hadith.attribution}</span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => { setSelectedHadith(hadith); setBrowseView('detail'); setActiveTab('browse'); }}
                                        className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => shareHadith(hadith)}
                                        className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => toggleSave(hadith)}
                                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                <div className="text-center py-20 text-text-tertiary">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                    </div>
                    <p className="font-bold text-text-primary text-base">{'\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u062d\u0627\u062f\u064a\u062b \u0645\u062d\u0641\u0648\u0638\u0629'}</p>
                    <p className="text-xs mt-1">{'\u0627\u062d\u0641\u0638 \u0623\u062d\u0627\u062f\u064a\u062b\u0643 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0644\u0644\u0631\u062c\u0648\u0639 \u0625\u0644\u064a\u0647\u0627 \u0644\u0627\u062d\u0642\u0627\u064b'}</p>
                </div>
            )}
        </div>
    );

    const tabs = [
        { key: 'browse' as const, label: '\u0627\u0633\u062a\u0643\u0634\u0627\u0641', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
        { key: 'search' as const, label: '\u0628\u062d\u062b', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
        { key: 'saved' as const, label: '\u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0627\u062a', icon: 'M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
    ];

    return (
        <Panel id={PanelType.Hadith} title={'\u0623\u062d\u0627\u062f\u064a\u062b \u0646\u0628\u0648\u064a\u0629'}>
            {/* Tab bar */}
            <div className="sticky top-0 z-10 bg-bg-primary border-b border-border/50 px-3 pt-2 pb-0">
                <div className="flex gap-1 bg-bg-secondary rounded-xl p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-text-tertiary hover:text-text-primary'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={activeTab === tab.key ? 2 : 1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                            </svg>
                            <span>{tab.label}</span>
                            {tab.key === 'saved' && savedHadiths.length > 0 && (
                                <span className={`min-w-[18px] h-[18px] text-[10px] rounded-full flex items-center justify-center ${activeTab === 'saved' ? 'bg-white/20' : 'bg-primary/15 text-primary'}`}>
                                    {savedHadiths.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {isLoading && browseView !== 'detail' ? renderLoader() : (
                <>
                    {activeTab === 'browse' && (
                        <>
                            {browseView === 'roots' && renderRootCategories()}
                            {browseView === 'subs' && renderSubCategories()}
                            {browseView === 'list' && renderHadithList()}
                            {browseView === 'detail' && (isLoading ? renderLoader() : renderHadithDetail())}
                        </>
                    )}
                    {activeTab === 'search' && renderSearchTab()}
                    {activeTab === 'saved' && renderSavedTab()}
                </>
            )}
        </Panel>
    );
};

export default HadithPanel;
