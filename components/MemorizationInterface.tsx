import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { useWitAiTracker } from '../hooks/useWitAiTracker';
import { ReadingMode, AyahWordState, Verse, Word } from '../types';
import { TOTAL_PAGES } from '../constants';

// ─────────────────────────────────────────────────────────────────────
// مكون الكلمة المحسّن - يستخدم React.memo لتجنب إعادة التصيير الزائدة
// فقط يتم إعادة تصيير الكلمة التي تغيّرت حالتها
// ─────────────────────────────────────────────────────────────────────
const WordComponent = React.memo(({ word, wordState, isCurrent }: { word: Word, wordState: AyahWordState, isCurrent: boolean }) => {
    let content: React.ReactNode;
    let wrapperClass = "transition-all duration-300 ease-in-out inline-block relative mx-1 my-2 px-2 py-1 rounded-md";

    const placeholderText = word.text_uthmani || 'الله';

    switch (wordState) {
        case AyahWordState.Correct:
        case AyahWordState.Revealed:
        case AyahWordState.Skipped:
            content = word.text_uthmani || '...';
            break;
        case AyahWordState.Hinted:
            const hintChar = word?.text_uthmani?.charAt(0);
            content = (hintChar || '.') + '..';
            break;
        default: // Hidden, Waiting, Incorrect
            content = <span className="opacity-0">{placeholderText}</span>;
            break;
    }

    if (isCurrent && (wordState === AyahWordState.Waiting || wordState === AyahWordState.Hidden)) {
        wrapperClass += " animate-pulseWaiting bg-bg-tertiary";
    } else {
        switch (wordState) {
            case AyahWordState.Incorrect: wrapperClass += " bg-red-500/30"; break;
            case AyahWordState.Correct: wrapperClass += " bg-green-500/20"; break;
            case AyahWordState.Skipped: wrapperClass += " bg-amber-500/20"; break;
            case AyahWordState.Revealed:
            case AyahWordState.Hinted: wrapperClass += " bg-blue-500/20"; break;
            default: wrapperClass += " bg-bg-tertiary"; break;
        }
    }

    return <span className={wrapperClass}>{content}</span>;
});


// ─────────────────────────────────────────────────────────────────────
// مكون واجهة التحفيظ الرئيسي
// ─────────────────────────────────────────────────────────────────────
const MemorizationInterface: React.FC = () => {
    const { state, actions } = useApp();
    const [wordStates, setWordStates] = useState<AyahWordState[]>([]);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    // ─── استخراج جميع الكلمات من بيانات الصفحة ───
    const allWords = useMemo(() => {
        const verses = [...(state.pageData.right || []), ...(state.pageData.left || [])];
        return verses.flatMap(verse =>
            verse.words.filter(w => w.char_type_name === 'word')
        );
    }, [state.pageData]);

    // ─── النصوص المتوقعة للمقارنة الصوتية ───
    const expectedTexts = useMemo(() => {
        return allWords.map(w => w.text_uthmani || '');
    }, [allWords]);

    // ─── استدعاءات المطابقة (Callbacks) ───
    const handleWordMatch = useCallback((index: number) => {
        setWordStates(prev => {
            const newStates = [...prev];
            if (index < newStates.length) {
                newStates[index] = AyahWordState.Correct;
            }
            // تطبيق حالة "Skipped" للكلمات المتخطاة بين آخر كلمة صحيحة والحالية
            for (let i = 0; i < index; i++) {
                if (newStates[i] === AyahWordState.Hidden || newStates[i] === AyahWordState.Waiting) {
                    newStates[i] = AyahWordState.Skipped;
                }
            }
            return newStates;
        });
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
        actions.addMemorizationPoints(-5);

        // إعادة الحالة بعد فترة قصيرة
        setTimeout(() => {
            setWordStates(prev => {
                const restoredStates = [...prev];
                if (index < restoredStates.length && restoredStates[index] === AyahWordState.Incorrect) {
                    restoredStates[index] = AyahWordState.Hidden;
                }
                return restoredStates;
            });
        }, 800);
    }, [actions]);

    // ─── Hook التسميع عبر Wit.ai ───
    const {
        currentIndex,
        isListening,
        isLoading,
        start: startListening,
        stop: stopListening,
        resetIndex,
    } = useWitAiTracker({
        expectedWords: expectedTexts,
        onWordMatch: handleWordMatch,
        onWordMismatch: handleWordMismatch,
    });

    // ─── إعادة تعيين الحالة عند تغيّر الصفحة ───
    useEffect(() => {
        stopListening();
        setWordStates(allWords.map(() => AyahWordState.Hidden));
        resetIndex();

        const timer = setTimeout(() => {
            startListening();
        }, 500);

        return () => {
            clearTimeout(timer);
            stopListening();
        };
    }, [allWords]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── الانتقال التلقائي للصفحة التالية عند إكمال الصفحة ───
    useEffect(() => {
        if (currentIndex > 0 && currentIndex === allWords.length && allWords.length > 0) {
            if (state.currentPage < TOTAL_PAGES) {
                actions.addMemorizationPoints(100);
                const pageTurnTimeout = setTimeout(() => {
                    actions.loadPage(state.currentPage + 1);
                }, 1500);
                return () => clearTimeout(pageTurnTimeout);
            }
        }
    }, [currentIndex, allWords.length, state.currentPage, actions]);

    // ─── التنقل بالأسهم ───
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && state.currentPage < TOTAL_PAGES) {
                actions.loadPage(state.currentPage + 1);
            } else if (e.key === 'ArrowRight' && state.currentPage > 1) {
                actions.loadPage(state.currentPage - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actions, state.currentPage]);

    // ─── التنقل بالسحب (Swipe) ───
    const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX.current;
        const diffY = Math.abs(touchEndY - touchStartY.current);

        if (Math.abs(diffX) > 50 && diffY < 100) {
            if (diffX > 0 && state.currentPage > 1) {
                actions.loadPage(state.currentPage - 1);
            } else if (diffX < 0 && state.currentPage < TOTAL_PAGES) {
                actions.loadPage(state.currentPage + 1);
            }
        }
    };

    // ─── أزرار التحكم ───
    const handleHint = () => {
        if (currentIndex < allWords.length) {
            setWordStates(prev => {
                const newStates = [...prev];
                if (newStates[currentIndex] === AyahWordState.Hinted) {
                    newStates[currentIndex] = AyahWordState.Hidden;
                } else {
                    newStates[currentIndex] = AyahWordState.Hinted;
                }
                return newStates;
            });
        }
    };

    const handleSkip = () => {
        if (currentIndex < allWords.length) {
            setWordStates(prev => {
                const newStates = [...prev];
                newStates[currentIndex] = AyahWordState.Skipped;
                return newStates;
            });
            // ملاحظة: الـ currentIndex يُدار من الـ hook
            // لكن نحتاج لطريقة لتخطي الكلمة - نستدعي onWordMatch كبديل
            handleWordMatch(currentIndex);
        }
    };

    const handleRevealAyah = () => {
        const verses = [...(state.pageData.right || []), ...(state.pageData.left || [])];
        if (verses.length === 0) return;

        let wordCounter = 0;

        for (const verse of verses) {
            const verseWordCount = verse.words.filter(w => w.char_type_name === 'word').length;
            if (currentIndex >= wordCounter && currentIndex < wordCounter + verseWordCount) {
                const firstWordOfVerseIndex = wordCounter;
                const isAlreadyRevealed = wordStates[firstWordOfVerseIndex] === AyahWordState.Revealed;

                setWordStates(prev => {
                    const newStates = [...prev];
                    for (let i = 0; i < verseWordCount; i++) {
                        const indexToUpdate = wordCounter + i;
                        if (indexToUpdate < newStates.length) {
                            newStates[indexToUpdate] = isAlreadyRevealed ? AyahWordState.Hidden : AyahWordState.Revealed;
                        }
                    }
                    return newStates;
                });
                break;
            }
            wordCounter += verseWordCount;
        }
    };

    const handleReset = () => {
        resetIndex();
        setWordStates(allWords.map(() => AyahWordState.Hidden));
    };

    // ─── حساب التقدم ───
    let globalWordCounter = 0;
    const surah = state.pageData?.right?.[0] || state.pageData?.left?.[0] ? state.surahs.find(s => s.id === (state.pageData.right?.[0] || state.pageData.left?.[0])!.chapter_id) : null;

    const correctWords = wordStates.filter(s => s === AyahWordState.Correct || s === AyahWordState.Skipped || s === AyahWordState.Revealed).length;
    const progress = allWords.length > 0 ? (correctWords / allWords.length) * 100 : 0;

    // ─────────────────────────────────────────────────────────────────
    // العرض (Render)
    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full w-full bg-bg-secondary">
            {/* ═══ الهيدر ═══ */}
            <header className="bg-bg-primary border-b border-border shadow-sm z-10 shrink-0">
                <div
                    className="flex items-center justify-between px-4 pb-3"
                    style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0rem))' }}
                >
                    <div className="flex items-center gap-2">
                        <button onClick={() => actions.setReadingMode(ReadingMode.Reading)} className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors">
                            <i className="fas fa-arrow-right text-lg"></i>
                        </button>
                        <div className="flex items-center gap-1 text-amber-500">
                            <i className="fas fa-star"></i>
                            <span className="font-bold text-sm">{state.memorizationStats.points}</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-center text-text-primary">وضع التحفيظ</h1>
                        <p className="text-xs text-center text-text-secondary">{surah?.name_arabic} - صفحة {state.currentPage}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-red-500">
                            <i className="fas fa-fire"></i>
                            <span className="font-bold text-sm">{state.memorizationStats.streak}</span>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center text-lg">
                            {isLoading ? (
                                <i className="fas fa-spinner fa-spin text-primary"></i>
                            ) : isListening ? (
                                <i className="fas fa-microphone text-primary animate-pulse"></i>
                            ) : (
                                <i className="fas fa-microphone-slash text-red-500"></i>
                            )}
                        </div>
                    </div>
                </div>
                {/* شريط التقدم */}
                <div className="w-full bg-bg-tertiary h-1.5">
                    <div
                        className="bg-primary h-1.5 rounded-r-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </header>

            {/* ═══ المحتوى الرئيسي - النص القرآني ═══ */}
            <main
                className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className={`font-noto text-right`} style={{ fontSize: `${state.fontSize + 2}px`, lineHeight: 3 }}>
                    {[...(state.pageData.right || []), ...(state.pageData.left || [])].map(verse => (
                        <React.Fragment key={verse.verse_key}>
                            {verse.words.filter(w => w.char_type_name === 'word').map((word) => {
                                const myIndex = globalWordCounter;
                                globalWordCounter++;
                                return <WordComponent
                                    key={`${word.id}-${myIndex}`}
                                    word={word}
                                    wordState={wordStates[myIndex] || AyahWordState.Hidden}
                                    isCurrent={myIndex === currentIndex && isListening}
                                />;
                            })}
                            <span className="verse-number inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary text-sm rounded-full font-ui mx-1 select-none">
                                {new Intl.NumberFormat('ar-EG').format(verse.verse_number)}
                            </span>
                        </React.Fragment>
                    ))}
                </div>
            </main>

            {/* ═══ شريط الأدوات السفلي ═══ */}
            <footer
                className="bg-bg-primary border-t border-border pt-3 px-3 shrink-0"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0rem))' }}
            >
                <div className="flex justify-center items-center gap-2">
                    <button onClick={handleHint} className="flex flex-col items-center p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary w-20">
                        <i className="fas fa-lightbulb text-xl mb-1"></i>
                        <span className="text-xs">تلميح</span>
                    </button>
                    <button onClick={handleSkip} className="flex flex-col items-center p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary w-20">
                        <i className="fas fa-forward-step text-xl mb-1"></i>
                        <span className="text-xs">تخطي</span>
                    </button>
                    <button onClick={isListening ? stopListening : startListening} className={`mx-2 w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-dark'}`}>
                        <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} text-2xl`}></i>
                    </button>
                    <button onClick={handleRevealAyah} className="flex flex-col items-center p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary w-20">
                        <i className="fas fa-eye text-xl mb-1"></i>
                        <span className="text-xs">كشف</span>
                    </button>
                    <button onClick={handleReset} className="flex flex-col items-center p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary w-20">
                        <i className="fas fa-undo text-xl mb-1"></i>
                        <span className="text-xs">إعادة</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MemorizationInterface;
