import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { ReadingMode, AyahWordState, Verse, Word } from '../types';
import { TOTAL_PAGES } from '../constants';
import { renderedFontPages } from '../utils/fontPageTracker';
import '../styles/recitation.css';

// ═══════════════════════════════════════════════════════════════
// مكون الكلمة — يعرض كل كلمة بخط القرآن مع التأثيرات البصرية
// ═══════════════════════════════════════════════════════════════
const RecitationWord = React.memo(({
    displayText,
    placeholderText,
    wordState,
    isCurrent,
}: {
    displayText: string;
    placeholderText: string;
    wordState: AyahWordState;
    isCurrent: boolean;
}) => {
    let content: React.ReactNode;
    let className = 'recitation-word';

    switch (wordState) {
        case AyahWordState.Correct:
            content = displayText;
            className += ' recitation-word--correct';
            break;
        case AyahWordState.Skipped:
            content = displayText;
            className += ' recitation-word--skipped';
            break;
        case AyahWordState.Revealed:
            content = displayText;
            className += ' recitation-word--revealed';
            break;
        case AyahWordState.Hinted:
            // إظهار أول حرفين فقط
            const hint = displayText.substring(0, 2) + '...';
            content = hint;
            className += ' recitation-word--hinted';
            break;
        case AyahWordState.Incorrect:
            content = <span style={{ opacity: 0 }}>{placeholderText}</span>;
            className += ' recitation-word--incorrect';
            break;
        default: // Hidden, Waiting
            content = <span style={{ opacity: 0 }}>{placeholderText}</span>;
            className += ' recitation-word--hidden';
            break;
    }

    if (isCurrent && (wordState === AyahWordState.Hidden || wordState === AyahWordState.Waiting)) {
        className += ' recitation-word--current';
    }

    return <span className={className}>{content}</span>;
});

// ═══════════════════════════════════════════════════════════════
// واجهة التسميع الرئيسية
// ═══════════════════════════════════════════════════════════════
const MemorizationInterface: React.FC = () => {
    const { state, actions } = useApp();
    const [wordStates, setWordStates] = useState<AyahWordState[]>([]);
    const [showCompletion, setShowCompletion] = useState(false);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const currentWordRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);

    // ─── إعداد خط الصفحة (QPC) ───
    const currentPage = state.currentPage;
    const font = state.font;

    useEffect(() => {
        if (font !== 'qpc-v1' || currentPage <= 0) return;

        const styleId = `dynamic-quran-font-style-recitation-${currentPage}`;
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        const cssRule = `
            @font-face {
                font-family: 'QuranPageFontV2-${currentPage}';
                src: url('/QPC V2 Font/p${currentPage}.ttf') format('truetype');
                font-display: block;
            }
        `;
        if (styleEl.innerHTML !== cssRule) {
            styleEl.innerHTML = cssRule;
        }

        // تحميل الخط
        const fontSpec = `1em QuranPageFontV2-${currentPage}`;
        if (!document.fonts.check(fontSpec)) {
            document.fonts.load(fontSpec).then(() => {
                renderedFontPages.add(currentPage);
            }).catch(() => {
                renderedFontPages.add(currentPage);
            });
        }
    }, [currentPage, font]);

    // ─── استخراج الآيات والكلمات ───
    const verses = useMemo(() => {
        return [...(state.pageData.right || []), ...(state.pageData.left || [])];
    }, [state.pageData]);

    // ─── بناء بيانات الكلمات مع نصوص QPC ───
    const wordsData = useMemo(() => {
        const result: {
            word: Word;
            verse: Verse;
            qpcText: string; // نص QPC للعرض
            uthmaniText: string; // نص عثماني للمقارنة
        }[] = [];

        for (const verse of verses) {
            const verseWords = verse.words.filter(w => w.char_type_name === 'word');

            if (font === 'qpc-v1' && state.wordGlyphData) {
                // استخدام بيانات QPC glyph
                const verseKeyPrefix = `${verse.chapter_id}:${verse.verse_number}:`;
                const qpcWords = Object.entries(state.wordGlyphData)
                    .filter(([key]) => key.startsWith(verseKeyPrefix))
                    .map(([key, wordInfo]) => ({
                        id: wordInfo.id,
                        text: wordInfo.text,
                        position: parseInt(key.split(':')[2], 10),
                    }))
                    .sort((a, b) => a.position - b.position);

                // ربط كلمات QPC مع كلمات API
                for (let i = 0; i < Math.min(verseWords.length, qpcWords.length); i++) {
                    result.push({
                        word: verseWords[i],
                        verse,
                        qpcText: qpcWords[i].text,
                        uthmaniText: verseWords[i].text_uthmani || '',
                    });
                }

                // أي كلمات إضافية لم تُربط
                for (let i = qpcWords.length; i < verseWords.length; i++) {
                    result.push({
                        word: verseWords[i],
                        verse,
                        qpcText: verseWords[i].text_uthmani || '',
                        uthmaniText: verseWords[i].text_uthmani || '',
                    });
                }
            } else {
                // بدون QPC — استخدام text_uthmani مباشرة
                for (const w of verseWords) {
                    result.push({
                        word: w,
                        verse,
                        qpcText: w.text_uthmani || '',
                        uthmaniText: w.text_uthmani || '',
                    });
                }
            }
        }

        return result;
    }, [verses, font, state.wordGlyphData]);

    // ─── النصوص المتوقعة للمقارنة الصوتية ───
    const expectedTexts = useMemo(() => {
        return wordsData.map(w => w.uthmaniText);
    }, [wordsData]);

    // ─── Callbacks ───
    const handleWordMatch = useCallback((index: number) => {
        setWordStates(prev => {
            const newStates = [...prev];
            if (index < newStates.length) {
                newStates[index] = AyahWordState.Correct;
            }
            for (let i = 0; i < index; i++) {
                if (newStates[i] === AyahWordState.Hidden || newStates[i] === AyahWordState.Waiting) {
                    newStates[i] = AyahWordState.Skipped;
                }
            }
            return newStates;
        });
        // اهتزاز خفيف عند المطابقة
        try { navigator.vibrate(15); } catch { }
        actions.addMemorizationPoints(10);
    }, [actions]);

    const handleWordMismatch = useCallback((index: number) => {
        setWordStates(prev => {
            const newStates = [...prev];
            if (index < newStates.length) {
                newStates[index] = AyahWordState.Incorrect;
            }
            return newStates;
        });
        // اهتزاز أقوى عند الخطأ
        try { navigator.vibrate([30, 50, 30]); } catch { }
        actions.addMemorizationPoints(-5);

        setTimeout(() => {
            setWordStates(prev => {
                const restored = [...prev];
                if (index < restored.length && restored[index] === AyahWordState.Incorrect) {
                    restored[index] = AyahWordState.Hidden;
                }
                return restored;
            });
        }, 800);
    }, [actions]);

    // ─── Hook التعرف على الكلام ───
    const {
        currentIndex,
        isListening,
        isLoading,
        isSupported,
        start: startListening,
        stop: stopListening,
        resetIndex,
    } = useSpeechRecognition({
        expectedWords: expectedTexts,
        onWordMatch: handleWordMatch,
        onWordMismatch: handleWordMismatch,
    });

    // ─── إعادة تعيين عند تغيّر الصفحة ───
    useEffect(() => {
        stopListening();
        setWordStates(wordsData.map(() => AyahWordState.Hidden));
        setShowCompletion(false);
        resetIndex();

        const timer = setTimeout(() => {
            if (isSupported) startListening();
        }, 600);

        return () => {
            clearTimeout(timer);
            stopListening();
        };
    }, [wordsData.length, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── تمرير تلقائي للكلمة الحالية ───
    useEffect(() => {
        if (currentIndex > 0 && mainRef.current) {
            const wordElements = mainRef.current.querySelectorAll('.recitation-word');
            const targetEl = wordElements[currentIndex];
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentIndex]);

    // ─── إكمال الصفحة ───
    useEffect(() => {
        if (currentIndex > 0 && currentIndex >= wordsData.length && wordsData.length > 0) {
            setShowCompletion(true);
            actions.addMemorizationPoints(100);

            const timer = setTimeout(() => {
                if (currentPage < TOTAL_PAGES) {
                    actions.loadPage(currentPage + 1);
                }
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, wordsData.length, currentPage, actions]);

    // ─── التنقل بالأسهم ───
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && currentPage < TOTAL_PAGES) {
                actions.loadPage(currentPage + 1);
            } else if (e.key === 'ArrowRight' && currentPage > 1) {
                actions.loadPage(currentPage - 1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actions, currentPage]);

    // ─── التنقل بالسحب ───
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
        if (Math.abs(dx) > 50 && dy < 100) {
            if (dx > 0 && currentPage > 1) actions.loadPage(currentPage - 1);
            else if (dx < 0 && currentPage < TOTAL_PAGES) actions.loadPage(currentPage + 1);
        }
    };

    // ─── أزرار التحكم ───
    const handleHint = () => {
        if (currentIndex < wordsData.length) {
            setWordStates(prev => {
                const s = [...prev];
                s[currentIndex] = s[currentIndex] === AyahWordState.Hinted
                    ? AyahWordState.Hidden
                    : AyahWordState.Hinted;
                return s;
            });
        }
    };

    const handleSkip = () => {
        if (currentIndex < wordsData.length) {
            handleWordMatch(currentIndex);
        }
    };

    const handleRevealAyah = () => {
        if (verses.length === 0) return;
        let wordCounter = 0;
        for (const verse of verses) {
            const count = verse.words.filter(w => w.char_type_name === 'word').length;
            if (currentIndex >= wordCounter && currentIndex < wordCounter + count) {
                const isRevealed = wordStates[wordCounter] === AyahWordState.Revealed;
                setWordStates(prev => {
                    const s = [...prev];
                    for (let i = 0; i < count; i++) {
                        const idx = wordCounter + i;
                        if (idx < s.length) {
                            s[idx] = isRevealed ? AyahWordState.Hidden : AyahWordState.Revealed;
                        }
                    }
                    return s;
                });
                break;
            }
            wordCounter += count;
        }
    };

    const handleReset = () => {
        resetIndex();
        setWordStates(wordsData.map(() => AyahWordState.Hidden));
        setShowCompletion(false);
    };

    // ─── حساب التقدم ───
    const surah = verses[0] ? state.surahs.find(s => s.id === verses[0].chapter_id) : null;
    const correctCount = wordStates.filter(s =>
        s === AyahWordState.Correct || s === AyahWordState.Skipped || s === AyahWordState.Revealed
    ).length;
    const progress = wordsData.length > 0 ? (correctCount / wordsData.length) * 100 : 0;

    // ─── نمط الخط ───
    const fontStyle: React.CSSProperties = font === 'qpc-v1' ? {
        fontFamily: `QuranPageFontV2-${currentPage}`,
        fontSize: `${state.fontSize + 4}px`,
        lineHeight: 2.8,
        direction: 'rtl',
    } : {
        fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', serif",
        fontSize: `${state.fontSize + 2}px`,
        lineHeight: 3,
        direction: 'rtl',
    };

    // ─── تجميع الكلمات حسب الآيات ───
    let globalIndex = 0;

    // ═══════════════════════════════════════════════════════════
    // العرض
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="flex flex-col h-full w-full bg-bg-secondary">
            {/* ═══ الهيدر ═══ */}
            <header className="recitation-header bg-bg-primary border-b border-border shadow-sm z-10 shrink-0">
                <div
                    className="flex items-center justify-between px-4 pb-3"
                    style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0rem))' }}
                >
                    {/* يسار — رجوع + النقاط */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { stopListening(); actions.setReadingMode(ReadingMode.Reading); }}
                            className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors"
                        >
                            <i className="fas fa-arrow-right text-lg"></i>
                        </button>
                        <div className="flex items-center gap-1 text-amber-500">
                            <i className="fas fa-star"></i>
                            <span className="font-bold text-sm">{state.memorizationStats.points}</span>
                        </div>
                    </div>

                    {/* وسط — العنوان */}
                    <div className="text-center">
                        <h1 className="text-sm font-bold text-text-primary">وضع التحفيظ</h1>
                        <p className="text-xs text-text-secondary">
                            {surah?.name_arabic} — صفحة {currentPage}
                        </p>
                    </div>

                    {/* يمين — السلسلة + حالة الميكروفون */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-red-500">
                            <i className="fas fa-fire"></i>
                            <span className="font-bold text-sm">{state.memorizationStats.streak}</span>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center">
                            {isLoading ? (
                                <i className="fas fa-spinner fa-spin text-primary text-lg"></i>
                            ) : isListening ? (
                                <i className="fas fa-microphone text-green-500 text-lg animate-pulse"></i>
                            ) : (
                                <i className="fas fa-microphone-slash text-red-400 text-lg"></i>
                            )}
                        </div>
                    </div>
                </div>

                {/* شريط التقدم */}
                <div className="w-full bg-bg-tertiary h-1">
                    <div className="recitation-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            </header>

            {/* ═══ المحتوى الرئيسي ═══ */}
            <main
                ref={mainRef}
                className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {!isSupported && (
                    <div className="recitation-unsupported mb-4">
                        <i className="fas fa-exclamation-triangle text-2xl text-amber-600 mb-2"></i>
                        <p className="font-bold text-amber-800">المتصفح لا يدعم التعرف على الكلام</p>
                        <p className="text-sm text-amber-700 mt-1">
                            يرجى استخدام متصفح Google Chrome للحصول على أفضل تجربة
                        </p>
                    </div>
                )}

                {showCompletion && (
                    <div className="recitation-completion text-center py-6 mb-4">
                        <div className="text-4xl mb-2">🎉</div>
                        <h2 className="text-xl font-bold text-green-600">أحسنت!</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            أكملت الصفحة بنجاح — جاري الانتقال للصفحة التالية...
                        </p>
                    </div>
                )}

                <div className="text-right" style={fontStyle}>
                    {verses.map(verse => {
                        const verseWords = verse.words.filter(w => w.char_type_name === 'word');
                        const wordElements = verseWords.map((_, i) => {
                            const idx = globalIndex;
                            globalIndex++;
                            const wd = wordsData[idx];
                            if (!wd) return null;

                            return (
                                <RecitationWord
                                    key={`${wd.word.id}-${idx}`}
                                    displayText={wd.qpcText}
                                    placeholderText={wd.qpcText}
                                    wordState={wordStates[idx] || AyahWordState.Hidden}
                                    isCurrent={idx === currentIndex && isListening}
                                />
                            );
                        });

                        return (
                            <React.Fragment key={verse.verse_key}>
                                {wordElements}
                                <span className="recitation-verse-number">
                                    {new Intl.NumberFormat('ar-EG').format(verse.verse_number)}
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>
            </main>

            {/* ═══ شريط الأدوات السفلي ═══ */}
            <footer
                className="bg-bg-primary border-t border-border pt-3 px-3 shrink-0"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0rem))' }}
            >
                <div className="flex justify-center items-center gap-2">
                    <button onClick={handleReset} className="recitation-toolbar-btn">
                        <i className="fas fa-undo"></i>
                        <span>إعادة</span>
                    </button>
                    <button onClick={handleRevealAyah} className="recitation-toolbar-btn">
                        <i className="fas fa-eye"></i>
                        <span>كشف</span>
                    </button>

                    {/* زر الميكروفون الكبير */}
                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={`recitation-mic-btn mx-2 ${isListening ? 'recitation-mic-btn--active' : 'recitation-mic-btn--inactive'}`}
                    >
                        <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} text-2xl`}></i>
                    </button>

                    <button onClick={handleHint} className="recitation-toolbar-btn">
                        <i className="fas fa-lightbulb"></i>
                        <span>تلميح</span>
                    </button>
                    <button onClick={handleSkip} className="recitation-toolbar-btn">
                        <i className="fas fa-forward-step"></i>
                        <span>تخطي</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MemorizationInterface;
