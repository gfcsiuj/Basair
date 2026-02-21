import React, { useRef, useEffect, useMemo } from 'react';
import { Verse, Word } from '../types';
import { useApp } from '../hooks/useApp';

interface AyahProps {
    verse: Verse & { glyphText?: string };
}

const Ayah: React.FC<AyahProps> = ({ verse }) => {
    const { state, actions } = useApp();
    const { font } = state;
    const ayahRef = useRef<HTMLSpanElement>(null);


    const isPlaying = state.isPlaying && state.audioQueue[state.currentAudioIndex]?.verseKey === verse.verse_key;

    // Calculate progress percentage based on audio time
    const progress = useMemo(() => {
        if (!isPlaying || !state.audioDuration) return 0;
        return Math.min(100, (state.audioCurrentTime / state.audioDuration) * 100);
    }, [isPlaying, state.audioCurrentTime, state.audioDuration]);

    // Auto-scroll to playing verse
    useEffect(() => {
        if (isPlaying && ayahRef.current) {
            ayahRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isPlaying]);

    const wordLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wordPressStartPos = useRef<{ x: number, y: number } | null>(null);

    const ayahLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent, word: Word) => {
        e.stopPropagation();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        wordPressStartPos.current = { x: clientX, y: clientY };

        wordLongPressTimer.current = setTimeout(() => {
            actions.selectWord(verse, word);
            wordLongPressTimer.current = null;
        }, 500);
    };

    const handlePressEnd = () => {
        if (wordLongPressTimer.current) {
            clearTimeout(wordLongPressTimer.current);
            wordLongPressTimer.current = null;
        }
        wordPressStartPos.current = null;
    };

    const handlePressMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (wordLongPressTimer.current && wordPressStartPos.current) {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            const dx = Math.abs(clientX - wordPressStartPos.current.x);
            const dy = Math.abs(clientY - wordPressStartPos.current.y);

            if (dx > 10 || dy > 10) {
                clearTimeout(wordLongPressTimer.current);
                wordLongPressTimer.current = null;
                wordPressStartPos.current = null;
            }
        }
    };

    const handleAyahInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!(e.target as HTMLElement).classList.contains('word')) {
            ayahLongPressTimer.current = setTimeout(() => {
                actions.selectAyah(verse);
                ayahLongPressTimer.current = null;
            }, 400);
        }
    };

    const handleAyahInteractionEnd = () => {
        if (ayahLongPressTimer.current) {
            clearTimeout(ayahLongPressTimer.current);
            ayahLongPressTimer.current = null;
        }
    };

    const verseNumberArabic = new Intl.NumberFormat('ar-EG').format(verse.verse_number);

    const ayahEventHandlers = {
        onMouseDown: handleAyahInteractionStart,
        onMouseUp: handleAyahInteractionEnd,
        onMouseLeave: handleAyahInteractionEnd,
        onTouchStart: handleAyahInteractionStart,
        onTouchEnd: handleAyahInteractionEnd,
    };



    // Render the verse text content
    const renderVerseContent = () => {
        if (font === 'qpc-v1') {
            return <>{verse.glyphText ?? verse.text_uthmani}</>;
        }

        return (
            <>
                {verse.words.filter(word => word.char_type_name === 'word').map(word => (
                    <React.Fragment key={word.id}>
                        <span
                            className="word hover:text-primary transition-colors"
                            onMouseDown={(e) => handlePressStart(e, word)}
                            onMouseUp={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            onMouseMove={(e) => handlePressMove(e)}
                            onTouchStart={(e) => handlePressStart(e, word)}
                            onTouchEnd={handlePressEnd}
                            onTouchMove={(e) => handlePressMove(e)}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {word.text_uthmani}
                        </span>
                        {' '}
                    </React.Fragment>
                ))}
                <span className="verse-number-badge">
                    {verseNumberArabic}
                </span>
            </>
        );
    };

    return (
        <span
            ref={ayahRef}
            {...ayahEventHandlers}
            data-verse-key={verse.verse_key}
            className={`ayah-container inline relative cursor-pointer transition-all duration-300 ${isPlaying ? 'verse-tracking-active' : ''}`}
        >
            {/* Progress underline when playing */}
            {isPlaying && (
                <span
                    className="verse-progress-bar"
                    style={{ width: `${progress}%` }}
                />
            )}

            {renderVerseContent()}


        </span>
    );
};

export default Ayah;