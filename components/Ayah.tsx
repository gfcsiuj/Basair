import React, { useRef } from 'react';
import { Verse, Word } from '../types';
import { useApp } from '../hooks/useApp';

interface AyahProps {
    verse: Verse & { glyphText?: string };
}

const Ayah: React.FC<AyahProps> = ({ verse }) => {
    const { state, actions } = useApp();
    const { font } = state;

    const isPlaying = state.isPlaying && state.audioQueue[state.currentAudioIndex]?.verseKey === verse.verse_key;

    const wordLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wordPressStartPos = useRef<{x: number, y: number} | null>(null);
    
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
        // Only start the timer if the event is not on a specific word
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
    
    // For qpc font, the font itself includes the verse number symbol.
    // The entire ayah text becomes the interactive element.
    if (font === 'qpc-v1') {
        const text = verse.glyphText ?? verse.text_uthmani;
        return (
             <span 
                {...ayahEventHandlers}
                id={`ayah-${verse.verse_key.replace(':', '-')}`}
                onContextMenu={(e) => {
                    e.preventDefault();
                    actions.selectAyah(verse);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    actions.selectAyah(verse);
                }}
                className={`ayah-container inline relative cursor-pointer pointer-events-auto ${isPlaying ? 'bg-emerald-500/20 rounded-md' : ''} transition-colors duration-300`}
            >
                {text}
            </span>
        );
    }

    // For other fonts, we render word-by-word and show the verse number circle.
    return (
        <span 
            {...ayahEventHandlers}
            className={`ayah-container inline relative cursor-pointer ${isPlaying ? 'bg-emerald-500/20 rounded-md' : ''} transition-colors duration-300`}
        >
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
            
            <span 
                className="inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary/20 text-primary font-ui mx-1 select-none text-sm"
            >
                {verseNumberArabic}
            </span>
        </span>
    );
};

export default Ayah;