import React, { useRef, useEffect, useState } from 'react';
import Header from './Header';
import QuranPage from './QuranPage';
import BottomNav from './BottomNav';
import AyahContextMenu from './AyahContextMenu';
import { useApp } from '../hooks/useApp';
import { TOTAL_PAGES } from '../constants';

const MainReadingInterface: React.FC = () => {
    const { state, actions } = useApp();
    const mainContentRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    
    // State to manage rendering for UI animations
    const [isUIRendered, setIsUIRendered] = useState(state.isUIVisible);

    useEffect(() => {
        if (state.isUIVisible) {
            setIsUIRendered(true);
        }
    }, [state.isUIVisible]);

    const handleUIAnimationEnd = () => {
        if (!state.isUIVisible) {
            setIsUIRendered(false);
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX.current;
        const diffY = Math.abs(touchEndY - touchStartY.current);

        if (Math.abs(diffX) > 50 && diffY < 100) { // Horizontal swipe
            actions.recordUserActivity(); // Ensure UI is visible on swipe
            if (diffX > 0 && state.currentPage > 1) { // Swipe right (previous page)
                actions.loadPage(state.currentPage - 1);
            } else if (diffX < 0 && state.currentPage < TOTAL_PAGES) { // Swipe left (next page)
                actions.loadPage(state.currentPage + 1);
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
            if (state.activePanel || state.selectedAyah) return; // Don't navigate when a panel or context menu is open

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                actions.recordUserActivity(); // Record activity on navigation
                // In RTL, "next" page is to the left, "prev" is to the right.
                if (e.key === 'ArrowLeft' && state.currentPage < TOTAL_PAGES) {
                    actions.loadPage(state.currentPage + 1);
                } else if (e.key === 'ArrowRight' && state.currentPage > 1) {
                    actions.loadPage(state.currentPage - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actions, state.currentPage, state.activePanel, state.selectedAyah]);

    return (
        <div className="flex flex-col h-full w-full">
            {isUIRendered && <Header onAnimationEnd={handleUIAnimationEnd} />}
            <main 
                ref={mainContentRef}
                className="flex-1 overflow-y-auto custom-scrollbar relative"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={actions.toggleUIVisibility}
                onScroll={actions.recordUserActivity}
            >
                <QuranPage key={state.currentPage} />
            </main>
            {isUIRendered && <BottomNav onAnimationEnd={handleUIAnimationEnd} />}
            <AyahContextMenu />
        </div>
    );
};

export default MainReadingInterface;