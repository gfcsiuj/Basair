import React, { useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { Verse } from '../types';

interface InteractiveLineProps {
    children: React.ReactNode;
    lineStyle: React.CSSProperties;
    lineNumber: number;
    pageVerses: Verse[] | null;
    firstWordId: number | null;
    lastWordId: number | null;
}

/**
 * مكون السطر التفاعلي
 * يتيح النقر المطول على سطور الآيات لفتح قائمة الخيارات
 * التتبع الدقيق يتم عبر VerseGlyphSegment داخل children
 */
const InteractiveLine: React.FC<InteractiveLineProps> = ({
    children,
    lineStyle,
    lineNumber,
    pageVerses,
    firstWordId,
    lastWordId
}) => {
    const { state, actions } = useApp();
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pressStartPos = useRef<{ x: number; y: number } | null>(null);
    const isLongPressTriggered = useRef(false);

    // تحديد الآية المرتبطة بهذا السطر
    const getVerseForLine = (): Verse | null => {
        if (!pageVerses || !state.wordGlyphData || !firstWordId) return null;

        for (const [key, wordInfo] of Object.entries(state.wordGlyphData)) {
            if (wordInfo.id === firstWordId) {
                const [chapterId, verseNum] = key.split(':').map(Number);
                const verse = pageVerses.find(v =>
                    v.chapter_id === chapterId && v.verse_number === verseNum
                );
                return verse || null;
            }
        }
        return null;
    };

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        pressStartPos.current = { x: clientX, y: clientY };
        isLongPressTriggered.current = false;

        longPressTimer.current = setTimeout(() => {
            const verse = getVerseForLine();
            if (verse) {
                try { navigator.vibrate(30); } catch (e) { }
                actions.selectAyah(verse);
                isLongPressTriggered.current = true;
            }
            longPressTimer.current = null;
        }, 400);
    };

    const handlePressMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (longPressTimer.current && pressStartPos.current) {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            const dx = Math.abs(clientX - pressStartPos.current.x);
            const dy = Math.abs(clientY - pressStartPos.current.y);

            if (dx > 15 || dy > 15) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
                pressStartPos.current = null;
            }
        }
    };

    const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressStartPos.current = null;

        if (isLongPressTriggered.current) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <div
            style={lineStyle}
            className={`
                quran-line cursor-pointer select-none
                transition-all duration-200
                hover:bg-primary/5 active:bg-primary/10
                rounded-lg
            `}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onMouseMove={handlePressMove}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchMove={handlePressMove}
            onContextMenu={(e) => e.preventDefault()}
        >
            {children}
        </div>
    );
};

export default InteractiveLine;
