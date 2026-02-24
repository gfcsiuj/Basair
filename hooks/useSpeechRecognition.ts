/**
 * useSpeechRecognition - Hook للتعرف على الكلام باستخدام Web Speech API
 * 
 * يستخدم webkitSpeechRecognition المدمج في المتصفح للتعرف على الكلام العربي
 * بدقة عالية وبدون تأخير (بدلاً من Wit.ai)
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { normalizeArabicText, fuzzyMatchWords } from '../utils/textUtils';

// التحقق من دعم المتصفح
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface UseSpeechRecognitionOptions {
    expectedWords: string[];
    onWordMatch?: (index: number) => void;
    onWordMismatch?: (index: number) => void;
}

interface UseSpeechRecognitionReturn {
    currentIndex: number;
    isListening: boolean;
    isLoading: boolean;
    isSupported: boolean;
    start: () => void;
    stop: () => void;
    resetIndex: () => void;
}

export const useSpeechRecognition = ({
    expectedWords,
    onWordMatch,
    onWordMismatch,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentIndexRef = useRef(0);
    const expectedWordsRef = useRef(expectedWords);
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false);
    const shouldRestartRef = useRef(false);
    const lastProcessedRef = useRef('');

    const isSupported = !!SpeechRecognitionAPI;

    useEffect(() => { expectedWordsRef.current = expectedWords; }, [expectedWords]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    /**
     * معالجة الكلمات المتعرف عليها ومقارنتها بالمتوقعة
     */
    const processWords = useCallback((transcript: string, isFinal: boolean) => {
        const words = transcript.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return;

        const localIndex = currentIndexRef.current;
        const localExpected = expectedWordsRef.current;

        if (localIndex >= localExpected.length) return;

        // تجنب معالجة نفس النص مرتين
        const key = `${localIndex}:${transcript}`;
        if (key === lastProcessedRef.current && !isFinal) return;
        if (isFinal) lastProcessedRef.current = key;

        let matchedCount = 0;

        for (const spokenWord of words) {
            const targetIndex = localIndex + matchedCount;
            if (targetIndex >= localExpected.length) break;

            const expectedWord = localExpected[targetIndex];
            const isMatch = fuzzyMatchWords(spokenWord, expectedWord, 0.5);

            if (isMatch) {
                matchedCount++;
                onWordMatch?.(targetIndex);
            } else {
                // بحث في نافذة أوسع (6 كلمات)
                let foundAhead = false;
                const window = Math.min(6, localExpected.length - targetIndex);
                for (let off = 1; off < window; off++) {
                    if (fuzzyMatchWords(spokenWord, localExpected[targetIndex + off], 0.5)) {
                        // تعليم الكلمات المتخطاة
                        for (let s = 0; s < off; s++) {
                            onWordMatch?.(targetIndex + s);
                        }
                        matchedCount += off + 1;
                        foundAhead = true;
                        break;
                    }
                }
                if (!foundAhead && isFinal) {
                    onWordMismatch?.(targetIndex);
                }
            }
        }

        if (matchedCount > 0) {
            setCurrentIndex(prev => {
                const newIndex = localIndex + matchedCount;
                return Math.max(prev, newIndex);
            });
        }
    }, [onWordMatch, onWordMismatch]);

    /**
     * إنشاء وتهيئة كائن التعرف على الكلام
     */
    const createRecognition = useCallback(() => {
        if (!SpeechRecognitionAPI) return null;

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;

        recognition.onresult = (event: any) => {
            setIsLoading(false);

            // معالجة كل النتائج الجديدة
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const isFinal = result.isFinal;

                // تجربة كل البدائل
                for (let alt = 0; alt < result.length; alt++) {
                    const transcript = result[alt].transcript;
                    if (transcript.trim()) {
                        processWords(transcript, isFinal);
                    }
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error);
            setIsLoading(false);

            // إعادة التشغيل تلقائياً عند أخطاء مؤقتة
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                if (shouldRestartRef.current) {
                    setTimeout(() => {
                        if (shouldRestartRef.current) {
                            try { recognition.start(); } catch { }
                        }
                    }, 300);
                }
            }
        };

        recognition.onend = () => {
            // إعادة التشغيل تلقائياً إذا لم يتم الإيقاف يدوياً
            if (shouldRestartRef.current) {
                setIsLoading(true);
                setTimeout(() => {
                    if (shouldRestartRef.current && recognitionRef.current) {
                        try {
                            recognitionRef.current.start();
                        } catch {
                            // قد يكون قيد التشغيل بالفعل
                        }
                    }
                }, 100);
            } else {
                setIsListening(false);
                setIsLoading(false);
            }
        };

        recognition.onstart = () => {
            setIsListening(true);
            setIsLoading(false);
        };

        return recognition;
    }, [processWords]);

    const start = useCallback(() => {
        if (!SpeechRecognitionAPI) {
            console.error('Web Speech API is not supported in this browser');
            return;
        }

        if (isListeningRef.current) return;

        shouldRestartRef.current = true;
        isListeningRef.current = true;
        lastProcessedRef.current = '';

        const recognition = createRecognition();
        if (!recognition) return;

        recognitionRef.current = recognition;
        setIsLoading(true);

        try {
            recognition.start();
        } catch (e) {
            console.error('Failed to start speech recognition:', e);
            shouldRestartRef.current = false;
            isListeningRef.current = false;
            setIsLoading(false);
        }
    }, [createRecognition]);

    const stop = useCallback(() => {
        shouldRestartRef.current = false;
        isListeningRef.current = false;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch { }
            recognitionRef.current = null;
        }

        setIsListening(false);
        setIsLoading(false);
    }, []);

    const resetIndex = useCallback(() => {
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        lastProcessedRef.current = '';
    }, []);

    // تنظيف عند إزالة المكون
    useEffect(() => {
        return () => { stop(); };
    }, [stop]);

    return {
        currentIndex,
        isListening,
        isLoading,
        isSupported,
        start,
        stop,
        resetIndex,
    };
};
