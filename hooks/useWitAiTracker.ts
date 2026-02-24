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
    expectedWords: string[];
    onWordMatch?: (index: number) => void;
    onWordMismatch?: (index: number) => void;
}

interface UseWitAiTrackerReturn {
    currentIndex: number;
    isListening: boolean;
    isLoading: boolean;
    start: () => Promise<void>;
    stop: () => void;
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

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
};

/**
 * تقليل معدل العينات (downsample)
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
 * إرسال مقطع WAV إلى Wit.ai واستقبال الكلمات المتعرف عليها
 * يرجع مصفوفة من الكلمات (tokens) بدلاً من نص واحد لأنها أدق
 */
const transcribeWithWitAi = async (wavBlob: Blob): Promise<string[]> => {
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
        return [];
    }

    const responseText = await response.text();
    const lines = responseText.trim().split('\n').filter(Boolean);

    let finalTokens: string[] = [];
    let finalText = '';

    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);

            // استخراج الكلمات من مصفوفة tokens (أدق من حقل text)
            if (parsed.speech?.tokens && Array.isArray(parsed.speech.tokens)) {
                finalTokens = parsed.speech.tokens
                    .map((t: any) => t.token as string)
                    .filter(Boolean);
            }

            if (parsed.text) {
                finalText = parsed.text;
            }
        } catch {
            // تجاهل الأسطر غير الصالحة
        }
    }

    // استخدام tokens إذا متاحة، وإلا تقسيم النص
    const result = finalTokens.length > 0
        ? finalTokens
        : finalText.split(/\s+/).filter(Boolean);

    console.log('📝 Wit.ai recognized words:', result);
    return result;
};

export const useWitAiTracker = ({
    expectedWords,
    onWordMatch,
    onWordMismatch,
}: UseWitAiTrackerOptions): UseWitAiTrackerReturn => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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
     * معالجة الكلمات المستلمة من Wit.ai ومقارنتها بالكلمات المتوقعة
     */
    const processTranscription = useCallback((spokenWords: string[]) => {
        if (spokenWords.length === 0) return;

        const localIndex = currentIndexRef.current;
        const localExpected = expectedWordsRef.current;

        console.log('🎯 Processing:', { spokenWords, localIndex, totalExpected: localExpected.length });
        console.log('🎯 Next expected words:', localExpected.slice(localIndex, localIndex + 5));

        if (localIndex >= localExpected.length) {
            console.log('✅ All words matched!');
            return;
        }

        let matchedCount = 0;

        for (const spokenWord of spokenWords) {
            const targetIndex = localIndex + matchedCount;
            if (targetIndex >= localExpected.length) break;

            const expectedWord = localExpected[targetIndex];
            // حد مطابقة أقل (60%) لأن Wit.ai ليس دقيقاً 100% مع النص القرآني
            const isMatch = fuzzyMatchWords(spokenWord, expectedWord, 0.6);

            console.log(`🔄 Comparing: "${spokenWord}" vs "${expectedWord}" => ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);

            if (isMatch) {
                matchedCount++;
                onWordMatch?.(targetIndex);
            } else {
                // بحث في نافذة أوسع للأمام (5 كلمات)
                let foundAhead = false;
                const searchWindow = Math.min(5, localExpected.length - targetIndex);
                for (let offset = 1; offset < searchWindow; offset++) {
                    if (fuzzyMatchWords(spokenWord, localExpected[targetIndex + offset], 0.6)) {
                        console.log(`🔄 Found ahead at offset ${offset}: "${localExpected[targetIndex + offset]}"`);
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

        console.log(`📊 Total matched: ${matchedCount}`);
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

        const totalLength = pcmBufferRef.current.reduce((acc, buf) => acc + buf.length, 0);
        if (totalLength < 1000) return;

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
            const inputSampleRate = audioContextRef.current?.sampleRate || 44100;
            const downsampled = downsample(combined, inputSampleRate, SAMPLE_RATE);
            const wavBlob = encodeWAV(downsampled, SAMPLE_RATE);

            console.log(`📤 إرسال ${(wavBlob.size / 1024).toFixed(1)} KB WAV إلى Wit.ai`);

            const words = await transcribeWithWitAi(wavBlob);
            if (words.length > 0) {
                processTranscription(words);
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

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e: AudioProcessingEvent) => {
                if (!isListeningRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                pcmBufferRef.current.push(new Float32Array(inputData));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

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

        if (chunkTimerRef.current) {
            clearInterval(chunkTimerRef.current);
            chunkTimerRef.current = null;
        }

        if (pcmBufferRef.current.length > 0) {
            sendChunkToWitAi();
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        pcmBufferRef.current = [];

        console.log('🔇 توقف الاستماع');
    }, [sendChunkToWitAi]);

    const resetIndex = useCallback(() => {
        setCurrentIndex(0);
        currentIndexRef.current = 0;
    }, []);

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
