import React, { useMemo } from 'react';
import { Verse } from '../types';
import { useApp } from '../hooks/useApp';
import { OrnamentalDivider } from './SvgDecorations';

interface VerseByVersePageProps {
    pageVerses: Verse[] | null;
}

const VerseByVersePage: React.FC<VerseByVersePageProps> = ({ pageVerses }) => {
    const { state, actions } = useApp();

    if (!pageVerses || pageVerses.length === 0) {
        return null;
    }

    // Build glyph text for each verse when using qpc-v1 font
    const getGlyphText = (verse: Verse): string | null => {
        if (state.font !== 'qpc-v1' || !state.wordGlyphData) return null;
        const verseKeyPrefix = `${verse.chapter_id}:${verse.verse_number}:`;
        return Object.entries(state.wordGlyphData)
            .filter(([key]) => key.startsWith(verseKeyPrefix))
            .map(([key, wordInfo]) => ({ ...wordInfo, wordNum: parseInt(key.split(':')[2], 10) }))
            .sort((a, b) => a.wordNum - b.wordNum)
            .map(wordInfo => (wordInfo as any).text)
            .join('');
    };

    const isPlayingVerse = (verse: Verse) => {
        return state.isPlaying && state.audioQueue[state.currentAudioIndex]?.verseKey === verse.verse_key;
    };

    const verseNumberArabic = (num: number) => new Intl.NumberFormat('ar-EG').format(num);

    return (
        <div className="w-full flex flex-col gap-4 px-3 py-5 md:px-6 max-w-3xl mx-auto">
            {pageVerses.map((verse, index) => {
                const glyphText = getGlyphText(verse);
                const isPlaying = isPlayingVerse(verse);
                const surahName = state.surahs.find(s => s.id === verse.chapter_id)?.name_arabic;

                return (
                    <div key={verse.verse_key}>
                        <div
                            className={`
                                flex flex-col gap-3 p-4 rounded-2xl transition-all duration-500
                                ${isPlaying
                                    ? 'bg-primary/8 ring-2 ring-primary/30 shadow-lg shadow-primary/5'
                                    : state.selectedAyah?.verse_key === verse.verse_key
                                        ? 'bg-primary/5 ring-1 ring-primary/20'
                                        : 'bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/8'
                                }
                            `}
                            style={{
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            {/* Header: Surah Name and Verse Number + Actions */}
                            <div className="flex items-center justify-between px-1">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isPlaying ? 'bg-primary/15 text-primary' : 'bg-bg-tertiary text-text-tertiary'}`}>
                                    {surahName} : {verseNumberArabic(verse.verse_number)}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => actions.toggleBookmark(verse)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${state.bookmarks.some(b => b.verseKey === verse.verse_key) ? 'text-yellow-500 bg-yellow-500/10' : 'text-text-tertiary hover:text-primary hover:bg-primary/5'}`}
                                    >
                                        <i className={`${state.bookmarks.some(b => b.verseKey === verse.verse_key) ? 'fas' : 'far'} fa-bookmark text-sm`}></i>
                                    </button>
                                    <button
                                        onClick={() => actions.selectAyah(verse)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        <i className="fas fa-ellipsis-v text-sm"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Arabic Verse Text - Quran Font */}
                            <div
                                className="text-center px-2 leading-[2.2]"
                                style={{
                                    fontFamily: state.font === 'qpc-v1' ? 'QuranPageFontV2' : 'inherit',
                                    fontSize: `${state.fontSize * 1.4}px`,
                                    direction: 'rtl',
                                    wordSpacing: '0.12em',
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                {glyphText || verse.text_uthmani}
                            </div>

                            {/* Translation Text */}
                            {verse.translations && verse.translations.length > 0 && (
                                <div className="text-center text-text-secondary text-sm leading-relaxed border-t border-border/30 pt-3 mt-1 font-sans px-3">
                                    {verse.translations[0].text.replace(/<sup[^>]*>.*?<\/sup>/g, '')}
                                </div>
                            )}
                        </div>

                        {/* Decorative divider between verses */}
                        {index < pageVerses.length - 1 && (
                            <div className="my-2 opacity-30">
                                <OrnamentalDivider />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default VerseByVersePage;
