import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import Bismillah from './Bismillah';
import SurahHeader from './SurahHeader';
import InteractiveLine from './InteractiveLine';
import { Verse } from '../types';

// Calculate optimal font size based on viewport for Quran-like experience
// This creates a fixed, automatic sizing that fills the screen beautifully like a real Quran
const getResponsiveFontSize = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isLandscape = vw > vh;

    if (isLandscape) {
        // Landscape mode: text fills width horizontally, scroll vertically
        // Use 5.5% of viewport width to fill the screen in landscape
        return Math.min(Math.max(vw * 0.055, 22), 55);
    } else {
        // Portrait mode: text fills the full screen width like a Quran page
        // Use ~6% of viewport width for immersive, beautiful Quran reading
        // This fits approximately 15-16 lines per page
        return Math.min(Math.max(vw * 0.06, 20), 38);
    }
};

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
    const { isLoading, error, font, surahs, wordGlyphData, layoutDb, currentPage } = state;
    const [responsiveFontSize, setResponsiveFontSize] = useState(getResponsiveFontSize());
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const [linesForPage, setLinesForPage] = useState<LineData[]>([]);

    // Effect to handle responsive font sizing and orientation changes
    useEffect(() => {
        const handleResize = () => {
            setResponsiveFontSize(getResponsiveFontSize());
            setIsLandscape(window.innerWidth > window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        // Initial calculation
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

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

    // Memoize the entire rendered page content for performance
    const pageContent = useMemo(() => {
        if (!linesForPage.length || !surahs) return null;

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
                    return (
                        <div key={line.line_number} style={lineStyle}>
                            {lineContent}
                        </div>
                    );
                case 'basmallah':
                    lineContent = <Bismillah />;
                    return (
                        <div key={line.line_number} style={lineStyle}>
                            {lineContent}
                        </div>
                    );
                case 'ayah':
                    if (memoizedWordGlyphsById && line.first_word_id && line.last_word_id) {
                        let wordsInLine = '';
                        // Efficiently build the line string using the Map
                        for (let i = line.first_word_id; i <= line.last_word_id; i++) {
                            wordsInLine += memoizedWordGlyphsById.get(i) || '';
                        }
                        lineContent = wordsInLine;
                    }
                    // استخدام InteractiveLine للأسطر التي تحتوي على آيات
                    return (
                        <InteractiveLine
                            key={line.line_number}
                            lineStyle={lineStyle}
                            lineNumber={line.line_number}
                            pageVerses={pageVerses}
                            firstWordId={line.first_word_id}
                            lastWordId={line.last_word_id}
                        >
                            {lineContent}
                        </InteractiveLine>
                    );
                default:
                    return null;
            }
        });
    }, [linesForPage, surahs, memoizedWordGlyphsById, pageVerses]);

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

    // Calculate line height based on orientation for optimal reading
    // Portrait: 1.95 to fit ~15 lines per page like a Quran
    // Landscape: 1.8 for comfortable horizontal reading with scroll
    const lineHeightValue = isLandscape ? 1.8 : 1.95;

    const pageStyle: React.CSSProperties = {
        fontFamily: font === 'qpc-v1' ? 'QuranPageFontV2' : 'inherit',
        // Use responsive font size that auto-scales based on device
        fontSize: `${responsiveFontSize}px`,
        direction: 'rtl',
        lineHeight: lineHeightValue,
        // Prevent text size adjustment by mobile browsers
        WebkitTextSizeAdjust: '100%',
        textSizeAdjust: '100%',
        // Ensure text fills the full width
        width: '100%',
    };

    const juzNumber = pageVerses?.[0]?.juz_number;
    const PageJuzHeader = () => {
        if (!juzNumber) return null;
        const paddedJuz = String(juzNumber).padStart(3, '0');
        const juzLigature = `juz${paddedJuz}`;
        const juzNameLigature = `j${paddedJuz}`;
        return (
            <div className="flex justify-between items-center text-lg mb-4 text-primary px-2" style={{ fontFamily: 'quran-common', fontFeatureSettings: '"calt", "liga"' }}>
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