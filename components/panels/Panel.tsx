import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import { Panel as PanelType } from '../../types';

interface PanelProps {
    id: PanelType;
    title: string;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ id, title, children, headerActions }) => {
    const { state, actions } = useApp();
    const isVisible = state.activePanel === id;
    const [isRendered, setIsRendered] = useState(isVisible);

    // Swipe to dismiss state
    const contentRef = useRef<HTMLDivElement>(null);
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);

    const onDismiss = () => actions.openPanel(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (contentRef.current && contentRef.current.scrollTop === 0) {
            touchStartY.current = e.touches[0].clientY;
            setIsDragging(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        let deltaY = currentY - touchStartY.current;
        if (deltaY < 0) deltaY = 0;
        setTranslateY(deltaY);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (translateY > 100) {
            onDismiss();
        } else {
            setTranslateY(0);
        }
    };

    const style: React.CSSProperties = {
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    };

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
            setTranslateY(0);
        }
    }, [isVisible]);

    const handleAnimationEnd = () => {
        if (!isVisible) {
            setIsRendered(false);
        }
    };

    if (!isRendered) return null;

    return (
        <div
            className={`fixed inset-0 bg-bg-primary z-50 flex flex-col ${isVisible ? 'animate-slideInUp' : 'animate-slideOutDown'}`}
            onAnimationEnd={handleAnimationEnd}
            style={style}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <header
                className="panel-header flex items-center justify-between px-4 pb-4 text-white shadow-lg shrink-0"
                style={{
                    paddingTop: 'calc(1rem + env(safe-area-inset-top, 0rem))',
                    background: `linear-gradient(135deg, var(--primary-dark), var(--primary))`,
                }}
            >
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="flex items-center gap-1">
                    {headerActions}
                    <button onClick={() => actions.openPanel(null)} className="w-8 h-8 flex items-center justify-center hover:bg-white/15 rounded-full transition-colors">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
            </header>
            <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    );
};

export default Panel;