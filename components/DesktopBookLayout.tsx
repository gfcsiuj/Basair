import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../hooks/useApp';
import QuranPage from './QuranPage';
import { TOTAL_PAGES } from '../constants';
import { Verse } from '../types';

interface FlippingPageProps {
    progress: number; // 0-100
    direction: 'next' | 'prev';
    frontContent: React.ReactNode;
    backContent: React.ReactNode;
    onAnimationEnd?: () => void;
}

const FlippingPage: React.FC<FlippingPageProps> = ({ progress, direction, frontContent, backContent, onAnimationEnd }) => {
    const rotation = direction === 'next' ? -Math.min(180, progress * 1.8) : Math.min(180, progress * 1.8);
    const isStatic = progress === 0 || progress === 100;

    const wrapperStyle: React.CSSProperties = {
        left: direction === 'next' ? '50%' : '0',
        transformOrigin: direction === 'next' ? 'left center' : 'right center',
        zIndex: 15,
    };
    
    const pageStyle: React.CSSProperties = {
        transform: `rotateY(${rotation}deg)`,
        transition: isStatic ? 'transform 0.5s cubic-bezier(0.1, 0.5, 0.5, 1)' : 'none',
    };

    return (
        <div className="flipping-page-wrapper" style={wrapperStyle}>
            <div className="flipping-page" style={pageStyle} onTransitionEnd={onAnimationEnd}>
                <div className="flipping-page-front">
                    {frontContent}
                </div>
                <div className="flipping-page-back">
                    {backContent}
                </div>
            </div>
        </div>
    );
};


const DesktopBookLayout: React.FC = () => {
    const { state, actions } = useApp();
    const { pageData, currentPage } = state;
    const bookSpreadRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef(0);

    const [turn, setTurn] = useState<{
        active: boolean;
        direction: 'next' | 'prev';
        progress: number;
        frontContent: React.ReactNode | null;
        backContent: React.ReactNode | null;
    }>({
        active: false,
        direction: 'next',
        progress: 0,
        frontContent: null,
        backContent: null,
    });
    
    const startTurn = useCallback(async (e: React.MouseEvent, direction: 'next' | 'prev') => {
        if (turn.active) return;
        e.preventDefault();
        dragStartPos.current = e.clientX;

        let frontPageData: Verse[] | null = null;
        let backPagePromise: Promise<Verse[] | null> | null = null;

        if (direction === 'next' && currentPage < TOTAL_PAGES) {
            // Turning the left page (odd number) to go forward.
            frontPageData = pageData.left;
            // The back of this page is the next page in sequence, which becomes the new right page.
            // currentPage is the right page number (even). e.g., on (4,5), currentPage=4.
            // We turn page 5, its back is page 6. The new right page is 6.
            backPagePromise = actions.getPageData(currentPage + 2);
        } else if (direction === 'prev' && currentPage > 1) {
            // Turning the right page (even number) to go backward.
            frontPageData = pageData.right;
            // The back of this page is the previous page. e.g., on (4,5), turn page 4. Back is page 3.
            // The new left page is page 3.
            backPagePromise = actions.getPageData(currentPage - 1);
        } else {
            return; // Can't turn
        }

        setTurn({
            active: true,
            direction,
            progress: 0,
            frontContent: <QuranPage pageVerses={frontPageData} />,
            backContent: <div className="page-cover"></div>,
        });

        if (backPagePromise) {
            const backPageData = await backPagePromise;
            setTurn(t => t.active ? { ...t, backContent: backPageData ? <QuranPage pageVerses={backPageData} /> : <div className="page-cover"></div> } : t);
        }

    }, [actions, currentPage, pageData, turn.active]);

    const handleDrag = useCallback((e: MouseEvent) => {
        if (!turn.active) return;
        e.preventDefault();

        const dragCurrentPos = e.clientX;
        const bookWidth = bookSpreadRef.current?.clientWidth || 0;
        
        let delta = 0;
        if (turn.direction === 'next') {
            delta = dragStartPos.current - dragCurrentPos;
        } else {
            delta = dragCurrentPos - dragStartPos.current;
        }

        const progress = Math.max(0, Math.min(100, (delta / (bookWidth / 2)) * 100));
        setTurn(t => ({ ...t, progress }));

    }, [turn.active, turn.direction]);

    const endTurn = useCallback(() => {
        if (!turn.active) return;

        const completeTheTurn = turn.progress > 35;

        if (completeTheTurn) {
            setTurn(t => ({ ...t, progress: 100 }));
        } else {
            setTurn(t => ({ ...t, progress: 0 }));
            // Reset after animation
            setTimeout(() => {
                setTurn(t => !t.progress ? { ...t, active: false } : t);
            }, 500);
        }
    }, [turn.active, turn.progress]);

    const onFlipAnimationEnd = () => {
        if (turn.active && turn.progress === 100) {
             const pageIncrement = 2;
             if (turn.direction === 'next') {
                 actions.loadPage(Math.min(TOTAL_PAGES, currentPage + pageIncrement));
             } else {
                 actions.loadPage(Math.max(1, currentPage - pageIncrement));
             }
             setTurn({ active: false, direction: 'next', progress: 0, frontContent: null, backContent: null });
        }
    };

    useEffect(() => {
        if (turn.active) {
            window.addEventListener('mousemove', handleDrag);
            window.addEventListener('mouseup', endTurn);
        }
        return () => {
            window.removeEventListener('mousemove', handleDrag);
            window.removeEventListener('mouseup', endTurn);
        };
    }, [turn.active, handleDrag, endTurn]);
    
    // Hide the static page content that is being turned
    const leftPageStyle = turn.active && turn.direction === 'next' ? { opacity: 0 } : {};
    const rightPageStyle = turn.active && turn.direction === 'prev' ? { opacity: 0 } : {};
    
    return (
        <div className="desktop-book-container" data-main-bg>
            <div className="book-spread" ref={bookSpreadRef} key={currentPage}>
                {/* Right-hand page of the book (EVEN page number) */}
                <div className="page page-on-right" style={rightPageStyle}>
                    {pageData?.right ? <QuranPage pageVerses={pageData.right} /> : <div className="page-cover"></div>}
                    {currentPage > 1 && <div className="turn-hotspot turn-hotspot-prev" onMouseDown={(e) => startTurn(e, 'prev')}></div>}
                </div>
                
                {/* Left-hand page of the book (ODD page number) */}
                <div className="page page-on-left" style={leftPageStyle}>
                    {pageData?.left ? <QuranPage pageVerses={pageData.left} /> : <div className="page-cover"></div>}
                    {pageData?.left && currentPage < TOTAL_PAGES && <div className="turn-hotspot turn-hotspot-next" onMouseDown={(e) => startTurn(e, 'next')}></div>}
                </div>

                {turn.active && (
                    <FlippingPage
                        progress={turn.progress}
                        direction={turn.direction}
                        frontContent={turn.frontContent}
                        backContent={turn.backContent}
                        onAnimationEnd={onFlipAnimationEnd}
                    />
                )}
            </div>
        </div>
    );
};

export default DesktopBookLayout;