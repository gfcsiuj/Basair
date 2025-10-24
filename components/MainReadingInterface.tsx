import React, { useRef, useEffect, useState } from 'react';
import Header from './Header';
import QuranPage from './QuranPage';
import BottomNav from './BottomNav';
import { useApp } from '../hooks/useApp';
import { TOTAL_PAGES } from '../constants';
import { Panel } from '../types';

const MainReadingInterface: React.FC = () => {
    const { state, actions } = useApp();
    const mainContentRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const initialPinchDistance = useRef(0);
    const lastFontSize = useRef(state.fontSize);
    const gestureState = useRef<'none' | 'swipe' | 'pinch'>('none');
    
    useEffect(() => {
        const styleId = 'dynamic-quran-font-style';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        if (state.font === 'qpc-v1' && state.currentPage > 0) {
            const page = state.currentPage;
            const cssRule = `
                @font-face {
                    font-family: 'quran-font-p${page}';
                    src: url('/ZPCV1Font/p${page}.ttf') format('truetype');
                    font-display: swap;
                }
            `;

            if (styleEl.innerHTML !== cssRule) {
                styleEl.innerHTML = cssRule;
            }
        } else {
            if (styleEl.innerHTML !== '') {
                styleEl.innerHTML = '';
            }
        }
    }, [state.currentPage, state.font]);
    
    const getDistance = (touches: React.TouchList) => {
        const [touch1, touch2] = [touches[0], touches[1]];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        actions.recordUserActivity();
        if (e.touches.length === 1) {
            gestureState.current = 'swipe';
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            gestureState.current = 'pinch';
            e.preventDefault();
            initialPinchDistance.current = getDistance(e.touches);
            lastFontSize.current = state.fontSize;
        } else {
            gestureState.current = 'none';
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (gestureState.current === 'pinch' && e.touches.length === 2) {
            e.preventDefault();
            const newDistance = getDistance(e.touches);
            const scale = newDistance / (initialPinchDistance.current || 1); // Avoid division by zero
            
            let newSize = Math.round(lastFontSize.current * scale);
            newSize = Math.max(16, Math.min(36, newSize)); // Clamp font size
            
            if (newSize !== state.fontSize) {
                actions.setFontSize(newSize);
            }
        }
    };


    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (gestureState.current === 'swipe' && e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX.current;
            const diffY = Math.abs(touchEndY - touchStartY.current);

            // Don't swipe if a modal/panel is open
            if (state.selectedAyah || state.selectedWord) return;

            if (Math.abs(diffX) > 50 && diffY < 100) { // Horizontal swipe
                const pageIncrement = 1;
                if (diffX > 0 && state.currentPage > 1) { // Swipe right (previous page)
                    const newPage = Math.max(1, state.currentPage - pageIncrement);
                    actions.loadPage(newPage);
                } else if (diffX < 0 && state.currentPage < TOTAL_PAGES) { // Swipe left (next page)
                    const newPage = Math.min(TOTAL_PAGES, state.currentPage + pageIncrement);
                    actions.loadPage(newPage);
                }
            }
        }

        if (e.touches.length === 0) {
            gestureState.current = 'none';
            initialPinchDistance.current = 0;
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

            const pageIncrement = 1;
            
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
    }, [actions, state.currentPage, state.activePanel, state.selectedAyah, state.selectedWord]);

    const renderContent = () => {
        return (
            <div className="w-full min-h-full flex items-start justify-center px-4 pb-4 md:px-8 md:pb-8" data-main-bg>
                <QuranPage key={state.currentPage} pageVerses={state.pageData.right} />
            </div>
        );
    };

    // Define heights for padding calculation
    const isAudioOpen = state.activePanel === Panel.Audio;
    const headerVisibleHeight = `calc(4.5rem + env(safe-area-inset-top, 0rem))`;
    const bottomNavVisibleHeight = `calc(${isAudioOpen ? '13rem' : '4.5rem'} + env(safe-area-inset-bottom, 0rem))`;
    
    // When UI is hidden, padding should only account for safe areas to prevent content from going under notches.
    const headerHiddenHeight = `env(safe-area-inset-top, 0rem)`;
    const bottomNavHiddenHeight = `env(safe-area-inset-bottom, 0rem)`;

    return (
        <div className="h-full w-full">
            <Header />
            <main 
                ref={mainContentRef}
                className="h-full w-full overflow-y-auto custom-scrollbar bg-bg-secondary"
                style={{
                    paddingTop: state.isUIVisible ? headerVisibleHeight : headerHiddenHeight,
                    paddingBottom: state.isUIVisible ? bottomNavVisibleHeight : bottomNavHiddenHeight,
                    transition: 'padding-top 0.3s ease-in-out, padding-bottom 0.3s ease-in-out',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onScroll={actions.recordUserActivity}
                onClick={(e) => {
                    // Prevent UI toggle if the click target is interactive
                    if ((e.target as HTMLElement).closest('button, a, input, select, .word, .ayah-container')) {
                        return;
                    }
                    actions.toggleUIVisibility();
                }}
            >
                {renderContent()}
            </main>
            <BottomNav />
        </div>
    );
};

export default MainReadingInterface;