import React, { useRef, useEffect, useState } from 'react';
import Header from './Header';
import QuranPage from './QuranPage';
import BottomNav from './BottomNav';
import { useApp } from '../hooks/useApp';
import { TOTAL_PAGES } from '../constants';
import DesktopBookLayout from './DesktopBookLayout';
import { Panel } from '../types';

const MainReadingInterface: React.FC = () => {
    const { state, actions } = useApp();
    const mainContentRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    // Removed pinch-to-zoom related refs as font size is now automatic

    const [isDesktopView, setIsDesktopView] = useState(window.innerWidth > 1024);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1025px)');
        const handleResize = (e: MediaQueryListEvent) => {
            setIsDesktopView(e.matches);
            // Reload page with new layout context
            actions.loadPage(state.currentPage);
        };
        mediaQuery.addEventListener('change', handleResize);

        return () => mediaQuery.removeEventListener('change', handleResize);
    }, [actions, state.currentPage]);

    // Handle touch start for swipe navigation only
    // Pinch-to-zoom font control removed - font size is now automatic
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        actions.recordUserActivity();
        if (e.touches.length === 1) {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        }
    };

    // Touch move handler - pinch-to-zoom removed as font is automatic
    const handleTouchMove = (_e: React.TouchEvent<HTMLDivElement>) => {
        // No-op: font size is now automatic and cannot be changed by gestures
    };


    // Handle touch end for swipe page navigation
    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX.current;
            const diffY = Math.abs(touchEndY - touchStartY.current);

            // Don't swipe if a modal/panel is open
            if (state.selectedAyah || state.selectedWord) return;

            if (Math.abs(diffX) > 50 && diffY < 100) { // Horizontal swipe
                const pageIncrement = isDesktopView ? 2 : 1;
                if (diffX > 0 && state.currentPage > 1) { // Swipe right (previous page)
                    const newPage = Math.max(1, state.currentPage - pageIncrement);
                    actions.loadPage(newPage);
                } else if (diffX < 0 && state.currentPage < TOTAL_PAGES) { // Swipe left (next page)
                    const newPage = Math.min(TOTAL_PAGES, state.currentPage + pageIncrement);
                    actions.loadPage(newPage);
                }
            }
        }
    };

    useEffect(() => {
        const mainContentEl = mainContentRef.current;
        if (mainContentEl) {
            mainContentEl.scrollTo(0, 0);
        }
    }, [state.currentPage]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (state.activePanel || state.selectedAyah || state.selectedWord) return;

            const pageIncrement = isDesktopView ? 2 : 1;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                actions.recordUserActivity();
                if (e.key === 'ArrowLeft' && state.currentPage < TOTAL_PAGES) { // Next page for RTL (turn left page)
                    const newPage = Math.min(TOTAL_PAGES, state.currentPage + pageIncrement);
                    actions.loadPage(newPage);
                } else if (e.key === 'ArrowRight' && state.currentPage > 1) { // Previous page for RTL (turn right page)
                    const newPage = Math.max(1, state.currentPage - pageIncrement);
                    actions.loadPage(newPage);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actions, state.currentPage, state.activePanel, state.selectedAyah, state.selectedWord, isDesktopView]);

    const renderContent = () => {
        if (isDesktopView) {
            return <DesktopBookLayout />;
        }
        return (
            <div className="w-full min-h-full flex items-start justify-center px-2 pb-4" data-main-bg>
                <QuranPage key={state.currentPage} pageVerses={state.pageData.right} />
            </div>
        );
    };

    return (
        <div className="h-full w-full">
            <Header />
            <main
                ref={mainContentRef}
                className="h-full w-full overflow-y-auto custom-scrollbar bg-bg-secondary"
                style={{
                    // Fixed padding for safe areas only - content doesn't move when UI toggles
                    paddingTop: 'env(safe-area-inset-top, 0rem)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0rem)',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onScroll={actions.recordUserActivity}
                onClick={(e) => {
                    // Prevent UI toggle if the click target is an explicit interactive element.
                    if ((e.target as HTMLElement).closest('button, a, input, select')) {
                        return;
                    }
                    actions.toggleUIVisibility();
                }}
            >
                {renderContent()}
            </main>
            {!isDesktopView && <BottomNav />}
        </div>
    );
};

export default MainReadingInterface;