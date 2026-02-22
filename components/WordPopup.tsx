import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { showToast } from './ToastContainer';
import { API_BASE, AUDIO_BASE } from '../constants';
import { Panel } from '../types';

const WordPopup: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedWord } = state;

    const isVisible = !!selectedWord;
    const [isRendered, setIsRendered] = useState(isVisible);

    // Swipe to dismiss state
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);

    const closeModal = () => {
        actions.setState(s => ({ ...s, selectedWord: null }));
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
        paddingBottom: 'env(safe-area-inset-bottom, 0rem)',
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

    if (!isRendered || !selectedWord) return null;

    const { verse, word } = selectedWord;
    const surah = state.surahs.find(s => s.id === verse.chapter_id);
    const isBookmarked = state.bookmarks.some(b => b.verseKey === verse.verse_key);

    const playAudio = () => {
        const verseIndex = state.audioQueue.findIndex(item => item.verseKey === verse.verse_key);
        if (verseIndex !== -1) {
            actions.setState(s => ({
                ...s,
                currentAudioIndex: verseIndex,
                isPlaying: true,
                activePanel: Panel.Audio,
            }));
        }
        closeModal();
    };

    const playWordAudio = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (word.audio_url) {
            const audio = new Audio(`${AUDIO_BASE}${word.audio_url}`);
            audio.play().catch(err => console.error("Failed to play word audio:", err));
        }
    };

    const showTafsir = () => {
        actions.setState(s => ({ ...s, selectedAyah: verse, showTafsir: true, selectedWord: null }));
    };

    const handleBookmark = () => {
        actions.toggleBookmark(verse);
        closeModal();
    };

    const shareAsImage = () => {
        actions.setState(s => ({ ...s, selectedAyah: verse, showShareImageModal: true, selectedWord: null }));
    };

    const copyText = () => {
        navigator.clipboard.writeText(verse.text_uthmani);
        showToast('تم نسخ نص الآية', 'success');
        closeModal();
    };

    const addNote = () => {
        actions.setState(s => ({
            ...s,
            noteVerseTarget: verse,
            activePanel: Panel.Notes,
            selectedWord: null
        }));
    };

    const askAI = () => {
        if (!surah) return;
        const query = `ما تفسير هذه الآية: "${verse.text_uthmani}" (سورة ${surah?.name_arabic}، الآية ${verse.verse_number})`;
        actions.setState(s => ({
            ...s,
            isAIAssistantOpen: true,
            aiAutoPrompt: query,
            selectedWord: null
        }));
    };

    const menuItems = [
        { icon: 'fa-play-circle', label: 'استماع', action: playAudio },
        { icon: 'fa-book-open', label: 'التفسير', action: showTafsir },
        { icon: 'fa-bookmark', label: isBookmarked ? 'إزالة' : 'حفظ', action: handleBookmark },
        { icon: 'fa-pen-alt', label: 'ملاحظة', action: addNote },
        { icon: 'fa-copy', label: 'نسخ', action: copyText },
        { icon: 'fa-image', label: 'صورة', action: shareAsImage },
        { icon: 'fa-robot', label: 'اسأل AI', action: askAI },
    ];


    return (
        <>
            <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}`} onClick={closeModal}></div>
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

                    <div className="mb-4 text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <p className="font-arabic text-3xl font-bold text-primary">{word.text_uthmani}</p>
                            {word.audio_url && (
                                <button
                                    onClick={playWordAudio}
                                    className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                                    aria-label={`استماع لكلمة ${word.text_uthmani}`}
                                >
                                    <i className="fas fa-volume-up"></i>
                                </button>
                            )}
                        </div>
                        <p className="font-arabic text-lg text-text-primary px-4">{verse.text_uthmani}</p>
                        <p className="text-sm text-text-secondary mt-1">{`سورة ${surah?.name_arabic} - الآية ${verse.verse_number}`}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                        {menuItems.map(item => (
                            <button key={item.label} onClick={item.action} className="flex flex-col items-center justify-center p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors space-y-2">
                                <i className={`fas ${item.icon} text-xl text-primary`}></i>
                                <span className="text-xs font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default WordPopup;