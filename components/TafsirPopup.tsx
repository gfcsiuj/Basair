import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp';

const TafsirPopup: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedAyah, showTafsir, tafsirs, translations } = state;

    const isVisible = showTafsir && !!selectedAyah;
    const [isRendered, setIsRendered] = useState(isVisible);

    // Swipe to dismiss state
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);

    const closeModal = () => {
        actions.setState(s => ({ ...s, showTafsir: false, selectedAyah: null }));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        let deltaY = currentY - touchStartY.current;
        if (deltaY < 0) deltaY = 0;
        setTranslateY(deltaY);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (translateY > 80) {
            closeModal();
        } else {
            setTranslateY(0);
        }
    };

    const style: React.CSSProperties = {
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    };

    // Font style for Quranic text
    useEffect(() => {
        const styleId = 'tafsir-popup-font-style';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;

        if (isVisible && selectedAyah && state.font === 'qpc-v1') {
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
    }, [isVisible, selectedAyah, state.font]);

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
            setTranslateY(0);
        }
    }, [isVisible]);

    const handleAnimationEnd = () => {
        if (!isVisible) {
            setIsRendered(false);
        }
    };

    if (!isRendered) return null;

    const tafsirName = tafsirs.find(t => t.id === state.selectedTafsirId)?.name || 'التفسير';
    const translationName = translations.find(t => t.id === state.selectedTranslationId)?.author_name || 'الترجمة';

    const tafsirText = selectedAyah?.tafsirs?.[0]?.text.replace(/<[^>]*>/g, '') || 'التفسير غير متوفر.';
    const translationText = selectedAyah?.translations?.[0]?.text || 'الترجمة غير متوفرة.';

    const surah = state.surahs.find(s => s.id === selectedAyah?.chapter_id);

    // Get Quranic font text
    let ayahFontStyle: React.CSSProperties = {};
    let ayahDisplayText = selectedAyah?.text_uthmani;

    if (state.font === 'qpc-v1' && selectedAyah && state.wordGlyphData) {
        ayahFontStyle.fontFamily = `'quran-font-p${selectedAyah.page_number}'`;
        const verseKeyPrefix = `${selectedAyah.chapter_id}:${selectedAyah.verse_number}:`;
        ayahDisplayText = Object.entries(state.wordGlyphData)
            .filter(([key]) => key.startsWith(verseKeyPrefix))
            .map(([key, wordInfo]) => ({ ...wordInfo, wordNum: parseInt(key.split(':')[2], 10) }))
            .sort((a, b) => a.wordNum - b.wordNum)
            .map(wordInfo => (wordInfo as any).text)
            .join('');
    }

    return (
        <div className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}`} onClick={closeModal}>
            <div
                className={`bg-bg-primary rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl touch-none ${isVisible ? 'animate-scaleIn' : 'animate-scaleOut'}`}
                onClick={e => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
                style={style}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header */}
                <header className="flex items-center justify-between p-4 bg-gradient-to-l from-primary to-primary-light text-white rounded-t-2xl shrink-0">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <i className="fas fa-book-open"></i>
                        التفسير والترجمة
                    </h3>
                    <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </header>

                {/* Scrollable content */}
                <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
                    {/* Verse Card */}
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 border border-primary/15">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <span className="text-xs px-3 py-1 bg-primary/15 text-primary rounded-full font-bold">
                                سورة {surah?.name_arabic}
                            </span>
                            <span className="text-xs px-2 py-1 bg-bg-tertiary text-text-secondary rounded-full">
                                الآية {selectedAyah?.verse_number}
                            </span>
                        </div>
                        <p className="font-arabic text-xl text-center leading-loose" style={{ ...ayahFontStyle, wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', display: 'block', width: '100%' }}>
                            {ayahDisplayText}
                        </p>
                    </div>

                    {/* Tafsir Section */}
                    <div className="bg-bg-secondary rounded-2xl p-4 border border-border/50">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <i className="fas fa-feather-alt text-primary text-sm"></i>
                            </div>
                            <h4 className="font-bold text-primary text-sm">{tafsirName}</h4>
                        </div>
                        <p className="text-text-primary leading-relaxed text-sm">{tafsirText}</p>
                    </div>

                    {/* Translation Section */}
                    <div className="bg-bg-secondary rounded-2xl p-4 border border-border/50">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                                <i className="fas fa-language text-blue-500 text-sm"></i>
                            </div>
                            <h4 className="font-bold text-blue-500 text-sm">الترجمة ({translationName})</h4>
                        </div>
                        <p className="text-text-primary leading-relaxed text-left text-sm" dir="ltr">{translationText}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TafsirPopup;