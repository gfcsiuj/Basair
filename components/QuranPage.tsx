import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import Bismillah from './Bismillah';
import SurahHeader from './SurahHeader';
import InteractiveLine from './InteractiveLine';
import VerseByVersePage from './VerseByVersePage';
import { Verse } from '../types';

/**
 * VerseGlyphSegment - wraps a verse's glyph characters in a trackable inline span.
 * When the verse is playing, this span highlights with glow + progress bar.
 */
const VerseGlyphSegment = React.memo(({ verseKey, text, pageVerses }: { verseKey: string; text: string; pageVerses: Verse[] | null }) => {
    const { state } = useApp();
    const ref = useRef<HTMLSpanElement>(null);

    const isPlaying = state.isPlaying && state.audioQueue[state.currentAudioIndex]?.verseKey === verseKey;

    // Auto-scroll to the playing verse segment
    useEffect(() => {
        if (isPlaying && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isPlaying]);

    // Calculate progress
    const progress = isPlaying && state.audioDuration > 0
        ? Math.min(100, (state.audioCurrentTime / state.audioDuration) * 100)
        : 0;

    // Translation text for playing verse
    const verse = isPlaying ? pageVerses?.find(v => v.verse_key === verseKey) : null;
    const surahName = verse ? state.surahs.find(s => s.id === verse.chapter_id)?.name_arabic : '';
    const translationText = verse?.translations?.[0]?.text
        ?.replace(/<sup[^>]*>.*?<\/sup>/g, '')
        ?.replace(/<[^>]*>/g, '') || null;

    return (
        <span
            ref={ref}
            data-verse-key={verseKey}
            className={`verse-glyph-segment ${isPlaying ? 'verse-glyph-active' : ''}`}
        >
            {text}
            {/* Progress bar */}
            {isPlaying && (
                <span
                    className="verse-glyph-progress"
                    style={{ width: `${progress}%` }}
                />
            )}
            {/* Translation popup */}
            {isPlaying && translationText && (
                <span className="verse-translation-popup">
                    <span className="verse-translation-label">
                        <i className="fas fa-language" style={{ fontSize: '10px', marginLeft: '4px' }}></i>
                        {surahName} : {verse ? new Intl.NumberFormat('ar-EG').format(verse.verse_number) : ''}
                    </span>
                    <span className="verse-translation-text">{translationText}</span>
                </span>
            )}
        </span>
    );
});

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
    pageNumber?: number;
}> = ({ pageVerses, pageNumber }) => {
    const { state } = useApp();
    const { isLoading, error, font, surahs, wordGlyphData, layoutDb } = state;
    // Use the passed pageNumber or fall back to global state currentPage
    const targetPage = pageNumber || state.currentPage;

    const [responsiveFontSize, setResponsiveFontSize] = useState(getResponsiveFontSize());
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const [linesForPage, setLinesForPage] = useState<LineData[]>([]);

    // ... (resize effect omitted as it doesn't need changes)

    // Effect to load page-specific font
    useEffect(() => {
        const styleId = `dynamic-quran-font-style-${targetPage}`;
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        if (font === 'qpc-v1' && targetPage > 0) {
            const cssRule = `
                @font-face {
                    font-family: 'QuranPageFontV2-${targetPage}';
                    src: url('/QPC V2 Font/p${targetPage}.ttf') format('truetype');
                    font-display: block;
                }
            `;
            if (styleEl.innerHTML !== cssRule) {
                styleEl.innerHTML = cssRule;
            }
        } else {
            if (styleEl.innerHTML !== '') styleEl.innerHTML = '';
        }

        return () => {
            // Clean up style element when component unmounts
            if (styleEl && styleEl.parentNode) {
                styleEl.parentNode.removeChild(styleEl);
            }
        };
    }, [targetPage, font]);

    // Effect to query line data from DB
    useEffect(() => {
        if (layoutDb && targetPage) {
            try {
                const stmt = layoutDb.prepare(`
                    SELECT line_number, line_type, is_centered, first_word_id, last_word_id, surah_number 
                    FROM pages 
                    WHERE page_number = :page
                    ORDER BY line_number ASC
                `);
                stmt.bind({ ':page': targetPage });
                const lines: LineData[] = [];
                while (stmt.step()) {
                    lines.push(stmt.getAsObject() as unknown as LineData);
                }
                stmt.free();
                setLinesForPage(lines);
            } catch (err) {
                console.error(`Failed to query page ${targetPage}:`, err);
                setLinesForPage([]);
            }
        }
    }, [layoutDb, targetPage]);

    // Memoize word glyphs into a Map for fast O(1) lookups
    const memoizedWordGlyphsById = useMemo(() => {
        if (!wordGlyphData) return null;
        const map = new Map<number, string>();
        for (const wordInfo of Object.values(wordGlyphData)) {
            map.set(wordInfo.id, wordInfo.text);
        }
        return map;
    }, [wordGlyphData]);

    // Build a wordId → verseKey lookup map for O(1) verse identification
    const wordIdToVerseKey = useMemo(() => {
        if (!wordGlyphData) return null;
        const map = new Map<number, string>();
        for (const [key, wordInfo] of Object.entries(wordGlyphData)) {
            const parts = key.split(':');
            map.set(wordInfo.id, `${parts[0]}:${parts[1]}`);
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
                    if (memoizedWordGlyphsById && wordIdToVerseKey && line.first_word_id && line.last_word_id) {
                        // Group word glyphs by verse key for precise per-verse tracking
                        const segments: { verseKey: string; text: string }[] = [];
                        let currentVerseKey = '';
                        let currentText = '';

                        for (let i = line.first_word_id; i <= line.last_word_id; i++) {
                            const glyph = memoizedWordGlyphsById.get(i) || '';
                            const vk = wordIdToVerseKey.get(i) || '';

                            if (vk !== currentVerseKey && currentText) {
                                segments.push({ verseKey: currentVerseKey, text: currentText });
                                currentText = '';
                            }
                            currentVerseKey = vk;
                            currentText += glyph;
                        }
                        if (currentText) {
                            segments.push({ verseKey: currentVerseKey, text: currentText });
                        }

                        // Render each verse segment as a separate trackable span
                        lineContent = segments.map((seg, i) => (
                            <VerseGlyphSegment key={`${seg.verseKey}-${i}`} verseKey={seg.verseKey} text={seg.text} pageVerses={pageVerses} />
                        ));
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
    }, [linesForPage, surahs, memoizedWordGlyphsById, wordIdToVerseKey, pageVerses]);

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
        fontFamily: font === 'qpc-v1' ? `QuranPageFontV2-${targetPage}` : 'inherit',
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
                {state.isVerseByVerseLayout ? (
                    <VerseByVersePage pageVerses={pageVerses} />
                ) : (
                    pageContent
                )}
            </div>
        </div>
    );
};

export default React.memo(QuranPage);