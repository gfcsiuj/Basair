import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { API_BASE, AUDIO_BASE } from '../constants';
import { Panel } from '../types';

const AyahContextMenu: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedAyah } = state;
    const [showShareOptions, setShowShareOptions] = useState(false);

    // Animation state
    const isVisible = !!selectedAyah;
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
    
    if (!isRendered) return null;

    const closeMenu = () => {
        setShowShareOptions(false);
        actions.selectAyah(null);
    };

    const surah = state.surahs.find(s => s.id === selectedAyah?.chapter_id);
    const isBookmarked = state.bookmarks.some(b => b.verseKey === selectedAyah?.verse_key);

    const playAudio = () => {
        if (!selectedAyah) return;
        const audio = new Audio(`${AUDIO_BASE}${selectedAyah.audio?.url}`);
        audio.play();
        closeMenu();
    };

    const showTafsir = () => {
        actions.setState(s => ({ ...s, showTafsir: true, selectedAyah: s.selectedAyah }));
    };
    
    const handleBookmark = () => {
        if (!selectedAyah) return;
        actions.toggleBookmark(selectedAyah);
        closeMenu();
    };

    const shareText = () => {
        if (!selectedAyah || !surah) return;
        const text = `${selectedAyah.text_uthmani} (سورة ${surah?.name_arabic}، الآية ${selectedAyah.verse_number})`;
        if (navigator.share) {
            navigator.share({ title: 'آية من القرآن الكريم', text });
        } else {
            navigator.clipboard.writeText(text);
            alert('تم نسخ الآية');
        }
        closeMenu();
    };

    const shareAsImage = () => {
        actions.setState(s => ({ ...s, showShareImageModal: true }));
        // The modal will handle closing the context menu
    };
    
    const copyText = () => {
        if (!selectedAyah) return;
        navigator.clipboard.writeText(selectedAyah.text_uthmani);
        alert('تم نسخ نص الآية');
        closeMenu();
    };
    
    const addNote = () => {
        if (!selectedAyah) return;
        actions.setState(s => ({
            ...s,
            noteVerseTarget: s.selectedAyah,
            activePanel: Panel.Notes,
        }));
        actions.selectAyah(null); // This closes the context menu
    };


    const askAI = () => {
        if (!selectedAyah || !surah) return;
        const query = `ما تفسير هذه الآية: "${selectedAyah.text_uthmani}" (سورة ${surah?.name_arabic}، الآية ${selectedAyah.verse_number})`;
        actions.setState(s => ({
            ...s,
            isAIAssistantOpen: true,
            aiAutoPrompt: query,
        }));
        closeMenu();
    };

    const mainMenuItems = [
        { icon: 'fa-play-circle', label: 'استماع', action: playAudio },
        { icon: 'fa-book-open', label: 'التفسير', action: showTafsir },
        { icon: 'fa-bookmark', label: isBookmarked ? 'إزالة' : 'حفظ', action: handleBookmark },
        { icon: 'fa-pen-alt', label: 'ملاحظة', action: addNote },
        { icon: 'fa-copy', label: 'نسخ', action: copyText },
        { icon: 'fa-share-alt', label: 'مشاركة', action: () => setShowShareOptions(true) },
        { icon: 'fa-robot', label: 'اسأل عبدالحكيم', action: askAI },
    ];

    const shareMenuItems = [
        { icon: 'fa-font', label: 'مشاركة كنص', action: shareText },
        { icon: 'fa-image', label: 'مشاركة كصورة', action: shareAsImage },
    ];

    return (
        <>
            <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}`} onClick={closeMenu}></div>
            <div 
                onAnimationEnd={handleAnimationEnd}
                className={`fixed bottom-0 left-0 right-0 bg-bg-primary rounded-t-2xl shadow-lg z-50 ${isVisible ? 'animate-slideInUp' : 'animate-slideOutDown'}`}
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0rem)' }}
            >
                <div className="p-4 relative">
                    <div className="w-12 h-1.5 bg-bg-tertiary rounded-full mx-auto mb-4"></div>
                    {showShareOptions && (
                        <button onClick={() => setShowShareOptions(false)} className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center bg-bg-secondary rounded-full text-text-secondary hover:bg-bg-tertiary">
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    )}
                    <div className="mb-4 text-center">
                        <p className="font-arabic text-lg mb-1">{selectedAyah?.text_uthmani}</p>
                        <p className="text-sm text-text-secondary">{`سورة ${surah?.name_arabic} - الآية ${selectedAyah?.verse_number}`}</p>
                    </div>
                    
                    {!showShareOptions ? (
                        <div className="grid grid-cols-4 gap-2 text-center">
                            {mainMenuItems.map(item => (
                                <button key={item.label} onClick={item.action} className="flex flex-col items-center justify-center p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors space-y-2">
                                    <i className={`fas ${item.icon} text-xl text-primary`}></i>
                                    <span className="text-xs font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                         <div className="grid grid-cols-2 gap-3 pt-2">
                            {shareMenuItems.map(item => (
                                <button key={item.label} onClick={item.action} className="flex flex-col items-center justify-center p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors">
                                    <i className={`fas ${item.icon} text-2xl mb-2 text-primary`}></i>
                                    <span className="text-xs font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AyahContextMenu;
