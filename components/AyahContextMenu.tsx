import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { API_BASE, AUDIO_BASE } from '../constants';
import { Panel, RepeatMode, Verse } from '../types';
import { showToast } from './ToastContainer';

const AyahContextMenu: React.FC = () => {
    const { state, actions } = useApp();
    const { selectedAyah } = state;
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [isListeningAudio, setIsListeningAudio] = useState(false);
    const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
    const standaloneAudioRef = useRef<HTMLAudioElement | null>(null);
    const wordAudioRef = useRef<HTMLAudioElement | null>(null);
    const wordLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wordPressStartPos = useRef<{ x: number, y: number } | null>(null);

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

    useEffect(() => {
        const styleId = 'context-menu-font-style';
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
        }
    }, [isVisible, selectedAyah, state.font]);

    // Cleanup standalone audio on unmount
    useEffect(() => {
        return () => {
            if (standaloneAudioRef.current) {
                standaloneAudioRef.current.pause();
                standaloneAudioRef.current = null;
            }
        };
    }, []);


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

    const fontStyle: React.CSSProperties = {};
    let renderWords: { text: string; audioUrl?: string | null; isWord: boolean; originalWord?: any }[] = [];

    if (state.font === 'qpc-v1' && selectedAyah && state.wordGlyphData) {
        fontStyle.fontFamily = `'quran-font-p${selectedAyah.page_number}'`;
        const verseKeyPrefix = `${selectedAyah.chapter_id}:${selectedAyah.verse_number}:`;

        const qpcWords = Object.entries(state.wordGlyphData)
            .filter(([key]) => key.startsWith(verseKeyPrefix))
            .map(([key, wordInfo]) => ({ ...wordInfo, wordNum: parseInt(key.split(':')[2], 10) }))
            .sort((a, b) => a.wordNum - b.wordNum);

        renderWords = qpcWords.map((qpcWord) => {
            const apiWord = selectedAyah.words?.find(w => w.position === qpcWord.wordNum);

            const chapterStr = String(selectedAyah.chapter_id).padStart(3, '0');
            const ayahStr = String(selectedAyah.verse_number).padStart(3, '0');
            const wordNumStr = String(qpcWord.wordNum).padStart(3, '0');
            const fixedAudioUrl = `wbw/${chapterStr}_${ayahStr}_${wordNumStr}.mp3`;

            return {
                text: (qpcWord as any).text,
                audioUrl: apiWord ? fixedAudioUrl : undefined,
                isWord: apiWord ? apiWord.char_type_name === 'word' : false,
                originalWord: apiWord
            };
        });
    } else {
        if (selectedAyah?.words) {
            renderWords = selectedAyah.words.map((apiWord) => {
                const chapterStr = String(selectedAyah.chapter_id).padStart(3, '0');
                const ayahStr = String(selectedAyah.verse_number).padStart(3, '0');
                const posStr = String(apiWord.position || 0).padStart(3, '0');
                const fixedAudioUrl = `wbw/${chapterStr}_${ayahStr}_${posStr}.mp3`;

                return {
                    text: apiWord.text_uthmani,
                    audioUrl: apiWord.char_type_name === 'word' ? fixedAudioUrl : apiWord.audio_url,
                    isWord: apiWord.char_type_name === 'word',
                    originalWord: apiWord
                };
            });
        } else if (selectedAyah?.text_uthmani) {
            renderWords = [{ text: selectedAyah.text_uthmani, isWord: false }];
        }
    }

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
            setShowShareOptions(false);
            setTranslateY(0);

            if (state.contextMenuInitialWordPosition && renderWords.length > 0) {
                const initialIdx = renderWords.findIndex(w => w.originalWord?.position === state.contextMenuInitialWordPosition);
                if (initialIdx !== -1) {
                    setActiveWordIndex(initialIdx);
                    const wordObj = renderWords[initialIdx];
                    if (wordObj.audioUrl) {
                        const audio = new Audio(`${AUDIO_BASE}${wordObj.audioUrl}`);
                        wordAudioRef.current = audio;
                        audio.onended = () => { wordAudioRef.current = null; };
                        audio.onerror = () => { wordAudioRef.current = null; };
                        audio.play().catch(console.error);
                    }
                } else {
                    setActiveWordIndex(null);
                }
            } else {
                setActiveWordIndex(null);
            }
        } else {
            // Stop standalone audio when context menu closes
            if (standaloneAudioRef.current) {
                standaloneAudioRef.current.pause();
                standaloneAudioRef.current = null;
                setIsListeningAudio(false);
            }
            if (wordAudioRef.current) {
                wordAudioRef.current.pause();
                wordAudioRef.current = null;
            }
            setActiveWordIndex(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible, state.contextMenuInitialWordPosition]);

    const handleAnimationEnd = () => {
        if (!isVisible) {
            setIsRendered(false);
        }
    };

    if (!isRendered) return null;

    // Play audio in background - standalone, no Audio panel
    const playAudioInBackground = async () => {
        if (!selectedAyah) return;

        // If already playing, stop it
        if (standaloneAudioRef.current) {
            standaloneAudioRef.current.pause();
            standaloneAudioRef.current = null;
            setIsListeningAudio(false);
            return;
        }

        try {
            // Build audio URL using reciter mapping
            const customRecitersMap: Record<number, number> = {
                1001: 1, 1002: 2, 1003: 3, 1004: 4, 1005: 5, 1006: 6, 1007: 7,
                1008: 8, 1009: 9, 1010: 10, 1011: 11, 1012: 12, 1013: 13, 1014: 14,
                1015: 15, 1016: 16, 1017: 17, 1018: 18, 1019: 19, 1020: 20
            };
            const reciterId = state.selectedReciterId;
            const reciterCode = customRecitersMap[reciterId] || reciterId;
            const surahId = String(selectedAyah.chapter_id).padStart(3, '0');
            const ayahId = String(selectedAyah.verse_number).padStart(3, '0');

            let audioUrl = '';
            if (reciterId >= 1001) {
                audioUrl = `https://the-quran-project.github.io/Quran-Audio/Data/${reciterCode}/${surahId}_${ayahId}.mp3`;
            } else {
                // Use the verse audio if available
                audioUrl = selectedAyah.audio?.url
                    ? `${AUDIO_BASE}${selectedAyah.audio.url}`
                    : `https://the-quran-project.github.io/Quran-Audio/Data/${reciterCode}/${surahId}_${ayahId}.mp3`;
            }

            const audio = new Audio(audioUrl);
            standaloneAudioRef.current = audio;
            setIsListeningAudio(true);

            audio.onended = () => {
                standaloneAudioRef.current = null;
                setIsListeningAudio(false);
            };

            audio.onerror = () => {
                standaloneAudioRef.current = null;
                setIsListeningAudio(false);
            };

            await audio.play();
        } catch (err) {
            console.error('Error playing standalone audio:', err);
            setIsListeningAudio(false);
        }
    };

    const showTafsir = () => {
        actions.setState(s => ({ ...s, showTafsir: true, selectedAyah: s.selectedAyah }));
    };

    const handleLastRead = () => {
        if (!selectedAyah || !surah) return;
        const currentLastRead = state.lastRead?.verseKey;
        const isCurrentLastRead = currentLastRead === selectedAyah.verse_key;

        const newLastRead = isCurrentLastRead ? null : {
            verseKey: selectedAyah.verse_key,
            pageNumber: selectedAyah.page_number,
            text: selectedAyah.text_uthmani,
            surahName: surah.name_arabic
        };

        actions.setState(s => ({ ...s, lastRead: newLastRead }));
        if (newLastRead) {
            localStorage.setItem('lastRead', JSON.stringify(newLastRead));
        } else {
            localStorage.removeItem('lastRead');
        }
        onDismiss();
    };

    const shareText = () => {
        if (!selectedAyah || !surah) return;
        const text = `${selectedAyah.text_uthmani} (سورة ${surah?.name_arabic}، الآية ${selectedAyah.verse_number})`;
        if (navigator.share) {
            navigator.share({ title: 'آية من القرآن الكريم', text });
        } else {
            navigator.clipboard.writeText(text);
            showToast('تم نسخ الآية', 'success');
        }
        onDismiss();
    };

    const shareAsImage = () => {
        actions.setState(s => ({ ...s, showShareImageModal: true }));
    };

    const copyText = () => {
        if (!selectedAyah) return;
        navigator.clipboard.writeText(selectedAyah.text_uthmani);
        showToast('تم نسخ نص الآية', 'success');
        onDismiss();
    };

    const addNote = () => {
        if (!selectedAyah) return;
        actions.setState(s => ({
            ...s,
            noteVerseTarget: s.selectedAyah,
            activePanel: Panel.Notes,
        }));
        actions.selectAyah(null);
    };

    const handleBookmark = () => {
        if (!selectedAyah) return;
        actions.toggleBookmark(selectedAyah);
        const isCurrentlyBookmarked = state.bookmarks.some(b => b.verseKey === selectedAyah.verse_key);
        showToast(isCurrentlyBookmarked ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة', 'success');
        onDismiss();
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
    const isLastRead = state.lastRead?.verseKey === selectedAyah?.verse_key;
    const isBookmarked = state.bookmarks.some(b => b.verseKey === selectedAyah?.verse_key);

    const mainMenuItems = [
        { icon: isListeningAudio ? 'fa-stop-circle' : 'fa-play-circle', label: isListeningAudio ? 'إيقاف' : 'استماع', action: playAudioInBackground, highlight: isListeningAudio },
        { icon: 'fa-book-open', label: 'التفسير', action: showTafsir },
        { icon: 'fa-history', label: 'آخر قراءة', action: handleLastRead, highlight: isLastRead },
        { icon: 'fa-bookmark', label: 'المفضلة', action: handleBookmark, highlight: isBookmarked },
        { icon: 'fa-pen-fancy', label: 'ملاحظة', action: addNote },
        { icon: 'fa-copy', label: 'نسخ', action: copyText },
        { icon: 'fa-share-alt', label: 'مشاركة', action: () => setShowShareOptions(true) },
        { icon: 'fa-robot', label: 'اسأل عبدالحكيم', action: askAI },
    ];

    const shareMenuItems = [
        { icon: 'fa-font', label: 'مشاركة كنص', action: shareText },
        { icon: 'fa-image', label: 'مشاركة كصورة', action: shareAsImage },
    ];

    // Handle tapping a word: highlight + play audio
    const handleWordTap = (e: React.MouseEvent | React.TouchEvent, wordIndex: number, audioUrl?: string | null) => {
        e.stopPropagation();
        setActiveWordIndex(wordIndex);

        // Stop any previous word audio
        if (wordAudioRef.current) {
            wordAudioRef.current.pause();
            wordAudioRef.current = null;
        }

        if (audioUrl) {
            const audio = new Audio(`${AUDIO_BASE}${audioUrl}`);
            wordAudioRef.current = audio;
            audio.onended = () => {
                wordAudioRef.current = null;
                // Intentional: Do not remove activeWordIndex here so the highlight stays
            };
            audio.onerror = () => {
                wordAudioRef.current = null;
            };
            audio.play().catch(console.error);
        }
    };

    const renderContent = () => {
        if (showShareOptions) {
            return (
                <div className="grid grid-cols-2 gap-4 pt-2">
                    {shareMenuItems.map(item => (
                        <button key={item.label} onClick={item.action} className="context-menu-option flex flex-col items-center justify-center p-4 bg-bg-secondary rounded-2xl hover:bg-bg-tertiary active:scale-95 transition-all">
                            <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-full mb-3">
                                <i className={`fas ${item.icon} text-2xl text-primary`}></i>
                            </div>
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            );
        }
        return (
            <div className="grid grid-cols-4 gap-2.5 text-center">
                {mainMenuItems.map(item => (
                    <button key={item.label} onClick={item.action} className={`context-menu-option flex flex-col items-center justify-center p-3 rounded-2xl space-y-2 active:scale-95 transition-all ${(item as any).highlight ? 'bg-primary/15 ring-1 ring-primary/30' : 'bg-bg-secondary hover:bg-bg-tertiary'}`}>
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${(item as any).highlight ? 'bg-primary text-white' : 'bg-primary/10'}`}>
                            <i className={`fas ${item.icon} text-xl ${(item as any).highlight ? 'text-white' : 'text-primary'}`}></i>
                        </div>
                        <span className={`text-xs font-medium ${(item as any).highlight ? 'text-primary font-bold' : ''}`}>{item.label}</span>
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
                className={`fixed bottom-0 left-0 right-0 bg-bg-primary rounded-t-3xl shadow-2xl z-50 touch-none ${isVisible ? 'animate-slideInUp' : 'animate-slideOutDown'}`}
                style={style}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="p-4 relative">
                    <div className="w-10 h-1 bg-bg-tertiary rounded-full mx-auto mb-4"></div>
                    {showShareOptions && (
                        <button onClick={() => { setShowShareOptions(false); }} className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center bg-bg-secondary rounded-full text-text-secondary hover:bg-bg-tertiary transition-colors">
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    )}
                    {/* Verse preview card */}
                    <div className="mb-4 bg-bg-secondary rounded-2xl p-4 border border-border/50">
                        <p className="font-arabic text-lg text-center leading-loose" dir="rtl" style={{ ...fontStyle, wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', display: 'block', width: '100%' }}>
                            {renderWords.length > 0 ? (
                                renderWords.map((wordObj, idx) => {
                                    if (wordObj.isWord || wordObj.audioUrl) {
                                        return (
                                            <span key={idx}>
                                                <span
                                                    key={idx}
                                                    onClick={(e) => handleWordTap(e, idx, wordObj.audioUrl)}
                                                    className={`
                                                        relative inline-block cursor-pointer transition-all duration-200
                                                        ${activeWordIndex === idx ? 'text-primary scale-110' : 'hover:text-primary'}
                                                    `}
                                                >
                                                    {wordObj.text}
                                                </span>
                                                {state.font !== 'qpc-v1' && " "}
                                            </span>
                                        );
                                    } else {
                                        return <span key={idx}>{wordObj.text}{state.font !== 'qpc-v1' && " "}</span>;
                                    }
                                })
                            ) : null}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                {`سورة ${surah?.name_arabic}`}
                            </span>
                            <span className="text-xs px-3 py-1 bg-bg-tertiary text-text-secondary rounded-full">
                                {`الآية ${selectedAyah?.verse_number}`}
                            </span>
                        </div>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </>
    );
};

export default AyahContextMenu;