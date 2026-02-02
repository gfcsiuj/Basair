import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { Font } from '../types';

declare const html2canvas: any;

const ShareImageGenerator: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedAyah, showShareImageModal } = state;

    const [config, setConfig] = useState({
        fontSize: 40,
        fontFamily: state.font,
        textColor: '#FFFFFF',
        bgColor: '#059669',
        bgImage: '',
        showInfo: true,
        padding: 32,
    });
    const previewRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const isVisible = showShareImageModal && !!selectedAyah;
    const [isRendered, setIsRendered] = useState(isVisible);

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
            setConfig(c => ({ ...c, fontFamily: state.font })); // Sync font on open
        }
    }, [isVisible, state.font]);
    
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
            if (styleEl) {
                styleEl.innerHTML = '';
            }
        };
    }, [isVisible, selectedAyah, config.fontFamily]);


    const handleAnimationEnd = () => {
        if (!isVisible) {
            setIsRendered(false);
        }
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
                scale: 2, 
            });
            canvas.toBlob(async (blob: Blob | null) => {
                if (blob && navigator.share) {
                    const file = new File([blob], 'quran_ayah.png', { type: 'image/png' });
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'آية من القرآن الكريم',
                        });
                        closeModal();
                    } catch (err) {
                        console.error('Share failed:', err);
                    }
                } else {
                    alert('المشاركة غير مدعومة على هذا المتصفح، يمكنك أخذ لقطة شاشة.');
                }
                setIsSharing(false);
            }, 'image/png');
        } catch (err) {
            console.error('Error generating image:', err);
            setIsSharing(false);
        }
    };
    
    const surah = selectedAyah ? state.surahs.find(s => s.id === selectedAyah.chapter_id) : null;
    
    const textColors = ['#FFFFFF', '#000000', '#FBBF24', '#34D399', '#3B82F6'];
    const backgrounds = [
        { type: 'color', value: '#059669' },
        { type: 'color', value: '#111827' },
        { type: 'color', value: '#78350f' },
        { type: 'image', value: 'https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600' },
        { type: 'image', value: 'https://images.unsplash.com/photo-1609597413125-97e35b715104?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600' },
        { type: 'gradient', value: 'linear-gradient(to top right, #059669, #34d399)' },
        { type: 'gradient', value: 'linear-gradient(to top right, #5b21b6, #a78bfa)' },
    ];
    
    const dynamicStyle: React.CSSProperties = {
        backgroundColor: config.bgImage ? 'transparent' : config.bgColor,
        backgroundImage: config.bgImage ? `url(${config.bgImage})` : (backgrounds.find(b => b.value === config.bgColor && b.type === 'gradient')?.value),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: config.textColor,
        fontSize: `${config.fontSize}px`,
        lineHeight: 1.8,
        padding: `${config.padding}px`
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


    if (!isRendered) return null;

    return (
        <div className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col p-4 ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}`} onClick={closeModal}>
            <div 
                className={`bg-bg-primary rounded-xl w-full max-w-2xl m-auto max-h-full flex flex-col shadow-xl ${isVisible ? 'animate-scaleIn' : 'animate-scaleOut'}`} 
                onClick={e => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                <header className="flex items-center justify-between p-3 border-b border-border shrink-0">
                    <h3 className="text-lg font-bold text-text-primary">مشاركة كصورة</h3>
                    <button onClick={closeModal} className="p-2 text-text-secondary hover:bg-bg-secondary rounded-full">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </header>

                <main className="flex-1 p-4 flex items-center justify-center bg-bg-secondary overflow-hidden">
                    <div
                        ref={previewRef}
                        className={`w-[400px] h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg`}
                        style={dynamicStyle}
                    >
                         {config.bgImage && <div className="absolute inset-0 bg-black/30"></div>}
                        <div className="relative z-10">
                            <p>{ayahText}</p>
                            {config.showInfo && (
                                 <p className="font-ui mt-4 opacity-80" style={{ fontSize: `${config.fontSize * 0.4}px` }}>
                                    {`{${surah?.name_arabic}: ${selectedAyah?.verse_number}}`}
                                </p>
                            )}
                        </div>
                    </div>
                </main>

                <footer className="p-4 space-y-4 shrink-0 border-t border-border overflow-y-auto custom-scrollbar max-h-60">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium w-20">الخلفية</label>
                        <div className="flex items-center gap-2">
                            {backgrounds.map(bg => (
                                <button key={bg.value} onClick={() => setConfig(c => ({...c, bgColor: bg.type !== 'image' ? bg.value : c.bgColor, bgImage: bg.type === 'image' ? bg.value : ''}))} 
                                className={`w-8 h-8 rounded-full border-2 overflow-hidden flex-shrink-0
                                    ${(config.bgImage === bg.value || (config.bgColor === bg.value && !config.bgImage)) ? 'border-primary' : 'border-transparent'}`} 
                                style={{
                                    background: bg.type === 'image' ? `url(${bg.value})` : bg.value,
                                    backgroundSize: 'cover'
                                }}></button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium w-20">لون النص</label>
                        <div className="flex items-center gap-2">
                            {textColors.map(color => <button key={color} onClick={() => setConfig(c => ({...c, textColor: color}))} className={`w-8 h-8 rounded-full border-2 ${config.textColor === color ? 'border-primary' : 'border-transparent'}`} style={{backgroundColor: color}}></button>)}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium w-20">حجم الخط</label>
                        <input type="range" min="24" max="72" value={config.fontSize} onChange={(e) => setConfig(c => ({...c, fontSize: parseInt(e.target.value)}))} className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>

                    <button onClick={handleShare} disabled={isSharing} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:bg-primary/50">
                        {isSharing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-share-alt"></i>}
                        {isSharing ? 'جاري التجهيز...' : 'مشاركة الصورة'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ShareImageGenerator;