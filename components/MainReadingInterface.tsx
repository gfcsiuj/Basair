import React, { useRef, useEffect, useState, useCallback } from 'react';
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
    const fractionalScroll = useRef(0); // For sub-pixel scrolling precision

    // Continuous scroll state
    const [loadedPages, setLoadedPages] = useState<LoadedPage[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const [isDesktopView, setIsDesktopView] = useState(window.innerWidth > 1024);

    // Initial setup for auto-scroll
    useEffect(() => {
        if (state.isAutoScrolling) {
            // Load current page immediately
            setLoadedPages([{
                pageNumber: state.currentPage,
                verses: state.pageData.right || []
            }]);
            setShowControls(true);
            setIsPaused(false);
        } else {
            // Reset when stopping
            setLoadedPages([]);
            setIsPaused(false);
        }
    }, [state.isAutoScrolling, state.currentPage, state.pageData.right]);

    // Data fetching for next pages
    const fetchNextPage = useCallback(async (pageNumber: number) => {
        if (pageNumber > TOTAL_PAGES) return null;
        try {
            const apiReciterId = state.selectedReciterId >= 1001 ? 7 : state.selectedReciterId;
            const tafsirId = state.selectedTafsirId;
            const translationId = state.selectedTranslationId;
            const wordParams = state.font === 'qpc-v1' ? '' : '&words=true&word_fields=text_uthmani,translation';

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
                // Scroll logic with sub-pixel precision
                const speed = state.autoScrollSpeed * 0.6;
                fractionalScroll.current += speed;

                if (fractionalScroll.current >= 1) {
                    const wholePixels = Math.floor(fractionalScroll.current);
                    el.scrollTop += wholePixels;
                    fractionalScroll.current -= wholePixels;
                }

                // Infinite loading logic
                const scrollBottom = el.scrollTop + el.clientHeight;
                const scrollThreshold = el.scrollHeight - 600; // Load when 600px from bottom

                if (scrollBottom > scrollThreshold && !isLoadingMore) {
                    const lastPage = loadedPages[loadedPages.length - 1];
                    if (lastPage && lastPage.pageNumber < TOTAL_PAGES) {
                        setIsLoadingMore(true);
                        const nextPageNum = lastPage.pageNumber + 1;

                        fetchNextPage(nextPageNum).then(newVerses => {
                            if (newVerses) {
                                setLoadedPages(prev => {
                                    // Prevent duplicate pages
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
                            {/* Page Separator */}
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

        return (
            <div className="w-full min-h-full flex items-start justify-center px-2 pb-4" data-main-bg>
                <QuranPage key={state.currentPage} pageVerses={state.pageData.right} />
            </div>
        );
    };

    return (
        <div className="h-full w-full relative">
            {/* Standard Header - Hidden in AutoScroll */}
            {!state.isAutoScrolling && <Header />}

            <main
                ref={mainContentRef}
                className="h-full w-full overflow-y-auto custom-scrollbar bg-bg-secondary"
                style={{
                    paddingTop: state.isAutoScrolling ? '0' : 'env(safe-area-inset-top, 0rem)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0rem)',
                    // When auto-scrolling, disable native snap/momentum if it interferes? usually fine.
                }}
                onScroll={() => {
                    if (!state.isAutoScrolling) {
                        actions.recordUserActivity();
                    }
                }}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button, a, input, select') && !state.isAutoScrolling) return;
                    // In auto-scroll, clicking content toggles controls (handled in renderContent wrapper)
                    if (!state.isAutoScrolling) actions.toggleUIVisibility();
                }}
            >
                {renderContent()}
            </main>

            {/* Standard Bottom Nav - Hidden in AutoScroll */}
            {!isDesktopView && !state.isAutoScrolling && <BottomNav />}

            {/* AutoScroll Floating Control Bar */}
            {state.isAutoScrolling && (
                <div
                    className={`fixed bottom-8 left-0 right-0 z-50 flex justify-center transition-all duration-300 pointer-events-none ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                >
                    <div
                        className="pointer-events-auto flex items-center gap-4 py-2 px-3 rounded-full shadow-2xl backdrop-blur-xl border border-white/20"
                        style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        {/* Exit Button */}
                        <button
                            onClick={() => actions.toggleAutoScroll()}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 active:scale-90 transition-all"
                            title="خروج"
                        >
                            <i className="fas fa-times text-sm"></i>
                        </button>

                        <div className="w-px h-6 bg-gray-300/50"></div>

                        {/* Speed Slider */}
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

                        {/* Pause/Resume Button */}
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