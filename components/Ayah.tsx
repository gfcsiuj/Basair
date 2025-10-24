import React, { useRef } from 'react';
import { Verse, Word } from '../types';
import { useApp } from '../hooks/useApp';

interface AyahProps {
    verse: Verse;
}

const Ayah: React.FC<AyahProps> = ({ verse }) => {
    const { state, actions } = useApp();
    const { font } = state;

    const isPlaying = state.isPlaying && state.audioQueue[state.currentAudioIndex]?.verseKey === verse.verse_key;

    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pressStartPos = useRef<{x: number, y: number} | null>(null);

    const handlePressStart = (word: Word, clientX: number, clientY: number) => {
        pressStartPos.current = { x: clientX, y: clientY };
        
        longPressTimer.current = setTimeout(() => {
            // Long press successful
            actions.selectWord(verse, word);
            longPressTimer.current = null;
        }, 500); // 500ms delay for long press
    };

    const handlePressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressStartPos.current = null;
    };

    const handlePressMove = (clientX: number, clientY: number) => {
        if (longPressTimer.current && pressStartPos.current) {
            const dx = Math.abs(clientX - pressStartPos.current.x);
            const dy = Math.abs(clientY - pressStartPos.current.y);

            // If user moves more than a small threshold, cancel the long press
            if (dx > 10 || dy > 10) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
                pressStartPos.current = null;
            }
        }
    };

    const verseNumberArabic = new Intl.NumberFormat('ar-EG').format(verse.verse_number);

    const handleAyahClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent UI toggle
        actions.selectAyah(verse);
    }

    const renderVerseNumber = () => (
        <span 
            onClick={handleAyahClick}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary/20 text-primary font-ui mx-1 select-none text-sm cursor-pointer"
        >
            {verseNumberArabic}
        </span>
    );
    
    if (font === 'qpc-v1' && state.glyphData && state.glyphData[verse.verse_key]) {
        return (
             <span 
                className={`ayah-container inline relative ${isPlaying ? 'bg-emerald-500/20 rounded-md' : ''} transition-colors duration-300`}
            >
                <span onClick={handleAyahClick} className="cursor-pointer">
                    {state.glyphData[verse.verse_key].text}
                </span>
                {' '}
                {renderVerseNumber()}
            </span>
        )
    }

    return (
        <span 
            className={`ayah-container inline relative ${isPlaying ? 'bg-emerald-500/20 rounded-md' : ''} transition-colors duration-300`}
        >
            {verse.words.filter(word => word.char_type_name === 'word').map(word => (
                 <React.Fragment key={word.id}>
                    <span 
                        className="word hover:text-primary transition-colors cursor-pointer"
                        onMouseDown={(e) => handlePressStart(word, e.clientX, e.clientY)}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onMouseMove={(e) => handlePressMove(e.clientX, e.clientY)}
                        onTouchStart={(e) => handlePressStart(word, e.touches[0].clientX, e.touches[0].clientY)}
                        onTouchEnd={handlePressEnd}
                        onTouchMove={(e) => handlePressMove(e.touches[0].clientX, e.touches[0].clientY)}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {word.text_uthmani}
                    </span>
                    {' '}
                 </React.Fragment>
            ))}
            
            {renderVerseNumber()}
        </span>
    );
};

export default Ayah;