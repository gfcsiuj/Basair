import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../hooks/useApp';

declare const html2canvas: any;

// Premium Color Palettes for the Share Card
const THEMES = [
    { id: 'cream', label: 'كلاسيكي', bg: '#FDFBF7', text: '#1A1A1A', accent: '#B89047', border: '#E8DCC4' },
    { id: 'onyx', label: 'أسود ملوكي', bg: '#101010', text: '#F4F4F4', accent: '#D4AF37', border: '#333333' },
    { id: 'emerald', label: 'زمردي', bg: '#0D3625', text: '#F5F7F2', accent: '#E3C174', border: '#1C5C42' },
    { id: 'navy', label: 'كحلي', bg: '#0B172A', text: '#F0F4F8', accent: '#C5A059', border: '#1E3250' },
];

// Removed CornerDecoration to keep pure geometric design.

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
                alert('تم نسخ الآية');
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
                        <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-bg-secondary rounded-full transition-colors">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-bg-secondary rounded-xl p-1.5 gap-1.5">
                        <button
                            onClick={() => setActiveTab('image')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'image' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                        >
                            <i className="fas fa-image"></i>
                            مشاركة كصورة
                        </button>
                        <button
                            onClick={() => setActiveTab('text')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'text' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                        >
                            <i className="fas fa-copy"></i>
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
                                                        <i className="fas fa-fingerprint" style={{ fontSize: '42px', color: theme.accent, marginBottom: '16px' }}></i>
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
                                        className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all ${showSurahName ? 'bg-primary text-white shadow-md' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'}`}
                                    >
                                        <i className="fas fa-heading text-lg"></i>
                                        <span className="text-xs font-bold">اسم السورة</span>
                                    </button>
                                    <button
                                        onClick={() => setShowBismillah(!showBismillah)}
                                        className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all ${showBismillah ? 'bg-primary text-white shadow-md' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'}`}
                                    >
                                        <i className="fas fa-star-and-crescent text-lg"></i>
                                        <span className="text-xs font-bold">البسملة</span>
                                    </button>
                                    <button
                                        onClick={() => setShowWatermark(!showWatermark)}
                                        className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all ${showWatermark ? 'bg-primary text-white shadow-md' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'}`}
                                    >
                                        <i className="fas fa-fingerprint text-lg"></i>
                                        <span className="text-xs font-bold">العلامة</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mighty Share Action */}
                <div className="p-5 shrink-0 bg-bg-secondary/50 border-t border-border">
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="w-full bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-50 shadow-xl active:scale-[0.98] text-lg"
                        style={{ boxShadow: '0 8px 24px rgba(var(--highlight-color), 0.25)' }}
                    >
                        {isSharing ? <i className="fas fa-circle-notch fa-spin text-xl"></i> : <i className="fas fa-paper-plane text-xl"></i>}
                        {isSharing ? 'جاري رسم وإعداد اللوحة الفاخرة...' : 'إرسال اللوحة القرآنية'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareImageGenerator;