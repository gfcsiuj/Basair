/**
 * useWitAiTracker - Custom Hook للتسميع الصوتي باستخدام Wit.ai
 * 
 * يسجل صوت المستخدم عبر AudioContext (PCM مباشر) ويرسل مقاطع WAV كل ~4 ثوانٍ
 * إلى Wit.ai API للتعرف على الكلام العربي، ثم يقارن النتائج مع الكلمات المتوقعة.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { normalizeArabicText, fuzzyMatchWords } from '../utils/textUtils';

// توكن Wit.ai من متغيرات البيئة
const WIT_AI_TOKEN = import.meta.env.VITE_WIT_AI_TOKEN as string;

// مدة كل مقطع صوتي بالمللي ثانية (4 ثوانٍ)
const CHUNK_INTERVAL_MS = 4000;

// معدل العينات المطلوب
const SAMPLE_RATE = 16000;

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
 * تحويل عينات Float32 إلى ملف WAV (Blob)
 */
const encodeWAV = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);       // sub-chunk size
    view.setUint16(20, 1, true);        // PCM format
    view.setUint16(22, 1, true);        // mono
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true);        // block align
    view.setUint16(34, 16, true);       // bits per sample

    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
};

/**
 * تقليل معدل العينات (downsample) من معدل المصدر إلى المعدل المطلوب
 */
const downsample = (buffer: Float32Array, inputRate: number, outputRate: number): Float32Array => {
    if (inputRate === outputRate) return buffer;
    if (inputRate < outputRate) throw new Error('Input rate must be >= output rate');

    const ratio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
        const index = Math.round(i * ratio);
        result[i] = buffer[Math.min(index, buffer.length - 1)];
    }

    return result;
};

/**
 * إرسال مقطع WAV إلى Wit.ai واستقبال النص
 */
const transcribeWithWitAi = async (wavBlob: Blob): Promise<string> => {
    const response = await fetch('https://api.wit.ai/speech?v=20240101', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WIT_AI_TOKEN}`,
            'Content-Type': 'audio/wav',
        },
        body: wavBlob,
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('Wit.ai API error:', response.status, response.statusText, errorBody);
        return '';
    }

    // Wit.ai /speech endpoint يرجع استجابة NDJSON (سطور JSON متعددة)
    const responseText = await response.text();
    const lines = responseText.trim().split('\n').filter(Boolean);

    let finalText = '';
    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);
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

    // refs لتجنب re-renders
    const currentIndexRef = useRef(0);
    const expectedWordsRef = useRef(expectedWords);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const pcmBufferRef = useRef<Float32Array[]>([]);
    const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isListeningRef = useRef(false);
    const isSendingRef = useRef(false);

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

        for (const spokenWord of spokenWords) {
            const targetIndex = localIndex + matchedCount;
            if (targetIndex >= localExpected.length) break;

            const expectedWord = localExpected[targetIndex];

            if (fuzzyMatchWords(spokenWord, expectedWord)) {
                matchedCount++;
                onWordMatch?.(targetIndex);
            } else {
                // بحث في نافذة صغيرة للأمام
                let foundAhead = false;
                const searchWindow = Math.min(3, localExpected.length - targetIndex);
                for (let offset = 1; offset < searchWindow; offset++) {
                    if (fuzzyMatchWords(spokenWord, localExpected[targetIndex + offset])) {
                        matchedCount += offset + 1;
                        foundAhead = true;
                        break;
                    }
                }

                if (!foundAhead) {
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
        if (pcmBufferRef.current.length === 0 || isSendingRef.current) return;

        // تجميع كل المقاطع في مصفوفة واحدة
        const totalLength = pcmBufferRef.current.reduce((acc, buf) => acc + buf.length, 0);
        if (totalLength < 1000) return; // تجاهل المقاطع القصيرة جداً

        const combined = new Float32Array(totalLength);
        let offset = 0;
        for (const buf of pcmBufferRef.current) {
            combined.set(buf, offset);
            offset += buf.length;
        }
        pcmBufferRef.current = [];

        isSendingRef.current = true;
        setIsLoading(true);
        try {
            // تقليل معدل العينات إلى 16000 Hz
            const inputSampleRate = audioContextRef.current?.sampleRate || 44100;
            const downsampled = downsample(combined, inputSampleRate, SAMPLE_RATE);
            const wavBlob = encodeWAV(downsampled, SAMPLE_RATE);

            console.log(`📤 إرسال ${(wavBlob.size / 1024).toFixed(1)} KB WAV إلى Wit.ai`);

            const text = await transcribeWithWitAi(wavBlob);
            if (text) {
                console.log('📝 Wit.ai:', text);
                processTranscription(text);
            }
        } catch (error) {
            console.error('Error transcribing with Wit.ai:', error);
        } finally {
            isSendingRef.current = false;
            setIsLoading(false);
        }
    }, [processTranscription]);

    /**
     * بدء الاستماع وتسجيل الصوت عبر AudioContext (PCM مباشر)
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
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
            mediaStreamRef.current = stream;

            // إنشاء AudioContext لالتقاط PCM مباشرة
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);

            // ScriptProcessorNode لالتقاط العينات الخام
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e: AudioProcessingEvent) => {
                if (!isListeningRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                // نسخ البيانات لأنها ستتغير
                pcmBufferRef.current.push(new Float32Array(inputData));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            // إرسال المقاطع المجمّعة كل CHUNK_INTERVAL_MS
            chunkTimerRef.current = setInterval(() => {
                if (isListeningRef.current && pcmBufferRef.current.length > 0) {
                    sendChunkToWitAi();
                }
            }, CHUNK_INTERVAL_MS);

            isListeningRef.current = true;
            setIsListening(true);

            console.log('🎤 بدأ الاستماع عبر Wit.ai (PCM مباشر)');
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

        // إرسال آخر مقطع
        if (pcmBufferRef.current.length > 0) {
            sendChunkToWitAi();
        }

        // إيقاف المعالج
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // إغلاق AudioContext
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }

        // إيقاف جميع المسارات الصوتية
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        // تنظيف البفر
        pcmBufferRef.current = [];

        console.log('🔇 توقف الاستماع');
    }, [sendChunkToWitAi]);

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
