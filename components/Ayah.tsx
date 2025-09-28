import React from 'react';
import { Verse } from '../types';
import { useApp } from '../hooks/useApp';

interface AyahProps {
    verse: Verse;
}

const Ayah: React.FC<AyahProps> = ({ verse }) => {
    const { state, actions } = useApp();
    const isBookmarked = state.bookmarks.some(b => b.verseKey === verse.verse_key);
    const isPlaying = state.isPlaying && state.audioQueue[state.currentAudioIndex]?.verseKey === verse.verse_key;
    
    const handleClick = () => {
        actions.selectAyah(verse);
    };

    const verseNumberArabic = new Intl.NumberFormat('ar-EG').format(verse.verse_number);

    // Reconstruct verse text from the 'words' array, filtering out any non-word elements like verse numbers.
    const verseText = verse.words
      .filter(word => word.char_type_name === 'word')
      .map(word => word.text_uthmani)
      .join(' ');

    return (
        <span 
            className={`ayah inline cursor-pointer px-1 transition-colors duration-200 rounded-md relative hover:bg-primary/10 ${isPlaying ? state.playingVerseHighlightColor : ''} ${isBookmarked ? 'font-bold' : ''}`}
            onClick={handleClick}
        >
            {isBookmarked && <span className="absolute top-0 right-0 text-xs text-secondary -mt-2 -mr-2">🔖</span>}
            {verseText}
            <span className="verse-number inline-flex items-center justify-center w-7 h-7 bg-primary text-white shadow text-xs rounded-full font-ui mx-1 select-none">
                {verseNumberArabic}
            </span>
        </span>
    );
};

export default Ayah;