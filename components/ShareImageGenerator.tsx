import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../hooks/useApp';

declare const html2canvas: any;

const ShareImageGenerator: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedAyah, showShareImageModal } = state;

    const [config, setConfig] = useState({
        fontSize: 40,
        fontFamily: 'arabic', // Maps to font-arabic from tailwind
        textColor: '#FFFFFF',
        bgColor: '#059669',
        showInfo: true,
    });
    const previewRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const isVisible = showShareImageModal && !!selectedAyah;
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
    
    const fontClasses: { [key: string]: string } = {
        'arabic': 'font-arabic',
        'indopak': 'font-indopak',
        'noto': 'font-noto'
    };
    const fonts = [
        { id: 'arabic', name: 'عثماني' },
        { id: 'indopak', name: 'هندي' },
        { id: 'noto', name: 'نسخ' },
    ];
    const textColors = ['#FFFFFF', '#000000', '#FBBF24', '#34D399', '#3B82F6'];
    const bgColors = ['#059669', '#111827', '#FDE68A', '#FEF3C7', '#1F2937'];

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
                        className={`w-[400px] h-[400px] flex flex-col items-center justify-center p-8 text-center ${fontClasses[config.fontFamily]}`}
                        style={{ backgroundColor: config.bgColor, color: config.textColor, fontSize: `${config.fontSize}px`, lineHeight: 1.8 }}
                    >
                        <p>{selectedAyah?.text_uthmani}</p>
                        {config.showInfo && (
                             <p className="font-ui mt-4 opacity-80" style={{ fontSize: `${config.fontSize * 0.4}px` }}>
                                {`{${surah?.name_arabic}: ${selectedAyah?.verse_number}}`}
                            </p>
                        )}
                    </div>
                </main>

                <footer className="p-4 space-y-4 shrink-0 border-t border-border overflow-y-auto">
                    {/* Font Size */}
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium w-16">حجم الخط</label>
                        <input type="range" min="24" max="72" value={config.fontSize} onChange={(e) => setConfig(c => ({...c, fontSize: parseInt(e.target.value)}))} className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                    {/* Font Family */}
                     <div className="flex items-center gap-4">
                        <label className="text-sm font-medium w-16">نوع الخط</label>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                           {fonts.map(font => (
                               <button key={font.id} onClick={() => setConfig(c => ({ ...c, fontFamily: font.id }))} className={`p-2 rounded-md border-2 text-sm ${config.fontFamily === font.id ? 'border-primary bg-primary/10' : 'border-border bg-bg-primary'}`}>{font.name}</button>
                           ))}
                        </div>
                    </div>
                     {/* Text Color */}
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium w-16">لون النص</label>
                        <div className="flex items-center gap-2">
                            {textColors.map(color => <button key={color} onClick={() => setConfig(c => ({...c, textColor: color}))} className={`w-8 h-8 rounded-full border-2 ${config.textColor === color ? 'border-primary' : 'border-transparent'}`} style={{backgroundColor: color}}></button>)}
                        </div>
                    </div>
                     {/* Background Color */}
                     <div className="flex items-center gap-4">
                        <label className="text-sm font-medium w-16">الخلفية</label>
                        <div className="flex items-center gap-2">
                            {bgColors.map(color => <button key={color} onClick={() => setConfig(c => ({...c, bgColor: color}))} className={`w-8 h-8 rounded-full border-2 ${config.bgColor === color ? 'border-primary' : 'border-transparent'}`} style={{backgroundColor: color}}></button>)}
                        </div>
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