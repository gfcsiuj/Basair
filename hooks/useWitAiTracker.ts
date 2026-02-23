/**
 * useWitAiTracker - Custom Hook للتسميع الصوتي باستخدام Wit.ai
 * 
 * يسجل صوت المستخدم عبر MediaRecorder ويرسل مقاطع صوتية كل ~3 ثوانٍ
 * إلى Wit.ai API للتعرف على الكلام العربي، ثم يقارن النتائج مع الكلمات المتوقعة.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { normalizeArabicText, fuzzyMatchWords } from '../utils/textUtils';

// توكن Wit.ai من متغيرات البيئة
const WIT_AI_TOKEN = import.meta.env.VITE_WIT_AI_TOKEN as string;

// مدة كل مقطع صوتي بالمللي ثانية (3 ثوانٍ)
const CHUNK_INTERVAL_MS = 3000;

interface UseWitAiTrackerOptions {
    /** مصفوفة الكلمات المتوقعة (نص الآية مقسّم إلى كلمات) */
    expectedWords: string[];
    /** دالة يتم استدعاؤها عند تطابق كلمة (اختياري) */
    onWordMatch?: (index: number) => void;
    /** دالة يتم استدعاؤها عند عدم التطابق (اختياري) */
    onWordMismatch?: (index: number) => void;
}

interface UseWitAiTrackerReturn {
    /** الفهرس الحالي للكلمة التالية المتوقعة */
    currentIndex: number;
    /** هل الميكروفون نشط؟ */
    isListening: boolean;
    /** هل ننتظر رد من Wit.ai؟ */
    isLoading: boolean;
    /** بدء الاستماع */
    start: () => Promise<void>;
    /** إيقاف الاستماع */
    stop: () => void;
    /** إعادة تعيين الفهرس */
    resetIndex: () => void;
}

/**
 * إرسال مقطع صوتي إلى Wit.ai واستقبال النص
 */
const encodeWAV = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // 1 channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
};

const transcribeWithWitAi = async (audioBlob: Blob): Promise<string> => {
    // We strictly use audio/wav now to prevent 400 Bad Request from Wit.ai
    const response = await fetch('https://api.wit.ai/speech?v=20240101', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WIT_AI_TOKEN}`,
            'Content-Type': 'audio/wav',
        },
        body: audioBlob,
    });

    if (!response.ok) {
        console.error('Wit.ai API error:', response.status, response.statusText);
        return '';
    }

    // Wit.ai /speech endpoint يرجع استجابة NDJSON (سطور JSON متعددة)
    // نأخذ آخر سطر يحتوي على النص النهائي
    const responseText = await response.text();
    const lines = responseText.trim().split('\n').filter(Boolean);

    let finalText = '';
    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);
            // نأخذ النص النهائي (is_final: true) أو آخر نص متاح
            if (parsed.text) {
                finalText = parsed.text;
            }
        } catch {
            // تجاهل الأسطر غير الصالحة
        }
    }

    return finalText;
};

export const useWitAiTracker = ({
    expectedWords,
    onWordMatch,
    onWordMismatch,
}: UseWitAiTrackerOptions): UseWitAiTrackerReturn => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // استخدام refs لتجنب re-renders ولضمان استقرار الـ callbacks
    const currentIndexRef = useRef(0);
    const expectedWordsRef = useRef(expectedWords);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isListeningRef = useRef(false);

    // تحديث الـ refs عند تغيّر القيم
    useEffect(() => {
        expectedWordsRef.current = expectedWords;
    }, [expectedWords]);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    /**
     * معالجة النص المستلم من Wit.ai ومقارنته بالكلمات المتوقعة
     */
    const processTranscription = useCallback((transcribedText: string) => {
        if (!transcribedText.trim()) return;

        const spokenWords = transcribedText.split(/\s+/).filter(Boolean);
        const localIndex = currentIndexRef.current;
        const localExpected = expectedWordsRef.current;

        if (localIndex >= localExpected.length) return;

        let matchedCount = 0;

        // محاولة مطابقة الكلمات المنطوقة مع المتوقعة بالترتيب
        for (const spokenWord of spokenWords) {
            const targetIndex = localIndex + matchedCount;
            if (targetIndex >= localExpected.length) break;

            const expectedWord = localExpected[targetIndex];

            if (fuzzyMatchWords(spokenWord, expectedWord)) {
                matchedCount++;
                onWordMatch?.(targetIndex);
            } else {
                // محاولة البحث في نافذة صغيرة للأمام (تخطي كلمة أو كلمتين)
                let foundAhead = false;
                const searchWindow = Math.min(3, localExpected.length - targetIndex);
                for (let offset = 1; offset < searchWindow; offset++) {
                    if (fuzzyMatchWords(spokenWord, localExpected[targetIndex + offset])) {
                        // تخطي الكلمات المفقودة
                        matchedCount += offset + 1;
                        foundAhead = true;
                        break;
                    }
                }

                if (!foundAhead) {
                    // إذا لم يتم العثور على تطابق، نبلغ عن عدم التطابق
                    onWordMismatch?.(targetIndex);
                }
            }
        }

        if (matchedCount > 0) {
            const newIndex = localIndex + matchedCount;
            setCurrentIndex(newIndex);
        }
    }, [onWordMatch, onWordMismatch]);

    /**
     * إرسال المقطع الصوتي المجمّع إلى Wit.ai
     */
    const sendChunkToWitAi = useCallback(async () => {
        if (chunksRef.current.length === 0) return;

        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const rawBlob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        if (rawBlob.size < 1000) return;

        setIsLoading(true);
        try {
            // تحويل الملف إلى WAV لتجنب خطأ 400 من Wit.ai
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const arrayBuffer = await rawBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const wavBlob = encodeWAV(audioBuffer.getChannelData(0), audioBuffer.sampleRate);

            const text = await transcribeWithWitAi(wavBlob);
            if (text) {
                processTranscription(text);
            }
        } catch (error) {
            console.error('Error transcribing with Wit.ai:', error);
        } finally {
            setIsLoading(false);
        }
    }, [processTranscription]);

    /**
     * بدء الاستماع وتسجيل الصوت
     */
    const start = useCallback(async () => {
        if (isListeningRef.current) return;

        if (!WIT_AI_TOKEN || WIT_AI_TOKEN === 'YOUR_WIT_AI_TOKEN_HERE') {
            console.error('Wit.ai token is not configured. Please set VITE_WIT_AI_TOKEN in .env.local');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
            mediaStreamRef.current = stream;

            // تحديد نوع الملف الصوتي المدعوم
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : MediaRecorder.isTypeSupported('audio/mp4')
                        ? 'audio/mp4'
                        : '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;

            // جمع الـ chunks أثناء التسجيل
            recorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                // إرسال آخر مقطع عند التوقف
                if (chunksRef.current.length > 0) {
                    sendChunkToWitAi();
                }
            };

            // بدء التسجيل مع تقسيم البيانات كل ثانية لتجميع أسرع
            recorder.start(1000);

            // إرسال المقاطع المجمّعة كل CHUNK_INTERVAL_MS
            chunkTimerRef.current = setInterval(() => {
                if (chunksRef.current.length > 0 && isListeningRef.current) {
                    // إيقاف مؤقت وإعادة تشغيل لفصل المقاطع
                    if (mediaRecorderRef.current?.state === 'recording') {
                        mediaRecorderRef.current.stop();
                        // إعادة التشغيل بعد فترة قصيرة للسماح بمعالجة المقطع
                        setTimeout(() => {
                            if (isListeningRef.current && mediaRecorderRef.current && mediaStreamRef.current) {
                                try {
                                    mediaRecorderRef.current.start(1000);
                                } catch {
                                    // قد يكون الـ stream قد أُغلق
                                }
                            }
                        }, 100);
                    }
                }
            }, CHUNK_INTERVAL_MS);

            isListeningRef.current = true;
            setIsListening(true);

            console.log('🎤 بدأ الاستماع عبر Wit.ai');
        } catch (error) {
            console.error('خطأ في الوصول إلى الميكروفون:', error);
            isListeningRef.current = false;
            setIsListening(false);
        }
    }, [sendChunkToWitAi]);

    /**
     * إيقاف الاستماع وتنظيف الموارد
     */
    const stop = useCallback(() => {
        if (!isListeningRef.current) return;

        isListeningRef.current = false;
        setIsListening(false);

        // إيقاف المؤقت
        if (chunkTimerRef.current) {
            clearInterval(chunkTimerRef.current);
            chunkTimerRef.current = null;
        }

        // إيقاف التسجيل
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch {
                // تجاهل الخطأ إذا كان التسجيل قد توقف بالفعل
            }
        }
        mediaRecorderRef.current = null;

        // إيقاف جميع المسارات الصوتية
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        // تنظيف المقاطع
        chunksRef.current = [];

        console.log('🔇 توقف الاستماع');
    }, []);

    /**
     * إعادة تعيين الفهرس
     */
    const resetIndex = useCallback(() => {
        setCurrentIndex(0);
        currentIndexRef.current = 0;
    }, []);

    // تنظيف عند إزالة المكون
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return {
        currentIndex,
        isListening,
        isLoading,
        start,
        stop,
        resetIndex,
    };
};
