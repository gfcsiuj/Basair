import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { API_BASE, AUDIO_BASE } from '../constants';
import { Panel, RepeatMode } from ' ../../types';

const AyahContextMenu: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedAyah } = state;
    const [showShareOptions, setShowShareOptions] = useState(false);

    // Animation state
    const isVisible = !!selectedAyah;
    const [isRendered, setIsRendered] = useState(isVisible);

    // Swipe to dismiss state
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);

    const onDismiss = () => {
        actions.selectAyah(null);
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
            onDismiss();
        } else {
            setTranslateY(0);
        }
    };

    const style: React.CSSProperties = {
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        paddingBottom: 'env(safe-area-inset-bottom, 0rem)',
    };


    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
            setShowShareOptions(false);
            setTranslateY(0);
        }
    }, [isVisible]);

    const handleAnimationEnd = () => {
        if (!isVisible) {
            setIsRendered(false);
        }
    };
    
    if (!isRendered) return null;

    const playAudio = () => {
        if (!selectedAyah) return;
        // Find the verse in the current page's audio queue
        const verseIndex = state.audioQueue.findIndex(item => item.verseKey === selectedAyah.verse_key);
        if (verseIndex !== -1) {
            actions.setState(s => ({
                ...s,
                currentAudioIndex: verseIndex,
                isPlaying: true,
                activePanel: Panel.Audio, // Open the player
            }));
        }
        onDismiss();
    };
    
    const openAudioControls = () => {
        if (!selectedAyah) return;
        const verseIndex = state.audioQueue.findIndex(item => item.verseKey === selectedAyah.verse_key);
        if (verseIndex !== -1) {
             actions.setState(s => ({ ...s, currentAudioIndex: verseIndex, activePanel: Panel.Audio }));
        }
        onDismiss();
    };

    const showTafsir = () => {
        actions.setState(s => ({ ...s, showTafsir: true, selectedAyah: s.selectedAyah }));
    };
    
    const handleBookmark = () => {
        if (!selectedAyah) return;
        actions.toggleBookmark(selectedAyah);
        onDismiss();
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
        onDismiss();
    };

    const shareAsImage = () => {
        actions.setState(s => ({ ...s, showShareImageModal: true }));
        // The modal will handle closing the context menu
    };
    
    const copyText = () => {
        if (!selectedAyah) return;
        navigator.clipboard.writeText(selectedAyah.text_uthmani);
        alert('تم نسخ نص الآية');
        onDismiss();
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
        onDismiss();
    };

    const surah = state.surahs.find(s => s.id === selectedAyah?.chapter_id);
    const isBookmarked = state.bookmarks.some(b => b.verseKey === selectedAyah?.verse_key);

    const mainMenuItems = [
        { icon: 'fa-play-circle', label: 'استماع', action: playAudio },
        { icon: 'fa-book-open', label: 'التفسير', action: showTafsir },
        { icon: 'fa-headphones-alt', label: 'الصوت', action: openAudioControls },
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
    
    const renderContent = () => {
        if (showShareOptions) {
            return (
                 <div className="grid grid-cols-2 gap-3 pt-2">
                    {shareMenuItems.map(item => (
                        <button key={item.label} onClick={item.action} className="flex flex-col items-center justify-center p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors">
                            <i className={`fas ${item.icon} text-2xl mb-2 text-primary`}></i>
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            );
        }
        return (
            <div className="grid grid-cols-4 gap-2 text-center">
                {mainMenuItems.map(item => (
                    <button key={item.label} onClick={item.action} className="flex flex-col items-center justify-center p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors space-y-2">
                        <i className={`fas ${item.icon} text-xl text-primary`}></i>
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
<>
            <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}`} onClick={onDismiss}></div>
            <div 
                onAnimationEnd={handleAnimationEnd}
                className={`fixed bottom-0 left-0 right-0 bg-bg-primary rounded-t-2xl shadow-lg z-50 touch-none ${isVisible ? 'animate-slideInUp' : 'animate-slideOutDown'}`}
                style={style}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="p-4 relative">
                    <div className="w-12 h-1.5 bg-bg-tertiary rounded-full mx-auto mb-4"></div>
                    {showShareOptions && (
                        <button onClick={() => {setShowShareOptions(false);}} className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center bg-bg-secondary rounded-full text-text-secondary hover:bg-bg-tertiary">
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    )}
                    <div className="mb-4 text-center">
                        <p className="font-arabic text-lg mb-1">{selectedAyah?.text_uthmani}</p>
                        <p className="text-sm text-text-secondary">{`سورة ${surah?.name_arabic} - الآية ${selectedAyah?.verse_number}`}</p>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </>
    );
};

export default AyahContextMenu;