import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import Bismillah from './Bismillah';
import SurahHeader from './SurahHeader';
import Ayah from './Ayah';
import { Verse } from '../types';

interface LineData {
    line_number: number;
    line_type: 'surah_name' | 'basmallah' | 'ayah';
    is_centered: number; // 0 or 1
    first_word_id: number | null;
    last_word_id: number | null;
    surah_number: number | null;
}

const QuranPage: React.FC<{
    pageVerses: Verse[] | null;
}> = ({ pageVerses }) => {
    const { state } = useApp();
    const { isLoading, error, font, fontSize, surahs, wordGlyphData, layoutDb, currentPage } = state;
    const [linesForPage, setLinesForPage] = useState<LineData[]>([]);

    // Effect to load page-specific font
    useEffect(() => {
        const styleId = 'dynamic-quran-font-style';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        if (font === 'qpc-v1' && currentPage > 0) {
            const page = currentPage;
            const cssRule = `
                @font-face {
                    font-family: 'QuranPageFontV2';
                    src: url('/QPC V2 Font/p${page}.ttf') format('truetype');
                    font-display: block;
                }
            `;
            if (styleEl.innerHTML !== cssRule) {
                styleEl.innerHTML = cssRule;
            }
        } else {
            if (styleEl.innerHTML !== '') styleEl.innerHTML = '';
        }
    }, [currentPage, font]);

    // Effect to query line data from DB
    useEffect(() => {
        if (layoutDb && currentPage) {
            try {
                const stmt = layoutDb.prepare(`
                    SELECT line_number, line_type, is_centered, first_word_id, last_word_id, surah_number 
                    FROM pages 
                    WHERE page_number = :page
                    ORDER BY line_number ASC
                `);
                stmt.bind({ ':page': currentPage });
                const lines: LineData[] = [];
                while (stmt.step()) {
                    lines.push(stmt.getAsObject() as unknown as LineData);
                }
                stmt.free();
                setLinesForPage(lines);
            } catch (err) {
                console.error(`Failed to query page ${currentPage}:`, err);
                setLinesForPage([]);
            }
        }
    }, [layoutDb, currentPage]);
    
    // Memoize word glyphs into a Map for fast O(1) lookups
    const memoizedWordGlyphsById = useMemo(() => {
        if (!wordGlyphData) return null;
        const map = new Map<number, string>();
        for (const wordInfo of Object.values(wordGlyphData)) {
            map.set(wordInfo.id, wordInfo.text);
        }
        return map;
    }, [wordGlyphData]);

    // Create a map of wordId to Verse for easy lookup
    const wordIdToVerseMap = useMemo(() => {
        if (!pageVerses) return null;
        const map = new Map<number, Verse>();
        for (const verse of pageVerses) {
            if (verse.words) {
                for (const word of verse.words) {
                    map.set(word.id, verse);
                }
            }
        }
        return map;
    }, [pageVerses]);

    // Memoize the entire rendered page content for performance
    const pageContent = useMemo(() => {
        if (!linesForPage.length || !surahs) return null;

        // Keep track of which verses have already had their ID rendered on this page
        const renderedVerseIds = new Set<string>();

        return linesForPage.map((line) => {
            let lineContent: React.ReactNode = null;
            const lineStyle: React.CSSProperties = {
                 textAlign: line.is_centered ? 'center' : 'justify',
            };

            switch (line.line_type) {
                case 'surah_name':
                    const surah = surahs.find(s => s.id === line.surah_number);
                    if (surah) {
                        lineContent = <SurahHeader surah={surah} />;
                    }
                    break;
                case 'basmallah':
                    lineContent = <Bismillah />;
                    break;
                case 'ayah':
                    if (memoizedWordGlyphsById && wordIdToVerseMap && line.first_word_id && line.last_word_id) {
                        const segments: React.ReactNode[] = [];
                        let currentVerse: Verse | null = null;
                        let currentSegmentText = '';
                        let currentSegmentKey = 0;

                        for (let i = line.first_word_id; i <= line.last_word_id; i++) {
                            const wordText = memoizedWordGlyphsById.get(i) || '';
                            const verse = wordIdToVerseMap.get(i);

                            if (verse !== currentVerse) {
                                // Close previous segment if exists
                                if (currentVerse && currentSegmentText) {
                                    const isFirstSegment = !renderedVerseIds.has(currentVerse.verse_key);
                                    if (isFirstSegment) renderedVerseIds.add(currentVerse.verse_key);

                                    segments.push(
                                        <Ayah
                                            key={`${currentVerse.id}-${currentSegmentKey++}`}
                                            verse={currentVerse}
                                            disableId={!isFirstSegment}
                                        >
                                            {currentSegmentText}
                                        </Ayah>
                                    );
                                }

                                // Start new segment
                                currentVerse = verse || null;
                                currentSegmentText = wordText;
                            } else {
                                // Continue current segment
                                currentSegmentText += wordText;
                            }
                        }

                        // Push the last segment
                        if (currentVerse && currentSegmentText) {
                            const isFirstSegment = !renderedVerseIds.has(currentVerse.verse_key);
                            if (isFirstSegment) renderedVerseIds.add(currentVerse.verse_key);

                            segments.push(
                                <Ayah
                                    key={`${currentVerse.id}-${currentSegmentKey++}`}
                                    verse={currentVerse}
                                    disableId={!isFirstSegment}
                                >
                                    {currentSegmentText}
                                </Ayah>
                            );
                        } else if (!currentVerse && currentSegmentText) {
                             // Fallback for text without verse association (shouldn't typically happen for ayah lines)
                             segments.push(<span key="orphan">{currentSegmentText}</span>);
                        }

                        lineContent = segments;
                    }
                    break;
                default:
                    lineContent = null;
            }
            
            return (
                <div key={line.line_number} style={lineStyle}>
                    {lineContent}
                </div>
            );
        });
    }, [linesForPage, surahs, memoizedWordGlyphsById, wordIdToVerseMap]);

    if (isLoading && !pageContent) {
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

    if (!pageContent) {
        return null;
    }
    
    const pageStyle: React.CSSProperties = {
        fontFamily: font === 'qpc-v1' ? 'QuranPageFontV2' : 'inherit',
        fontSize: `${fontSize}px`,
        direction: 'rtl',
        lineHeight: 2.2,
    };
    
    const juzNumber = pageVerses?.[0]?.juz_number;
    const PageJuzHeader = () => {
         if (!juzNumber) return null;
         const paddedJuz = String(juzNumber).padStart(3, '0');
         const juzLigature = `juz${paddedJuz}`;
         const juzNameLigature = `j${paddedJuz}`;
         return (
             <div className="flex justify-between items-center text-lg mb-4 text-primary px-2" style={{fontFamily: 'quran-common', fontFeatureSettings: '"calt", "liga"' }}>
                <span>{juzLigature}</span>
                <span>{juzNameLigature}</span>
            </div>
         );
    };

    return (
        <div className="w-full animate-pageTransition">
            <PageJuzHeader />
            <div style={pageStyle}>
                {pageContent}
            </div>
        </div>
    );
};

export default QuranPage;