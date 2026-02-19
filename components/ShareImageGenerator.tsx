import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { Font } from '../types';
import { OrnamentalDivider } from './SvgDecorations';

declare const html2canvas: any;

// Aspect ratio options
const ASPECT_RATIOS = [
    { label: '1:1', width: 400, height: 400 },
    { label: '4:5', width: 400, height: 500 },
    { label: '9:16', width: 360, height: 640 },
];

const ShareImageGenerator: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedAyah, showShareImageModal } = state;

    const [config, setConfig] = useState({
        fontSize: 36,
        fontFamily: state.font,
        textColor: '#FFFFFF',
        bgColor: '#059669',
        bgImage: '',
        showInfo: true,
        showBismillah: true,
        showSurahName: true,
        showDecoration: true,
        showTranslation: false,
        padding: 32,
        aspectRatio: 0, // index into ASPECT_RATIOS
    });
    const previewRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const isVisible = showShareImageModal && !!selectedAyah;
    const [isRendered, setIsRendered] = useState(isVisible);

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
            setConfig(c => ({ ...c, fontFamily: state.font }));
            // Auto-adjust font size based on verse length
            if (selectedAyah?.text_uthmani) {
                const len = selectedAyah.text_uthmani.length;
                if (len < 30) setConfig(c => ({ ...c, fontSize: 42 }));
                else if (len < 80) setConfig(c => ({ ...c, fontSize: 34 }));
                else if (len < 150) setConfig(c => ({ ...c, fontSize: 28 }));
                else setConfig(c => ({ ...c, fontSize: 22 }));
            }
        }
    }, [isVisible, state.font, selectedAyah]);

    useEffect(() => {
        const styleId = 'share-image-font-style';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;

        if (isVisible && selectedAyah && config.fontFamily === 'qpc-v1') {
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
    }, [isVisible, selectedAyah, config.fontFamily]);

    const handleAnimationEnd = () => {
        if (!isVisible) setIsRendered(false);
    };

    const closeModal = () => {
        actions.setState(s => ({ ...s, showShareImageModal: false, selectedAyah: null }));
    };

    const handleShare = async () => {
        if (!previewRef.current) return;
        setIsSharing(true);
        try {
            const canvas = await html2canvas(previewRef.current, {
                useCORS: true,
                backgroundColor: null,
                scale: 3,
            });
            canvas.toBlob(async (blob: Blob | null) => {
                if (blob && navigator.share) {
                    const file = new File([blob], 'quran_ayah.png', { type: 'image/png' });
                    try {
                        await navigator.share({ files: [file], title: 'آية من القرآن الكريم' });
                        closeModal();
                    } catch (err) {
                        console.error('Share failed:', err);
                    }
                } else if (blob) {
                    // Fallback: download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'quran_ayah.png';
                    a.click();
                    URL.revokeObjectURL(url);
                }
                setIsSharing(false);
            }, 'image/png');
        } catch (err) {
            console.error('Error generating image:', err);
            setIsSharing(false);
        }
    };

    const surah = selectedAyah ? state.surahs.find(s => s.id === selectedAyah.chapter_id) : null;

    const backgrounds = [
        { type: 'gradient', value: 'linear-gradient(135deg, #059669, #34d399)', label: 'أخضر' },
        { type: 'gradient', value: 'linear-gradient(135deg, #111827, #374151)', label: 'فحمي' },
        { type: 'gradient', value: 'linear-gradient(135deg, #1e3a5f, #2563eb)', label: 'أزرق' },
        { type: 'gradient', value: 'linear-gradient(135deg, #5b21b6, #a78bfa)', label: 'بنفسجي' },
        { type: 'gradient', value: 'linear-gradient(135deg, #92400e, #b45309)', label: 'بني' },
        { type: 'gradient', value: 'linear-gradient(135deg, #831843, #db2777)', label: 'وردي' },
        { type: 'gradient', value: 'linear-gradient(135deg, #0f766e, #14b8a6)', label: 'تركواز' },
        { type: 'gradient', value: 'linear-gradient(to bottom, #0f172a, #1e293b, #0f172a)', label: 'ليلي' },
        { type: 'color', value: '#000000', label: 'أسود' },
        { type: 'color', value: '#ffffff', label: 'أبيض' },
    ];

    const { width: canvasW, height: canvasH } = ASPECT_RATIOS[config.aspectRatio];

    const dynamicStyle: React.CSSProperties = {
        width: canvasW,
        height: canvasH,
        backgroundColor: config.bgImage ? 'transparent' : (backgrounds.find(b => b.value === config.bgColor && b.type === 'color')?.value || 'transparent'),
        backgroundImage: config.bgImage ? `url(${config.bgImage})` : (backgrounds.find(b => b.value === config.bgColor)?.type !== 'color' ? config.bgColor : 'none'),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: config.textColor,
        lineHeight: 1.9,
        padding: config.padding,
    };

    let ayahText = selectedAyah?.text_uthmani;
    if (config.fontFamily === 'qpc-v1' && selectedAyah && state.wordGlyphData) {
        dynamicStyle.fontFamily = `'quran-font-p${selectedAyah.page_number}'`;
        const verseKeyPrefix = `${selectedAyah.chapter_id}:${selectedAyah.verse_number}:`;
        ayahText = Object.entries(state.wordGlyphData)
            .filter(([key]) => key.startsWith(verseKeyPrefix))
            .map(([key, wordInfo]) => ({ ...wordInfo, wordNum: parseInt(key.split(':')[2], 10) }))
            .sort((a, b) => a.wordNum - b.wordNum)
            .map(wordInfo => (wordInfo as any).text)
            .join('');
    }

    const isLightBg = config.bgColor === '#ffffff' || config.textColor === '#000000';

    if (!isRendered) return null;

    return (
        <div className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col p-3 ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}`} onClick={closeModal}>
            <div
                className={`bg-bg-primary rounded-2xl w-full max-w-lg m-auto max-h-[95vh] flex flex-col shadow-2xl ${isVisible ? 'animate-scaleIn' : 'animate-scaleOut'}`}
                onClick={e => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <i className="fas fa-image text-primary"></i>
                        مشاركة كصورة
                    </h3>
                    <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-bg-secondary rounded-full transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </header>

                {/* Preview Area */}
                <main className="flex-1 p-3 flex items-center justify-center bg-bg-secondary overflow-auto">
                    <div
                        ref={previewRef}
                        className="flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl rounded-lg"
                        style={{
                            ...dynamicStyle,
                            transform: `scale(${Math.min(1, (window.innerWidth - 48) / canvasW, (window.innerHeight * 0.4) / canvasH)})`,
                            transformOrigin: 'center center',
                        }}
                    >
                        {/* BG overlay for contrast */}
                        {config.bgImage && <div className="absolute inset-0 bg-black/40"></div>}

                        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-2">
                            {/* Top decoration */}
                            {config.showDecoration && (
                                <div className="w-full mb-3">
                                    <svg viewBox="0 0 200 12" className="w-2/3 mx-auto h-3" fill="none">
                                        <line x1="0" y1="6" x2="60" y2="6" stroke={config.textColor} strokeWidth="0.5" opacity="0.3" />
                                        <g transform="translate(100, 6)">
                                            <path d="M-8 0L0 -5L8 0L0 5Z" fill={config.textColor} opacity="0.2" />
                                            <circle r="1.5" fill={config.textColor} opacity="0.4" />
                                        </g>
                                        <line x1="140" y1="6" x2="200" y2="6" stroke={config.textColor} strokeWidth="0.5" opacity="0.3" />
                                    </svg>
                                </div>
                            )}

                            {/* Surah Name */}
                            {config.showSurahName && surah && (
                                <div
                                    className="mb-3 px-5 py-1.5 rounded-full"
                                    style={{
                                        background: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)',
                                        border: `1px solid ${isLightBg ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
                                    }}
                                >
                                    <span className="font-bold" style={{ fontSize: `${config.fontSize * 0.38}px`, fontFamily: 'Rubik, sans-serif' }}>
                                        سورة {surah.name_arabic}
                                    </span>
                                </div>
                            )}

                            {/* Bismillah */}
                            {config.showBismillah && (
                                <p className="mb-3 font-arabic" style={{ fontSize: `${config.fontSize * 0.45}px`, opacity: 0.75 }}>
                                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                </p>
                            )}

                            {/* Verse Text */}
                            <p className="leading-relaxed" style={{
                                fontSize: `${config.fontSize}px`,
                                wordSpacing: '0.1em',
                                ...(config.fontFamily === 'qpc-v1' ? { fontFamily: dynamicStyle.fontFamily } : {}),
                            }}>
                                {ayahText}
                            </p>

                            {/* Translation */}
                            {config.showTranslation && selectedAyah?.translations?.[0] && (
                                <p className="mt-3 font-sans text-center" style={{
                                    fontSize: `${config.fontSize * 0.35}px`,
                                    opacity: 0.7,
                                    lineHeight: 1.6,
                                }}>
                                    {selectedAyah.translations[0].text.replace(/<sup[^>]*>.*?<\/sup>/g, '')}
                                </p>
                            )}

                            {/* Verse Reference */}
                            {config.showInfo && (
                                <div className="mt-4 flex items-center gap-2" style={{ fontSize: `${config.fontSize * 0.35}px`, opacity: 0.6 }}>
                                    <span>﴿ {surah?.name_arabic} : {selectedAyah ? new Intl.NumberFormat('ar-EG').format(selectedAyah.verse_number) : ''} ﴾</span>
                                </div>
                            )}

                            {/* Bottom decoration */}
                            {config.showDecoration && (
                                <div className="w-full mt-3">
                                    <svg viewBox="0 0 200 12" className="w-2/3 mx-auto h-3" fill="none">
                                        <line x1="0" y1="6" x2="60" y2="6" stroke={config.textColor} strokeWidth="0.5" opacity="0.3" />
                                        <g transform="translate(100, 6)">
                                            <path d="M-8 0L0 -5L8 0L0 5Z" fill={config.textColor} opacity="0.2" />
                                            <circle r="1.5" fill={config.textColor} opacity="0.4" />
                                        </g>
                                        <line x1="140" y1="6" x2="200" y2="6" stroke={config.textColor} strokeWidth="0.5" opacity="0.3" />
                                    </svg>
                                </div>
                            )}

                            {/* Watermark */}
                            <span className="absolute bottom-2 left-3 font-bold" style={{ fontSize: '9px', opacity: 0.25, fontFamily: 'Rubik, sans-serif' }}>بصائر</span>
                        </div>
                    </div>
                </main>

                {/* Options Panel */}
                <footer className="p-3 space-y-3 shrink-0 border-t border-border overflow-y-auto custom-scrollbar max-h-64">
                    {/* Backgrounds */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-text-secondary w-14 shrink-0">الخلفية</label>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {backgrounds.map(bg => (
                                <button
                                    key={bg.value}
                                    onClick={() => setConfig(c => ({ ...c, bgColor: bg.value, bgImage: '' }))}
                                    className={`w-7 h-7 rounded-full border-2 shrink-0 transition-transform hover:scale-110 ${config.bgColor === bg.value && !config.bgImage ? 'border-primary scale-110' : 'border-transparent'}`}
                                    style={{ background: bg.value }}
                                    title={bg.label}
                                ></button>
                            ))}
                        </div>
                    </div>

                    {/* Text Color */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-text-secondary w-14 shrink-0">النص</label>
                        <div className="flex items-center gap-1.5">
                            {['#FFFFFF', '#000000', '#D4AF37', '#34D399', '#93C5FD'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setConfig(c => ({ ...c, textColor: color }))}
                                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${config.textColor === color ? 'border-primary scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color, boxShadow: color === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : 'none' }}
                                ></button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-text-secondary w-14 shrink-0">الحجم</label>
                        <input
                            type="range" min="16" max="56" value={config.fontSize}
                            onChange={(e) => setConfig(c => ({ ...c, fontSize: parseInt(e.target.value) }))}
                            className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <span className="text-xs text-text-tertiary w-6 text-center">{config.fontSize}</span>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-text-secondary w-14 shrink-0">الأبعاد</label>
                        <div className="flex items-center gap-1.5">
                            {ASPECT_RATIOS.map((ar, i) => (
                                <button
                                    key={ar.label}
                                    onClick={() => setConfig(c => ({ ...c, aspectRatio: i }))}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${config.aspectRatio === i ? 'bg-primary text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'}`}
                                >
                                    {ar.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'showSurahName', label: 'اسم السورة', icon: 'fa-bookmark' },
                            { key: 'showBismillah', label: 'البسملة', icon: 'fa-star' },
                            { key: 'showInfo', label: 'المرجع', icon: 'fa-info-circle' },
                            { key: 'showDecoration', label: 'الزخارف', icon: 'fa-paint-brush' },
                            { key: 'showTranslation', label: 'الترجمة', icon: 'fa-language' },
                        ].map(toggle => (
                            <button
                                key={toggle.key}
                                onClick={() => setConfig(c => ({ ...c, [toggle.key]: !(c as any)[toggle.key] }))}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${(config as any)[toggle.key] ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-bg-secondary text-text-tertiary'}`}
                            >
                                <i className={`fas ${toggle.icon} text-[10px]`}></i>
                                {toggle.label}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="flex-1 bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
                            style={{ boxShadow: '0 4px 14px rgba(var(--highlight-color), 0.3)' }}
                        >
                            {isSharing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-share-alt"></i>}
                            {isSharing ? 'جاري التجهيز...' : 'مشاركة'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ShareImageGenerator;