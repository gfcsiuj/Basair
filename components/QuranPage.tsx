import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import Bismillah from './Bismillah';
import SurahHeader from './SurahHeader';
import InteractiveLine from './InteractiveLine';
import VerseByVersePage from './VerseByVersePage';
import { Verse } from '../types';
import { renderedFontPages } from '../utils/fontPageTracker';

/**
 * VerseGlyphSegment - wraps a verse's glyph characters in a trackable inline span.
 * When the verse is playing, this span highlights with glow + progress bar.
 */
const VerseGlyphSegment = React.memo(({ verseKey, text, pageVerses }: { verseKey: string; text: string; pageVerses: Verse[] | null }) => {
    const { state } = useApp();
    const ref = useRef<HTMLSpanElement>(null);

    const isPlaying = state.isPlaying && state.audioQueue[state.currentAudioIndex]?.verseKey === verseKey;
    const isLastRead = state.lastRead?.verseKey === verseKey;

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



    return (
        <span
            ref={ref}
            data-verse-key={verseKey}
            className={`verse-glyph-segment ${isPlaying ? 'verse-glyph-active' : ''} ${isLastRead ? 'verse-last-read' : ''}`}
        >
            {text}
            {/* Progress bar */}
            {isPlaying && (
                <span
                    className="verse-glyph-progress"
                    style={{ width: `${progress}%` }}
                />
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

    // Query line layout data from SQLite synchronously during render.
    // useMemo ensures this only runs when layoutDb or targetPage changes.
    // Synchronous = linesForPage is ALWAYS ready on first render, no blank-content flash.
    const linesForPage = useMemo<LineData[]>(() => {
        if (!layoutDb || !targetPage) return [];
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
            return lines;
        } catch (err) {
            console.error(`Failed to query page ${targetPage}:`, err);
            return [];
        }
    }, [layoutDb, targetPage]);

    // --- Fix A: synchronous font check in render ---
    // THREE ways isFontReady can be true synchronously:
    // 1. Not QPC font
    // 2. renderedFontPages.has(targetPage): MainReadingInterface marked this page
    //    as CSS-rendered BEFORE calling flushSync — so on first render of new targetPage
    //    this is already true → ZERO white frames (key fix for OTS-broken fonts)
    // 3. document.fonts.check(): fast path if FontFace API happens to work
    const isFontCheckedSync = font !== 'qpc-v1'
        || targetPage <= 0
        || renderedFontPages.has(targetPage)
        || document.fonts.check(`1em QuranPageFontV2-${targetPage}`);

    // fontReadyPage handles async loading for first-time page loads not in renderedFontPages
    const [fontReadyPage, setFontReadyPage] = useState<number | null>(null);
    const isFontReady = isFontCheckedSync || fontReadyPage === targetPage;

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
            // Do NOT remove the style element on unmount.
            // Fonts are cached by the browser and reused, so keeping the @font-face
            // declaration alive avoids re-fetching the font file on every page flip.
        };
    }, [targetPage, font]);

    // Load the page-specific font and track when it's ready.
    // Uses document.fonts.load() which resolves only when the font binary is fetched.
    // We never explicitly set fontReadyPage to null — it stays at the last confirmed page,
    // so isFontReady goes false synchronously on targetPage change, then back to true
    // only after the new font is confirmed loaded.
    useEffect(() => {
        if (font !== 'qpc-v1' || targetPage <= 0) {
            renderedFontPages.add(targetPage);
            setFontReadyPage(targetPage);
            return;
        }

        const fontFamily = `QuranPageFontV2-${targetPage}`;
        const fontSpec = `1em ${fontFamily}`;

        // Fast path: already tracked as rendered (e.g. was an adjacent page)
        if (renderedFontPages.has(targetPage)) {
            setFontReadyPage(targetPage);
            return;
        }

        if (document.fonts.check(fontSpec)) {
            renderedFontPages.add(targetPage);
            setFontReadyPage(targetPage);
            return;
        }

        let cancelled = false;

        const resolve = () => {
            if (!cancelled) {
                // Mark as rendered — even OTS failure means CSS showed it correctly
                renderedFontPages.add(targetPage);
                setFontReadyPage(targetPage);
            }
        };

        // document.fonts.load() fails with OTS for SVG-format QPC fonts,
        // but .catch(resolve) ensures we still show the page (CSS renders it fine)
        document.fonts.load(fontSpec).then(resolve).catch(resolve);

        return () => { cancelled = true; };
    }, [targetPage, font]);




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

    const isCenteredPage = targetPage === 1 || targetPage === 2;

    return (
        <div className="w-full" style={{ opacity: isFontReady ? 1 : 0 }}>
            <PageJuzHeader />
            <div className={isCenteredPage ? 'quran-page-centered' : ''} style={pageStyle}>
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