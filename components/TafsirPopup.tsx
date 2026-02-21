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
        if (deltaY < 0) deltaY = 0; // Prevent dragging up
        setTranslateY(deltaY);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (translateY > 80) { // Threshold
            closeModal();
        } else {
            setTranslateY(0);
        }
    };

    const style: React.CSSProperties = {
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    };


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

    const askAItoCompare = () => {
        if (!selectedAyah) return;
        const surah = state.surahs.find(s => s.id === selectedAyah.chapter_id);
        const tafsirName = tafsirs.find(t => t.id === state.selectedTafsirId)?.name || 'التفسير المحدد';
        const query = `قارن بين ${tafsirName} وتفسير ابن كثير والطبري لهذه الآية: "${selectedAyah.text_uthmani}" (سورة ${surah?.name_arabic}، الآية ${selectedAyah.verse_number})`;

        actions.setState(s => ({
            ...s,
            isAIAssistantOpen: true,
            aiAutoPrompt: query,
        }));
        closeModal();
    };


    if (!isRendered) return null;

    const tafsirName = tafsirs.find(t => t.id === state.selectedTafsirId)?.name || 'التفسير';
    const translationName = translations.find(t => t.id === state.selectedTranslationId)?.author_name || 'الترجمة';

    const tafsirText = selectedAyah?.tafsirs?.[0]?.text.replace(/<[^>]*>/g, '') || 'التفسير غير متوفر.';
    const translationText = selectedAyah?.translations?.[0]?.text || 'الترجمة غير متوفرة.';

    return (
        <div className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}`} onClick={closeModal}>
            <div
                className={`bg-bg-primary rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl touch-none ${isVisible ? 'animate-scaleIn' : 'animate-scaleOut'}`}
                onClick={e => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
                style={style}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <header className="panel-header flex items-center justify-between p-4 bg-gradient-to-l from-primary to-primary-light text-white rounded-t-xl shrink-0">
                    <h3 className="text-lg font-bold">التفسير والترجمة</h3>
                    <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </header>
                <div className="p-4 overflow-y-auto custom-scrollbar">
                    <div className="mb-4">
                        <h4 className="font-bold mb-2 text-primary">الآية:</h4>
                        <p className="font-arabic text-xl bg-bg-secondary p-3 rounded-md">{selectedAyah?.text_uthmani}</p>
                    </div>
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-primary">{tafsirName}:</h4>
                            <button onClick={askAItoCompare} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors">
                                <i className="fas fa-robot mr-1"></i>
                                قارن التفاسير
                            </button>
                        </div>
                        <p className="text-text-primary leading-relaxed">{tafsirText}</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2 text-primary">الترجمة ({translationName}):</h4>
                        <p className="text-text-primary leading-relaxed text-left" dir="ltr">{translationText}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TafsirPopup;