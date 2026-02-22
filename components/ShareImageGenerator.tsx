import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { showToast } from './ToastContainer';

declare const html2canvas: any;

// Premium Color Palettes for the Share Card
const THEMES = [
    { id: 'cream', label: 'كلاسيكي', bg: '#FDFBF7', text: '#1A1A1A', accent: '#B89047', border: '#E8DCC4' },
    { id: 'onyx', label: 'أسود ملوكي', bg: '#101010', text: '#F4F4F4', accent: '#D4AF37', border: '#333333' },
    { id: 'emerald', label: 'زمردي', bg: '#0D3625', text: '#F5F7F2', accent: '#E3C174', border: '#1C5C42' },
    { id: 'navy', label: 'كحلي', bg: '#0B172A', text: '#F0F4F8', accent: '#C5A059', border: '#1E3250' },
];

const SVG = {
    close: 'M6 18L18 6M6 6l12 12',
    image: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
    copy: 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75',
    text: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12',
    moon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
    fingerprint: 'M4.909 3.125C7.221 1.66 9.946 1.05 12.604 1.34m4.73 1.18c2.934 1.536 5.161 4.103 6.136 7.218m-17.742 2.378c-1.353-.173-2.617-.798-3.6-1.777m.434-6.4C4.306 2.394 6.619 1.488 9 1.4m11.166 2.052A12.03 12.03 0 0019 14.25v2.25M6.16 8.784a9.014 9.014 0 016.326-2.5 9.022 9.022 0 016.353 2.502m-11.411 7.32a6.002 6.002 0 012.046-5.835 6.007 6.007 0 016.368-1.25M4.825 13.91a8.97 8.97 0 011.025-2.66m9.67 6.37v-2.128c0-1.23-.393-2.427-1.11-3.398m-3.235 6.611c-1.29-.076-2.527-.514-3.51-1.255m7.456-1.637A8.995 8.995 0 0121 17.25M12 9c1.657 0 3 1.343 3 3v2.25M9.824 16.592c.621-.63 1.455-1.024 2.38-1.14M9 13v-1.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5v2.25M3.906 17.51A9.006 9.006 0 013 14.25',
    spinner: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
    send: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
};

const ShareImageGenerator: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedAyah, showShareImageModal } = state;

    const [selectedTheme, setSelectedTheme] = useState(0); // cream by default
    const [showSurahName, setShowSurahName] = useState(true);
    const [showBismillah, setShowBismillah] = useState(false);
    const [showWatermark, setShowWatermark] = useState(true);
    const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');

    const previewRef = useRef<HTMLDivElement>(null);
    const [previewHeight, setPreviewHeight] = useState<number>(0);
    const [isSharing, setIsSharing] = useState(false);

    const isVisible = showShareImageModal && !!selectedAyah;
    const [isRendered, setIsRendered] = useState(isVisible);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
            setActiveTab('image');
        }
    }, [isVisible]);

    useEffect(() => {
        const updateScale = () => {
            // Calculate scale based on screen width assuming max 500px modal minus padding
            const containerWidth = Math.min(window.innerWidth - 40, 500);
            setScale(containerWidth / 1400); // Now 1400px wide for broader aesthetic
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    useEffect(() => {
        if (!isVisible || !previewRef.current) return;

        const updateHeight = () => {
            if (previewRef.current) {
                // Ensure we capture the height even if it's technically 0 from rapid re-renders
                const currentHeight = previewRef.current.offsetHeight;
                if (currentHeight > 0) {
                    setPreviewHeight(currentHeight);
                }
            }
        };

        const observer = new ResizeObserver(updateHeight);
        observer.observe(previewRef.current);

        // Initial checks to ensure it measures the layout precisely
        requestAnimationFrame(updateHeight);
        setTimeout(updateHeight, 50);
        setTimeout(updateHeight, 200);

        return () => observer.disconnect();
    }, [isVisible, showBismillah, showSurahName, showWatermark, selectedAyah, activeTab, scale]);

    useEffect(() => {
        const styleId = 'share-image-font-style';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;

        if (isVisible && selectedAyah) {
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            const pageNumber = selectedAyah.page_number;
            styleEl.innerHTML = `
                @font-face {
                    font-family: 'quran-font-p${pageNumber}';
                    src: url('/QPC V2 Font/p${pageNumber}.ttf') format('truetype');
                    font-display: block;
                }
            `;
        }

        return () => {
            if (styleEl) styleEl.innerHTML = '';
        };
    }, [isVisible, selectedAyah]);

    const handleAnimationEnd = () => {
        if (!isVisible) setIsRendered(false);
    };

    const closeModal = () => {
        actions.setState(s => ({ ...s, showShareImageModal: false, selectedAyah: null }));
    };

    const surah = selectedAyah ? state.surahs.find(s => s.id === selectedAyah.chapter_id) : null;
    const theme = THEMES[selectedTheme];

    // Get verse text in QPC font
    let ayahText = selectedAyah?.text_uthmani;
    const qpcFontFamily = selectedAyah ? `'quran-font-p${selectedAyah.page_number}'` : '';

    if (state.font === 'qpc-v1' && selectedAyah && state.wordGlyphData) {
        const verseKeyPrefix = `${selectedAyah.chapter_id}:${selectedAyah.verse_number}:`;
        ayahText = Object.entries(state.wordGlyphData)
            .filter(([key]) => key.startsWith(verseKeyPrefix))
            .map(([key, wordInfo]) => ({ ...wordInfo, wordNum: parseInt(key.split(':')[2], 10) }))
            .sort((a, b) => a.wordNum - b.wordNum)
            .map(wordInfo => (wordInfo as any).text)
            .join('');
    }

    // Precision typography auto-sizing based on length (Canvas is 1400px wide now)
    const getAutoFontSize = () => {
        if (!ayahText) return 40;
        const len = ayahText.length;
        if (len < 30) return 110;
        if (len < 70) return 84;
        if (len < 120) return 70;
        if (len < 200) return 58;
        if (len < 300) return 50;
        return 44;
    };

    const fontSize = getAutoFontSize();

    const handleShare = async () => {
        if (activeTab === 'text') {
            if (!selectedAyah || !surah) return;
            const text = `${selectedAyah.text_uthmani}\n\n﴿ سورة ${surah.name_arabic} : ${selectedAyah.verse_number} ﴾`;
            if (navigator.share) {
                await navigator.share({ title: 'آية من القرآن الكريم', text });
            } else {
                navigator.clipboard.writeText(text);
                showToast('تم نسخ الآية', 'success');
            }
            closeModal();
            return;
        }

        if (!previewRef.current) return;
        setIsSharing(true);
        try {
            // Ultra-premium rendering parameters
            const canvas = await html2canvas(previewRef.current, {
                useCORS: true,
                backgroundColor: theme.bg,
                scale: 1.5, // 1.5x on 1000px = 1500px width for pristine print-like quality
                logging: false,
                textRendering: "geometricPrecision",
                onclone: (clonedDoc: Document) => {
                    const wrapper = clonedDoc.getElementById('share-wrapper');
                    if (wrapper) {
                        wrapper.style.transform = 'none';
                    }
                }
            });

            canvas.toBlob(async (blob: Blob | null) => {
                if (blob && navigator.share) {
                    const file = new File([blob], 'quran_ayah_premium.png', { type: 'image/png' });
                    try {
                        await navigator.share({ files: [file], title: 'آية من القرآن الكريم' });
                        closeModal();
                    } catch (err) {
                        console.error('Share failed:', err);
                    }
                } else if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'quran_ayah_premium.png';
                    a.click();
                    URL.revokeObjectURL(url);
                }
                setIsSharing(false);
            }, 'image/png', 1.0);
        } catch (err) {
            console.error('Error generating image:', err);
            setIsSharing(false);
        }
    };

    if (!isRendered) return null;

    return (
        <div className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}`} onClick={closeModal}>
            <div
                className={`bg-bg-primary rounded-t-3xl w-full max-w-lg mx-auto mt-auto max-h-[95vh] flex flex-col shadow-2xl ${isVisible ? 'animate-slideInUp' : 'animate-slideOutDown'}`}
                onClick={e => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                {/* Header */}
                <div className="px-5 pt-5 pb-3 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-text-primary">مشاركة الآية</h3>
                        <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-bg-secondary rounded-full transition-colors active:scale-90">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.close} />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-bg-secondary rounded-xl p-1.5 gap-1.5 border border-border/50 shadow-sm">
                        <button
                            onClick={() => setActiveTab('image')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'image' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.image} />
                            </svg>
                            مشاركة كصورة
                        </button>
                        <button
                            onClick={() => setActiveTab('text')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'text' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.copy} />
                            </svg>
                            كنص فقط
                        </button>
                    </div>
                </div>

                {activeTab === 'text' ? (
                    /* Text Tab */
                    <div className="flex-1 p-5 overflow-y-auto">
                        <div className="bg-bg-secondary rounded-2xl p-6 border border-border/50 shadow-inner">
                            <p className="font-arabic text-2xl text-center leading-loose" style={{ fontFamily: qpcFontFamily, wordWrap: 'break-word', overflowWrap: 'break-word', width: '100%' }}>
                                {ayahText}
                            </p>
                            <div className="flex items-center justify-center mt-6 pt-4 border-t border-border/50">
                                <p className="text-center text-sm font-bold text-text-secondary">
                                    ﴿ سورة {surah?.name_arabic} : {selectedAyah ? new Intl.NumberFormat('ar-EG').format(selectedAyah.verse_number) : ''} ﴾
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Image Tab */
                    <div className="flex-1 overflow-y-auto custom-scrollbar">

                        <div className="py-4 w-full flex justify-center items-start">
                            {/* 
                                Using Absolute Positioning combined with a dynamically calculated Relative container
                                is the ONLY bulletproof method that survives `html2canvas` while also eliminating
                                scroll gap phantom heights across Safari/Chrome on mobile.
                            */}
                            <div
                                style={{
                                    position: 'relative',
                                    width: `${1400 * scale}px`,
                                    height: previewHeight ? `${previewHeight * scale}px` : `${800 * scale}px`, // default height fallback
                                    minHeight: `${400 * scale}px`,
                                    // DO NOT use overflow:hidden here. It triggers a WebKit bug that hides the absolute child on initial paint.
                                }}
                            >
                                <div
                                    id="share-wrapper"
                                    dir="ltr" // anchor origin calculations unconditionally
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '1400px',
                                        transform: `scale(${scale}) translateZ(0)`, // Force hardware accel to prevent "invisibile on first render" WebKit bug
                                        transformOrigin: 'top left', // Safer origin for LTR/RTL mix when absolute
                                        willChange: 'transform'
                                    }}
                                >
                                    {/* The actual element that will be captured */}
                                    <div
                                        ref={previewRef}
                                        dir="rtl"
                                        style={{
                                            backgroundColor: theme.bg,
                                            backgroundImage: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.03) 150%)`,
                                            width: '1400px',
                                            position: 'relative',
                                            padding: '120px 80px',
                                            boxSizing: 'border-box',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {/* Pure CSS Geometric Frames */}
                                        <div style={{
                                            position: 'absolute',
                                            inset: '20px',
                                            border: `2px solid ${theme.accent}`,
                                            opacity: 1,
                                            zIndex: 10,
                                            pointerEvents: 'none'
                                        }}></div>
                                        <div style={{
                                            position: 'absolute',
                                            inset: '30px',
                                            border: `1px solid ${theme.accent}`,
                                            opacity: 0.4,
                                            zIndex: 10,
                                            pointerEvents: 'none'
                                        }}></div>

                                        {/* Content Z-Index wrapper to stay above borders */}
                                        <div style={{ position: 'relative', zIndex: 30, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                                            {/* Elegent Surah Name Header (Original SVG) */}
                                            {showSurahName && surah && (
                                                <div style={{ position: 'relative', width: '1240px', height: '175px', margin: '0 auto 40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <img
                                                        src="/surah_hedar.svg"
                                                        alt="Surah Header"
                                                        style={{
                                                            width: '1240px',  /* Fills the whole space bounded by margins, keeping ~7.1 aspect ratio */
                                                            height: '150px',
                                                            opacity: theme.id === 'cream' ? 0.85 : 0.9,
                                                            filter: theme.id !== 'cream' ? 'invert(1) opacity(0.8)' : 'none'
                                                        }}
                                                    />
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{
                                                            fontFamily: "'Amiri', 'Rubik', sans-serif",
                                                            fontSize: '56px',
                                                            fontWeight: 700,
                                                            color: theme.id !== 'cream' ? '#fff' : '#000',
                                                            margin: 0,
                                                            lineHeight: 1,
                                                            paddingBottom: '12px'
                                                        }}>
                                                            سورة {surah.name_arabic}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Quranic Bismillah */}
                                            {showBismillah && (
                                                <h2 style={{
                                                    textAlign: 'center',
                                                    color: theme.text,
                                                    fontFamily: "'quran-common', 'Amiri', serif",
                                                    fontSize: '100px',
                                                    fontWeight: 400,
                                                    marginBottom: '60px',
                                                    marginTop: 0
                                                }}>
                                                    ﷽
                                                </h2>
                                            )}

                                            {/* The Majestic Verse Text */}
                                            <p style={{
                                                fontFamily: qpcFontFamily,
                                                fontSize: `${fontSize}px`,
                                                lineHeight: 2.3,
                                                textAlign: 'center',
                                                wordWrap: 'break-word',
                                                overflowWrap: 'break-word',
                                                width: '100%',
                                                margin: '20px 0 35px 0',
                                                color: theme.text,
                                                textShadow: theme.id === 'cream' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)'
                                            }}>
                                                {ayahText}
                                            </p>

                                            {/* Refined Footer Separator & References */}
                                            <div style={{
                                                marginTop: '40px',
                                                marginBottom: '10px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '16px'
                                            }}>
                                                {/* Diamond Separator */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
                                                    <div style={{ width: '60px', height: '1px', backgroundColor: theme.accent }}></div>
                                                    <div style={{ width: '6px', height: '6px', transform: 'rotate(45deg)', backgroundColor: theme.accent }}></div>
                                                    <div style={{ width: '60px', height: '1px', backgroundColor: theme.accent }}></div>
                                                </div>

                                                <p style={{
                                                    fontFamily: "'Amiri', serif",
                                                    fontSize: '48px',
                                                    color: theme.text,
                                                    opacity: 0.9,
                                                    margin: 0
                                                }}>
                                                    ﴿ {surah?.name_arabic} : {selectedAyah ? new Intl.NumberFormat('ar-EG').format(selectedAyah.verse_number) : ''} ﴾
                                                </p>

                                                {showWatermark && (
                                                    <p style={{
                                                        fontFamily: "'Amiri', serif",
                                                        fontSize: '32px',
                                                        color: theme.text,
                                                        opacity: 0.35,
                                                        margin: '18px 0 0 0'
                                                    }}>
                                                        بواسطة تطبيق بصائر
                                                    </p>
                                                )}
                                                {/* Watermark Logo Area */}
                                                {showWatermark && (
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        marginTop: '30px',
                                                        opacity: 0.8
                                                    }}>
                                                        <svg style={{ width: '42px', height: '42px', color: theme.accent, marginBottom: '16px' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.fingerprint} />
                                                        </svg>
                                                        <span style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif", fontSize: '24px', fontWeight: 600, letterSpacing: '4px', color: theme.text, opacity: 0.7 }}>BASAER APP</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Royal Options Panel */}
                        <div className="px-5 pb-6 space-y-5 shrink-0 mt-4">
                            {/* Color Palettes */}
                            <div>
                                <label className="text-xs font-bold text-text-secondary mb-3 block uppercase tracking-wider">الثيمات والألوان</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {THEMES.map((t, i) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTheme(i)}
                                            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all border-2 ${selectedTheme === i ? 'border-primary shadow-md' : 'border-border/50 hover:bg-bg-secondary'}`}
                                        >
                                            <span className="text-sm font-bold text-text-primary">{t.label}</span>
                                            <div className="flex shadow-sm rounded-full overflow-hidden border border-black/10">
                                                <div style={{ width: '16px', height: '24px', backgroundColor: t.bg }}></div>
                                                <div style={{ width: '10px', height: '24px', backgroundColor: t.accent }}></div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Presentation Toggles */}
                            <div>
                                <label className="text-xs font-bold text-text-secondary mb-3 block uppercase tracking-wider">عناصر اللوحة</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowSurahName(!showSurahName)}
                                        className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all border border-transparent ${showSurahName ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'}`}
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.text} />
                                        </svg>
                                        <span className="text-xs font-bold">اسم السورة</span>
                                    </button>
                                    <button
                                        onClick={() => setShowBismillah(!showBismillah)}
                                        className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all border border-transparent ${showBismillah ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'}`}
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.moon} />
                                        </svg>
                                        <span className="text-xs font-bold">البسملة</span>
                                    </button>
                                    <button
                                        onClick={() => setShowWatermark(!showWatermark)}
                                        className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all border border-transparent ${showWatermark ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'}`}
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.fingerprint} />
                                        </svg>
                                        <span className="text-xs font-bold">العلامة</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mighty Share Action */}
                <div className="p-5 shrink-0 bg-bg-secondary/50 border-t border-border mt-2">
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98] text-base"
                    >
                        {isSharing ? (
                            <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 24 24"><path d={SVG.spinner} /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.send} />
                            </svg>
                        )}
                        {isSharing ? 'جاري رسم وإعداد اللوحة الفاخرة...' : 'إرسال اللوحة القرآنية'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareImageGenerator;