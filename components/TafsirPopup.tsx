
import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';

const TafsirPopup: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedAyah, showTafsir } = state;

    const isVisible = showTafsir && !!selectedAyah;
    const [isRendered, setIsRendered] = useState(isVisible);

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
        }
    }, [isVisible]);

    const handleAnimationEnd = () => {
        if (!isVisible) {
            setIsRendered(false);
        }
    };
    
    const closeModal = () => {
        actions.setState(s => ({ ...s, showTafsir: false, selectedAyah: null }));
    };

    if (!isRendered) return null;
    
    const tafsirText = selectedAyah?.tafsirs?.[0]?.text.replace(/<[^>]*>/g, '') || 'التفسير غير متوفر.';
    const translationText = selectedAyah?.translations?.[0]?.text || 'الترجمة غير متوفرة.';

    return (
        <div className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}`} onClick={closeModal}>
            <div 
                className={`bg-bg-primary rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl ${isVisible ? 'animate-scaleIn' : 'animate-scaleOut'}`}
                onClick={e => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
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
                        <h4 className="font-bold mb-2 text-primary">التفسير الميسر:</h4>
                        <p className="text-text-primary leading-relaxed">{tafsirText}</p>
                    </div>
                     <div>
                        <h4 className="font-bold mb-2 text-primary">الترجمة (الإنجليزية):</h4>
                        <p className="text-text-primary leading-relaxed text-left" dir="ltr">{translationText}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TafsirPopup;