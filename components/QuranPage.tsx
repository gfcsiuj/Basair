import React, { useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import Ayah from './Ayah';
import { Verse } from '../types';
import SurahHeader from './SurahHeader';

const QuranPage: React.FC<{
    pageVerses: Verse[] | null;
}> = ({ pageVerses }) => {
    const { state } = useApp();
    const { isLoading, error, font, fontSize, isVerseByVerseLayout, surahs, wordGlyphData } = state;

    const processedVerses = useMemo(() => {
        if (!pageVerses) return [];
        // Only process for the qpc-v1 font, otherwise return original verses
        if (font !== 'qpc-v1' || !wordGlyphData) {
            return pageVerses.map(v => ({...v, glyphText: ''}));
        };

        return pageVerses.map(verse => {
            const verseKeyPrefix = `${verse.chapter_id}:${verse.verse_number}:`;
            const verseGlyphText = Object.entries(wordGlyphData)
                .filter(([key]) => key.startsWith(verseKeyPrefix))
                .map(([key, wordInfo]) => ({ ...wordInfo, wordNum: parseInt(key.split(':')[2], 10) }))
                .sort((a, b) => a.wordNum - b.wordNum)
                .map(wordInfo => (wordInfo as any).text)
                .join('');
            return { ...verse, glyphText: verseGlyphText };
        });
    }, [pageVerses, wordGlyphData, font]);

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

    if (!processedVerses || processedVerses.length === 0) {
        return null;
    }

    const pageNumber = processedVerses[0].page_number;
    const juzNumber = processedVerses[0].juz_number;
    
    const paddedJuz = String(juzNumber).padStart(3, '0');
    const juzLigature = `juz${paddedJuz}`;
    const juzNameLigature = `j${paddedJuz}`;


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

    const PageJuzHeader = () => (
         <div className="flex justify-between items-center text-lg mb-4 text-primary px-2" style={{fontFamily: 'quran-common', fontFeatureSettings: '"calt", "liga"' }}>
            <span>{juzLigature}</span>
            <span>{juzNameLigature}</span>
        </div>
    );

    // New Verse-by-Verse Layout
    if (isVerseByVerseLayout) {
        return (
            <div className={`w-full max-w-2xl animate-pageTransition ${fontClassName}`} style={pageStyle}>
                <PageJuzHeader />
                {processedVerses.map(verse => {
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
            <PageJuzHeader />
            <div 
              className={`text-right ${fontClassName}`}
              style={pageStyle}
            >
                {processedVerses.map(verse => {
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