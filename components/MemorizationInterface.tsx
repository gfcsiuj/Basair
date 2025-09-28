import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { ReadingMode, AyahWordState, Verse, Word } from '../types';
import { Modality, Blob, LiveServerMessage } from '@google/genai';
import { TOTAL_PAGES } from '../constants';

// Helper functions for audio encoding as per Gemini API guidelines
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Levenshtein distance function for fuzzy string matching
const levenshteinDistance = (a: string = '', b: string = ''): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,        // deletion
                matrix[j - 1][i] + 1,        // insertion
                matrix[j - 1][i - 1] + cost  // substitution
            );
        }
    }
    return matrix[b.length][a.length];
};

// Memoized Word component for performance
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


const MemorizationInterface: React.FC = () => {
    const { state, actions } = useApp();
    const [wordStates, setWordStates] = useState<AyahWordState[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const transcriptBufferRef = useRef('');
    const processTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    const allWords = useMemo(() => 
        state.pageData?.flatMap(verse => 
            verse.words.filter(w => w.char_type_name === 'word')
        ) || [], 
    [state.pageData]);
    
    // Using refs to hold state for stable callbacks
    const allWordsRef = useRef(allWords);
    const currentWordIndexRef = useRef(currentWordIndex);
    const wordStatesRef = useRef(wordStates);
    const isListeningRef = useRef(isListening);

    useEffect(() => { allWordsRef.current = allWords; }, [allWords]);
    useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);
    useEffect(() => { wordStatesRef.current = wordStates; }, [wordStates]);
    useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

    const normalizeText = (text: string) => {
        if (!text) return '';
        return text
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Remove diacritics
            .replace(/[أإآ]/g, 'ا') // Normalize alef
            .replace(/ة/g, 'ه') // Normalize teh marbuta
            .replace(/ى/g, 'ي') // Normalize alef maksura
            .trim();
    };

    const processBufferedTranscript = useCallback(() => {
        const transcript = transcriptBufferRef.current.trim();
        transcriptBufferRef.current = '';
        if (!transcript) return;

        const spokenWords = transcript.split(/\s+/).filter(Boolean).map(normalizeText);
        if (spokenWords.length === 0) return;

        const localCurrentIndex = currentWordIndexRef.current;
        const localAllWords = allWordsRef.current;
        let newStates = [...wordStatesRef.current];

        let bestSequence = { startIndex: -1, length: 0, score: Infinity };

        const searchWindowStart = Math.max(0, localCurrentIndex - 1); 
        const searchWindowEnd = Math.min(localAllWords.length, localCurrentIndex + 10);

        for (let i = searchWindowStart; i < searchWindowEnd; i++) {
            for (let j = 0; j < spokenWords.length; j++) {
                const expectedWord = normalizeText(localAllWords[i]?.text_uthmani);
                if (!expectedWord) continue;

                const distance = levenshteinDistance(spokenWords[j], expectedWord);
                const len = Math.max(spokenWords[j].length, expectedWord.length);
                const threshold = (len <= 2) ? 0 : (len <= 5) ? 1 : Math.floor(len * 0.4);

                if (distance <= threshold) {
                    const score = distance / len; 
                    if (score < bestSequence.score) {
                        bestSequence = { startIndex: i, length: 1, score };
                    }
                }
            }
        }
        
        if (bestSequence.startIndex !== -1) {
            const { startIndex } = bestSequence;
            
            if (startIndex > localCurrentIndex) {
                 for(let i = localCurrentIndex; i < startIndex; i++) {
                     if (i < newStates.length) newStates[i] = AyahWordState.Skipped;
                 }
            }
            if (startIndex < newStates.length) newStates[startIndex] = AyahWordState.Correct;

            setWordStates(newStates);
            
            const newIndex = startIndex + 1;
            if (newIndex > localCurrentIndex) {
                 setCurrentWordIndex(newIndex);
            }
        } else {
            if (localCurrentIndex < newStates.length) {
                newStates[localCurrentIndex] = AyahWordState.Incorrect;
                setWordStates(newStates);
                setTimeout(() => {
                    setWordStates(prev => {
                        const restoredState = [...prev];
                        if (currentWordIndexRef.current < restoredState.length && restoredState[currentWordIndexRef.current] === AyahWordState.Incorrect) {
                            restoredState[currentWordIndexRef.current] = AyahWordState.Hidden;
                        }
                        return restoredState;
                    });
                }, 800);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (!isListeningRef.current) return;
        setIsListening(false);

        if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
        processTimeoutRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        
        if (scriptProcessorRef.current && sourceNodeRef.current) {
            try {
                sourceNodeRef.current.disconnect();
                scriptProcessorRef.current.disconnect();
            } catch(e) { console.warn("Error disconnecting audio nodes:", e)}
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(console.error);
            sessionPromiseRef.current = null;
        }

        scriptProcessorRef.current = null;
        sourceNodeRef.current = null;
        audioContextRef.current = null;
        mediaStreamRef.current = null;
        console.log("Stopped Listening.");
    }, []);

    const startListening = useCallback(async () => {
      if (!state.ai || isListeningRef.current) return;
      
      setIsListening(true);
      console.log("Starting to listen...");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const inputAudioContext = new (window.AudioContext)({ sampleRate: 16000 });
        audioContextRef.current = inputAudioContext;
        const source = inputAudioContext.createMediaStreamSource(stream);
        sourceNodeRef.current = source;
        const scriptProcessor = inputAudioContext.createScriptProcessor(1024, 1, 1);
        scriptProcessorRef.current = scriptProcessor;

        sessionPromiseRef.current = state.ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
                console.log('Gemini Live session opened.');
            },
            onmessage: (message: LiveServerMessage) => {
              if (message.serverContent?.inputTranscription?.text) {
                transcriptBufferRef.current += message.serverContent.inputTranscription.text + ' ';
                if(processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
                processTimeoutRef.current = setTimeout(processBufferedTranscript, 200);
              }
              // Acknowledge model's audio output per API guidelines.
              if (message.serverContent?.modelTurn?.parts[0]?.inlineData.data) {}
            },
            onerror: (e: ErrorEvent) => {
                console.error('Gemini Live error:', e);
                stopListening();
            },
            onclose: (e: CloseEvent) => {
                console.log('Gemini Live session closed.');
                 // Only set isListening to false if it was not intentionally stopped.
                if (isListeningRef.current) {
                    setIsListening(false);
                }
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            systemInstruction: 'مهمتك هي أن تكون "محرك تعرف صوتي قرآني فوري". استجابتك يجب أن تكون لحظية، لا تنتظر الصمت. حوّل التلاوة إلى نص مكتوب بأقصى سرعة ممكنة. كن حساساً للغاية لأدق تفاصيل التجويد، ومخارج الحروف، وسرعات التلاوة المختلفة (الحدر). في نفس الوقت، كن متسامحاً تماماً مع غياب علامات الإعراب (التشكيل) — ركز على الحروف الأساسية للكلمة. إذا نطق القارئ "الحمدُ" أو "الحمدْ"، يجب أن تتعرف عليها ككلمة "الحمد". تجاهل بشكل كامل ومطلق أي ضوضاء في الخلفية أو سعال أو أي كلام ليس جزءاً من الآيات. الدقة والسرعة الفائقة هما مقياس نجاحك الأوحد.',
          },
        });

        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
            }).catch(e => { /* Session might be closing */ });
          }
        };

        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);

      } catch (err) {
        console.error("Error starting microphone:", err);
        stopListening();
      }
    }, [state.ai, processBufferedTranscript, stopListening]);
    
    // Effect to reset state and manage listening session when page data changes.
    useEffect(() => {
        stopListening();

        setWordStates(allWords.map(() => AyahWordState.Hidden));
        setCurrentWordIndex(0);
        transcriptBufferRef.current = '';

        const timer = setTimeout(() => {
             if (!isListeningRef.current) {
                startListening();
            }
        }, 500);
        
        return () => {
            clearTimeout(timer);
            stopListening();
        };
    }, [allWords, startListening, stopListening]);
    
    // Effect for automatic page turning upon completion.
    useEffect(() => {
        if (currentWordIndex > 0 && currentWordIndex === allWords.length && allWords.length > 0) {
            if (state.currentPage < TOTAL_PAGES) {
                const pageTurnTimeout = setTimeout(() => {
                    actions.loadPage(state.currentPage + 1);
                }, 1500);
                return () => clearTimeout(pageTurnTimeout);
            }
        }
    }, [currentWordIndex, allWords.length, state.currentPage, actions]);

    // Keyboard and Swipe navigation
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

    const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX.current;
        const diffY = Math.abs(touchEndY - touchStartY.current);

        if (Math.abs(diffX) > 50 && diffY < 100) { // Horizontal swipe
            if (diffX > 0 && state.currentPage > 1) { // Swipe right (previous page)
                actions.loadPage(state.currentPage - 1);
            } else if (diffX < 0 && state.currentPage < TOTAL_PAGES) { // Swipe left (next page)
                actions.loadPage(state.currentPage + 1);
            }
        }
    };


    const handleHint = () => {
        if(currentWordIndex < allWords.length) {
            setWordStates(prev => {
                const newStates = [...prev];
                // Toggle between Hinted and Hidden
                if (newStates[currentWordIndex] === AyahWordState.Hinted) {
                    newStates[currentWordIndex] = AyahWordState.Hidden;
                } else {
                    newStates[currentWordIndex] = AyahWordState.Hinted;
                }
                return newStates;
            });
        }
    };
    
    const handleSkip = () => {
        if(currentWordIndex < allWords.length) {
            setWordStates(prev => {
                const newStates = [...prev];
                newStates[currentWordIndex] = AyahWordState.Skipped;
                return newStates;
            });
            setCurrentWordIndex(prev => prev + 1);
        }
    };

    const handleRevealAyah = () => {
        if (!state.pageData) return;
        let wordCounter = 0;
        
        for (const verse of state.pageData) {
            const verseWordCount = verse.words.filter(w => w.char_type_name === 'word').length;
            if (currentWordIndex >= wordCounter && currentWordIndex < wordCounter + verseWordCount) {
                const firstWordOfVerseIndex = wordCounter;
                const isAlreadyRevealed = wordStates[firstWordOfVerseIndex] === AyahWordState.Revealed;

                setWordStates(prev => {
                    const newStates = [...prev];
                    for (let i = 0; i < verseWordCount; i++) {
                        const indexToUpdate = wordCounter + i;
                        if(indexToUpdate < newStates.length) {
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
    
    let globalWordCounter = 0;
    const surah = state.pageData?.[0] ? state.surahs.find(s => s.id === state.pageData[0].chapter_id) : null;
    
    const correctWords = wordStates.filter(s => s === AyahWordState.Correct || s === AyahWordState.Skipped || s === AyahWordState.Revealed).length;
    const progress = allWords.length > 0 ? (correctWords / allWords.length) * 100 : 0;

    return (
        <div className="flex flex-col h-full w-full bg-bg-secondary">
            <header className="bg-bg-primary border-b border-border shadow-sm z-10 shrink-0">
                <div 
                    className="flex items-center justify-between px-4 pb-3"
                    style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0rem))' }}
                >
                    <div className="flex items-center gap-2">
                        <button onClick={() => actions.setReadingMode(ReadingMode.Reading)} className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors">
                            <i className="fas fa-arrow-right text-lg"></i>
                        </button>
                        <button 
                            onClick={() => actions.loadPage(state.currentPage - 1)} 
                            disabled={state.currentPage <= 1}
                            aria-label="الصفحة السابقة"
                            className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-right text-lg"></i>
                        </button>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-center text-text-primary">وضع التحفيظ</h1>
                        <p className="text-xs text-center text-text-secondary">{surah?.name_arabic} - صفحة {state.currentPage}</p>
                    </div>
                     <div className="flex items-center gap-2">
                         <button 
                            onClick={() => actions.loadPage(state.currentPage + 1)} 
                            disabled={state.currentPage >= TOTAL_PAGES}
                            aria-label="الصفحة التالية"
                            className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-left text-lg"></i>
                        </button>
                        <div className="w-8 h-8 flex items-center justify-center text-lg">
                            {isListening ? <i className="fas fa-microphone text-primary"></i> : <i className="fas fa-microphone-slash text-red-500"></i>}
                        </div>
                     </div>
                </div>
                <div className="w-full bg-bg-tertiary h-1.5">
                    <div 
                        className="bg-primary h-1.5 rounded-r-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </header>

            <main 
                className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                 <div className={`font-arabic text-right`} style={{ fontSize: `${state.fontSize + 2}px`, lineHeight: 3 }}>
                    {state.pageData?.map(verse => (
                       <React.Fragment key={verse.verse_key}>
                           {verse.words.filter(w => w.char_type_name === 'word').map((word) => {
                               const myIndex = globalWordCounter;
                               globalWordCounter++;
                               return <WordComponent 
                                        key={`${word.id}-${myIndex}`}
                                        word={word} 
                                        wordState={wordStates[myIndex] || AyahWordState.Hidden}
                                        isCurrent={myIndex === currentWordIndex && isListening}
                                      />;
                           })}
                           <span className="verse-number inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary text-sm rounded-full font-ui mx-1 select-none">
                               {new Intl.NumberFormat('ar-EG').format(verse.verse_number)}
                           </span>
                       </React.Fragment>
                    ))}
                </div>
            </main>

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
                    <button onClick={() => {
                        setCurrentWordIndex(0);
                        setWordStates(allWords.map(() => AyahWordState.Hidden));
                    }} className="flex flex-col items-center p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary w-20">
                        <i className="fas fa-undo text-xl mb-1"></i>
                        <span className="text-xs">إعادة</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MemorizationInterface;