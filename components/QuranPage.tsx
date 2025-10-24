import React from 'react';
import { useApp } from '../hooks/useApp';
import Ayah from './Ayah';
import { Verse } from '../types';
import SurahHeader from './SurahHeader';

interface QuranPageProps {
    pageVerses: Verse[] | null;
}

const QuranPage: React.FC<QuranPageProps> = ({ pageVerses }) => {
    const { state } = useApp();
    const { isLoading, error, font, fontSize, isVerseByVerseLayout, surahs } = state;

    if (isLoading && !pageVerses) { // Show loading skeleton only if there's no data yet
        return (
            <div className="w-full h-full p-8 animate-pulse">
                <div className="space-y-4">
                    {[...Array(15)].map((_, i) => <div key={i} className="h-6 bg-bg-tertiary rounded w-full"></div>)}
                </div>
            </div>
        );
    }
    
    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    if (!pageVerses || pageVerses.length === 0) {
        return null;
    }

    const pageNumber = pageVerses[0].page_number;

    const pageStyle: React.CSSProperties = {
        fontSize: `${fontSize}px`,
        lineHeight: 2.2
    };
    let fontClassName = '';

    if (font === 'qpc-v1' && pageNumber) {
        pageStyle.fontFamily = `'quran-font-p${pageNumber}'`;
    } else {
        fontClassName = {
            arabic: 'font-arabic',
            indopak: 'font-indopak',
            noto: 'font-noto',
        }[font] || '';
    }

    // New Verse-by-Verse Layout
    if (isVerseByVerseLayout) {
        return (
            <div className={`w-full max-w-2xl animate-pageTransition ${fontClassName}`} style={pageStyle}>
                {pageVerses.map(verse => {
                    let headerContent = null;
                    if (verse.verse_number === 1) {
                        const surah = surahs.find(s => s.id === verse.chapter_id);
                        if (surah) {
                            headerContent = <SurahHeader surah={surah} />;
                        }
                    }

                    const tafsirText = verse.tafsirs?.[0]?.text.replace(/<[^>]*>/g, '') || 'التفسير غير متوفر.';

                    return (
                        <div key={verse.verse_key} className="mb-8 py-4 border-b border-border last:border-b-0">
                            {headerContent}
                            <div className="text-right" style={{ lineHeight: 2.3 }}>
                                <Ayah verse={verse} />
                            </div>
                            <div className="mt-4 pr-4 border-r-2 border-primary/50">
                                <p className="font-ui text-text-secondary" style={{ fontSize: `${Math.max(14, fontSize - 6)}px`, lineHeight: 1.8 }}>
                                    {tafsirText}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Original Page Layout
    return (
        <div className="w-full animate-pageTransition overflow-y-auto custom-scrollbar">
            <div 
              className={`text-right ${fontClassName}`}
              style={pageStyle}
            >
                {pageVerses.map(verse => {
                    let headerContent = null;
                    if (verse.verse_number === 1) {
                        const surah = state.surahs.find(s => s.id === verse.chapter_id);
                        if (surah) {
                            headerContent = <SurahHeader surah={surah} />;
                        }
                    }
                    return (
                        <React.Fragment key={verse.verse_key}>
                            {headerContent}
                            <Ayah verse={verse} />{' '}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default QuranPage;