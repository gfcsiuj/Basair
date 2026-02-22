import React, { useRef, useEffect, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { renderedFontPages } from '../utils/fontPageTracker';
import Header from './Header';
import QuranPage from './QuranPage';
import BottomNav from './BottomNav';
import { useApp } from '../hooks/useApp';
import { TOTAL_PAGES, API_BASE } from '../constants';
import DesktopBookLayout from './DesktopBookLayout';
import { Verse } from '../types';

interface LoadedPage {
    pageNumber: number;
    verses: Verse[];
}

const MainReadingInterface: React.FC = () => {
    const { state, actions } = useApp();
    const mainContentRef = useRef<HTMLDivElement>(null);
    const autoScrollRAF = useRef<number | null>(null);
    const fractionalScroll = useRef(0);

    // Continuous scroll state (for auto-scroll mode)
    const [loadedPages, setLoadedPages] = useState<LoadedPage[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const [isDesktopView, setIsDesktopView] = useState(window.innerWidth > 1024);

    // === Swipe Navigation State ===
    const swipeContainerRef = useRef<HTMLDivElement>(null);
    const [prevPageData, setPrevPageData] = useState<Verse[] | null>(null);
    const [nextPageData, setNextPageData] = useState<Verse[] | null>(null);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastLoadedPageRef = useRef<number>(0);

    // Fetch a single page's verse data
    const fetchPageData = useCallback(async (pageNumber: number): Promise<Verse[] | null> => {
        if (pageNumber < 1 || pageNumber > TOTAL_PAGES) return null;
        try {
            const apiReciterId = state.selectedReciterId >= 1001 ? 7 : state.selectedReciterId;
            const tafsirId = state.selectedTafsirId;
            const translationId = state.selectedTranslationId;
            // Always fetch words to ensure we get audio_url for word-by-word playback, regardless of font
            const wordParams = '&words=true&word_fields=text_uthmani,translation,audio_url';

            const url = `${API_BASE}/verses/by_page/${pageNumber}?language=ar${wordParams}&audio=${apiReciterId}&tafsirs=${tafsirId}&translations=${translationId}&fields=text_uthmani,chapter_id,juz_number,page_number,verse_key,verse_number,words,audio`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data.verses as Verse[];
        } catch (error) {
            console.error('Error fetching page:', error);
            return null;
        }
    }, [state.selectedReciterId, state.selectedTafsirId, state.selectedTranslationId, state.font]);

    // Pre-fetch adjacent pages whenever currentPage changes
    useEffect(() => {
        if (isDesktopView || state.isAutoScrolling) return;
        if (lastLoadedPageRef.current === state.currentPage) return;
        lastLoadedPageRef.current = state.currentPage;

        if (state.currentPage > 1) {
            fetchPageData(state.currentPage - 1).then(setPrevPageData);
        } else {
            setPrevPageData(null);
        }

        if (state.currentPage < TOTAL_PAGES) {
            fetchPageData(state.currentPage + 1).then(setNextPageData);
        } else {
            setNextPageData(null);
        }
    }, [state.currentPage, isDesktopView, state.isAutoScrolling, fetchPageData]);

    // Preload fonts for adjacent pages to avoid FOUT (flash of unstyled text) on swipe
    useEffect(() => {
        if (isDesktopView || state.isAutoScrolling || state.font !== 'qpc-v1') return;

        const preloadFont = (pageNum: number) => {
            if (pageNum < 1 || pageNum > TOTAL_PAGES) return;
            const fontFamily = `QuranPageFontV2-${pageNum}`;
            // Check if already loaded to avoid duplicate work
            const alreadyLoaded = Array.from(document.fonts).some(
                f => f.family === fontFamily && f.status === 'loaded'
            );
            if (alreadyLoaded) return;

            // Register @font-face if not already in the stylesheet
            const styleId = `dynamic-quran-font-style-${pageNum}`;
            if (!document.getElementById(styleId)) {
                const styleEl = document.createElement('style');
                styleEl.id = styleId;
                styleEl.innerHTML = `
                    @font-face {
                        font-family: '${fontFamily}';
                        src: url('/QPC V2 Font/p${pageNum}.ttf') format('truetype');
                        font-display: block;
                    }
                `;
                document.head.appendChild(styleEl);
            }

            // Eagerly load the font via FontFace API
            const font = new FontFace(fontFamily, `url('/QPC V2 Font/p${pageNum}.ttf')`);
            font.load().then(loadedFont => {
                (document.fonts as any).add(loadedFont);
            }).catch(() => {/* silently ignore preload errors */ });
        };

        preloadFont(state.currentPage - 1);
        preloadFont(state.currentPage + 1);
    }, [state.currentPage, isDesktopView, state.isAutoScrolling, state.font]);

    // Set initial scroll position on mount so the current page is centered
    useEffect(() => {
        if (isDesktopView || state.isAutoScrolling) return;
        const container = swipeContainerRef.current;
        if (!container) return;
        // Run on mount: scroll to center (current page slot)
        const pageWidth = container.offsetWidth;
        const hasPrev = state.currentPage > 1;
        container.scrollLeft = hasPrev ? -pageWidth : 0;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // mount only


    // Handle scroll-snap end detection — uses pre-fetched data directly to avoid flash
    const handleSwipeScroll = useCallback(() => {
        if (isScrollingRef.current) return;

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            const container = swipeContainerRef.current;
            if (!container) return;

            const pageWidth = container.offsetWidth;
            const scrollPos = Math.abs(container.scrollLeft);
            const hasPrev = state.currentPage > 1;

            const pageIndex = Math.round(scrollPos / pageWidth);

            let newPage: number | null = null;
            let newPageData: Verse[] | null = null;

            if (hasPrev) {
                if (pageIndex === 0 && state.currentPage > 1) {
                    newPage = state.currentPage - 1;
                    newPageData = prevPageData;
                } else if (pageIndex === 2 && state.currentPage < TOTAL_PAGES) {
                    newPage = state.currentPage + 1;
                    newPageData = nextPageData;
                }
            } else {
                if (pageIndex === 1 && state.currentPage < TOTAL_PAGES) {
                    newPage = state.currentPage + 1;
                    newPageData = nextPageData;
                }
            }

            if (newPage !== null) {
                isScrollingRef.current = true;

                // KEY: Mark this page as CSS-rendered BEFORE flushSync.
                // The adjacent slot was showing this page correctly with CSS font.
                // This allows QuranPage's sync isFontReady check to return true
                // immediately on first render after flushSync — NO white flash.
                renderedFontPages.add(newPage!);

                // flushSync: React processes state update synchronously and updates the DOM
                // BEFORE this function returns. We then immediately correct the scroll
                // position in the same event loop tick — the browser never renders the
                // intermediate state where the wrong slot was visible at the swipe position.
                flushSync(() => {
                    actions.setState(s => ({
                        ...s,
                        currentPage: newPage!,
                        pageData: { left: null, right: newPageData || s.pageData.right },
                        currentAudioIndex: 0,
                    }));
                });

                // Immediately reset scroll to center slot (no rAF delay = no wrong-slot frame)
                const newHasPrev = newPage! > 1;
                container.scrollLeft = newHasPrev ? -pageWidth : 0;
                isScrollingRef.current = false;

                // Update localStorage and reading log
                localStorage.setItem('lastPage', String(newPage));
                const today = new Date().toISOString().split('T')[0];
                actions.setState(s => {
                    const newLog = { ...s.readingLog };
                    if (!newLog[today]) newLog[today] = [];
                    if (!newLog[today].includes(newPage!)) {
                        newLog[today].push(newPage!);
                        localStorage.setItem('readingLog', JSON.stringify(newLog));
                        return { ...s, readingLog: newLog };
                    }
                    return s;
                });
            }
        }, 150);
    }, [state.currentPage, actions, prevPageData, nextPageData]);

    // Initial setup for auto-scroll
    useEffect(() => {
        if (state.isAutoScrolling) {
            setLoadedPages([{
                pageNumber: state.currentPage,
                verses: state.pageData.right || []
            }]);
            setShowControls(true);
            setIsPaused(false);
        } else {
            setLoadedPages([]);
            setIsPaused(false);
        }
    }, [state.isAutoScrolling, state.currentPage, state.pageData.right]);

    // Data fetching for auto-scroll next pages
    const fetchNextPage = useCallback(async (pageNumber: number) => {
        if (pageNumber > TOTAL_PAGES) return null;
        return fetchPageData(pageNumber);
    }, [fetchPageData]);

    // Auto-scroll engine
    useEffect(() => {
        const el = mainContentRef.current;
        if (!el || !state.isAutoScrolling) {
            if (autoScrollRAF.current) {
                cancelAnimationFrame(autoScrollRAF.current);
                autoScrollRAF.current = null;
            }
            fractionalScroll.current = 0;
            return;
        }

        const scrollStep = () => {
            if (!el || !state.isAutoScrolling) return;

            if (!isPaused) {
                const speed = state.autoScrollSpeed * 0.6;
                fractionalScroll.current += speed;

                if (fractionalScroll.current >= 1) {
                    const wholePixels = Math.floor(fractionalScroll.current);
                    el.scrollTop += wholePixels;
                    fractionalScroll.current -= wholePixels;
                }

                const scrollBottom = el.scrollTop + el.clientHeight;
                const scrollThreshold = el.scrollHeight - 600;

                if (scrollBottom > scrollThreshold && !isLoadingMore) {
                    const lastPage = loadedPages[loadedPages.length - 1];
                    if (lastPage && lastPage.pageNumber < TOTAL_PAGES) {
                        setIsLoadingMore(true);
                        const nextPageNum = lastPage.pageNumber + 1;

                        fetchNextPage(nextPageNum).then(newVerses => {
                            if (newVerses) {
                                setLoadedPages(prev => {
                                    if (prev.some(p => p.pageNumber === nextPageNum)) return prev;
                                    return [...prev, { pageNumber: nextPageNum, verses: newVerses }];
                                });
                            }
                            setIsLoadingMore(false);
                        });
                    }
                }
            }

            autoScrollRAF.current = requestAnimationFrame(scrollStep);
        };

        autoScrollRAF.current = requestAnimationFrame(scrollStep);

        return () => {
            if (autoScrollRAF.current) {
                cancelAnimationFrame(autoScrollRAF.current);
                autoScrollRAF.current = null;
            }
        };
    }, [state.isAutoScrolling, state.autoScrollSpeed, loadedPages, isLoadingMore, fetchNextPage, isPaused]);

    // Toggle controls on tap
    const handleContentClick = () => {
        if (state.isAutoScrolling) {
            setShowControls(prev => !prev);
        } else {
            actions.toggleUIVisibility();
        }
    };

    const renderContent = () => {
        if (isDesktopView) return <DesktopBookLayout />;

        if (state.isAutoScrolling) {
            return (
                <div className="w-full pb-32" onClick={handleContentClick} data-main-bg>
                    {loadedPages.map((page, index) => (
                        <div key={page.pageNumber} className="w-full flex flex-col items-center animate-fadeIn">
                            {index > 0 && (
                                <div className="w-full flex items-center justify-center gap-4 py-8 opacity-40 my-4">
                                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                                    <span className="text-[10px] text-primary font-medium tracking-wider uppercase border border-primary/20 rounded-full px-3 py-0.5 bg-bg-primary/50 backdrop-blur-sm">
                                        الصفحة {page.pageNumber}
                                    </span>
                                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                                </div>
                            )}

                            <div className="w-full px-2 page-container" style={{ minHeight: '80vh' }}>
                                <QuranPage
                                    pageVerses={page.verses}
                                    pageNumber={page.pageNumber}
                                />
                            </div>
                        </div>
                    ))}
                    {isLoadingMore && (
                        <div className="w-full py-8 flex justify-center opacity-60">
                            <i className="fas fa-spinner fa-spin text-primary text-xl"></i>
                        </div>
                    )}
                </div>
            );
        }

        // === Swipe Page Navigation ===
        const hasPrev = state.currentPage > 1;
        const hasNext = state.currentPage < TOTAL_PAGES;

        return (
            <div
                ref={swipeContainerRef}
                className="swipe-container"
                onScroll={handleSwipeScroll}
                data-main-bg
            >
                {/* Previous Page (shown on the right in RTL) */}
                {hasPrev && (
                    <div className="swipe-page">
                        <div className="w-full min-h-full flex items-start justify-center px-2 pb-4">
                            <QuranPage
                                pageVerses={prevPageData}
                                pageNumber={state.currentPage - 1}
                            />
                        </div>
                    </div>
                )}

                {/* Current Page */}
                <div className="swipe-page">
                    <div className="w-full min-h-full flex items-start justify-center px-2 pb-4">
                        <QuranPage
                            pageVerses={state.pageData.right}
                        />
                    </div>
                </div>

                {/* Next Page (shown on the left in RTL) */}
                {hasNext && (
                    <div className="swipe-page">
                        <div className="w-full min-h-full flex items-start justify-center px-2 pb-4">
                            <QuranPage
                                pageVerses={nextPageData}
                                pageNumber={state.currentPage + 1}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full w-full relative">
            {!state.isAutoScrolling && <Header />}

            <main
                ref={mainContentRef}
                className="h-full w-full overflow-y-auto custom-scrollbar bg-bg-secondary"
                style={{
                    paddingTop: state.isAutoScrolling ? '0' : 'env(safe-area-inset-top, 0rem)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0rem)',
                    ...((!isDesktopView && !state.isAutoScrolling) ? { overflowY: 'hidden' as const } : {}),
                }}
                onScroll={() => {
                    if (!state.isAutoScrolling) {
                        actions.recordUserActivity();
                    }
                }}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button, a, input, select') && !state.isAutoScrolling) return;
                    if (!state.isAutoScrolling) actions.toggleUIVisibility();
                }}
            >
                {renderContent()}
            </main>

            {!isDesktopView && !state.isAutoScrolling && <BottomNav />}

            {state.isAutoScrolling && (
                <div
                    className={`fixed bottom-8 left-0 right-0 z-50 flex justify-center transition-all duration-300 pointer-events-none ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    <div
                        className="pointer-events-auto flex items-center gap-4 py-2 px-3 rounded-full shadow-2xl backdrop-blur-xl border border-white/20"
                        style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        <button
                            onClick={() => actions.toggleAutoScroll()}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 active:scale-90 transition-all"
                            title="خروج"
                        >
                            <i className="fas fa-times text-sm"></i>
                        </button>

                        <div className="w-px h-6 bg-gray-300/50"></div>

                        <div className="flex items-center gap-2 px-1">
                            <i className="fas fa-tachometer-alt text-gray-400 text-[10px]"></i>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.05"
                                value={state.autoScrollSpeed}
                                onChange={(e) => actions.setAutoScrollSpeed(parseFloat(e.target.value))}
                                className="w-32 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-[10px] font-bold text-primary w-6 text-center">{state.autoScrollSpeed.toFixed(1)}</span>
                        </div>

                        <div className="w-px h-6 bg-gray-300/50"></div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPaused(!isPaused);
                            }}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-md ${isPaused
                                ? 'bg-primary text-white hover:bg-primary-dark'
                                : 'bg-white text-primary border border-primary/20 hover:bg-primary/5'
                                }`}
                            title={isPaused ? "استئناف" : "إيقاف مؤقت"}
                        >
                            <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'} text-sm ${isPaused ? 'pl-0.5' : ''}`}></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainReadingInterface;