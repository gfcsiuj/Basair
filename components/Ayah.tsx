import React, { useRef, useEffect, useMemo, useCallback } from 'react';
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
    const isSelected = state.highlightedAyahKey === verse.verse_key;
    const isLastRead = state.lastRead?.verseKey === verse.verse_key;

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
    const isLongPressTriggered = useRef(false);

    const ayahLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup timers on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (wordLongPressTimer.current) clearTimeout(wordLongPressTimer.current);
            if (ayahLongPressTimer.current) clearTimeout(ayahLongPressTimer.current);
        };
    }, []);

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent, word: Word | { position: number }) => {
        e.stopPropagation();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        wordPressStartPos.current = { x: clientX, y: clientY };
        isLongPressTriggered.current = false;

        wordLongPressTimer.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            actions.selectAyah(verse, word.position);
            wordLongPressTimer.current = null;
        }, 500);
    };

    const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (wordLongPressTimer.current) {
            clearTimeout(wordLongPressTimer.current);
            wordLongPressTimer.current = null;
        }
        wordPressStartPos.current = null;
        if (isLongPressTriggered.current) {
            e.preventDefault();
            e.stopPropagation();
        }
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
            if (!state.wordGlyphData) {
                return <>{verse.glyphText ?? verse.text_uthmani}</>;
            }

            const verseKeyPrefix = `${verse.chapter_id}:${verse.verse_number}:`;
            const qpcWords = Object.entries(state.wordGlyphData)
                .filter(([key]) => key.startsWith(verseKeyPrefix))
                .map(([key, wordInfo]) => {
                    const parts = key.split(':');
                    return {
                        id: wordInfo.id,
                        text: wordInfo.text,
                        position: parseInt(parts[2], 10)
                    };
                })
                .sort((a, b) => a.position - b.position);

            if (qpcWords.length === 0) {
                return <>{verse.glyphText ?? verse.text_uthmani}</>;
            }

            return (
                <>
                    {qpcWords.map(qWord => (
                        <span
                            key={qWord.id}
                            className="word inline-block"
                            onMouseDown={(e) => handlePressStart(e, { position: qWord.position } as any)}
                            onMouseUp={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            onMouseMove={handlePressMove}
                            onTouchStart={(e) => handlePressStart(e, { position: qWord.position } as any)}
                            onTouchEnd={handlePressEnd}
                            onTouchMove={handlePressMove}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {qWord.text}
                        </span>
                    ))}
                    <span className="verse-number-badge inline-block text-[0.4em] translate-y-[-0.6em] mx-1">
                        {verseNumberArabic}
                    </span>
                </>
            );
        }

        return (
            <>
                {verse.words.filter(word => word.char_type_name === 'word').map(word => (
                    <React.Fragment key={word.id}>
                        <span
                            className="word inline-block"
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

    // Build dynamic class for highlighting
    let highlightClass = '';
    if (isSelected) {
        highlightClass = 'verse-selected';
    } else if (isLastRead) {
        highlightClass = 'verse-last-read';
    }

    return (
        <span
            ref={ayahRef}
            {...ayahEventHandlers}
            data-verse-key={verse.verse_key}
            className={`ayah-container inline relative cursor-pointer transition-all duration-300 ${isPlaying ? 'verse-tracking-active' : ''} ${highlightClass}`}
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