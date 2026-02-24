/**
 * useWitAiTracker - Custom Hook للتسميع الصوتي باستخدام Wit.ai
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { fuzzyMatchWords } from '../utils/textUtils';

const WIT_AI_TOKEN = import.meta.env.VITE_WIT_AI_TOKEN as string;
const CHUNK_INTERVAL_MS = 4000;
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

const encodeWAV = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    w(8, 'WAVE'); w(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    w(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    let off = 44;
    for (let i = 0; i < samples.length; i++, off += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([view], { type: 'audio/wav' });
};

const downsample = (buf: Float32Array, inRate: number, outRate: number): Float32Array => {
    if (inRate === outRate) return buf;
    const ratio = inRate / outRate;
    const len = Math.round(buf.length / ratio);
    const res = new Float32Array(len);
    for (let i = 0; i < len; i++) res[i] = buf[Math.min(Math.round(i * ratio), buf.length - 1)];
    return res;
};

/**
 * قراءة استجابة Wit.ai بالكامل (تدعم الاستجابات المتدفقة chunked)
 */
const readFullResponse = async (response: Response): Promise<string> => {
    // Try reading with the stream reader for chunked responses
    const reader = response.body?.getReader();
    if (!reader) {
        return await response.text();
    }

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
    }
    // Flush decoder
    fullText += decoder.decode();

    return fullText;
};

/**
 * تحليل استجابة Wit.ai واستخراج الكلمات
 */
const extractWordsFromResponse = (responseText: string): string[] => {
    console.log('🔍 Raw response length:', responseText.length);
    console.log('🔍 Raw response:', responseText.substring(0, 500));

    // البحث عن كل كائنات JSON في النص (قد تكون متعددة أو واحدة)
    const jsonObjects: any[] = [];

    // محاولة 1: JSON واحد كامل
    try {
        const parsed = JSON.parse(responseText);
        jsonObjects.push(parsed);
    } catch {
        // محاولة 2: NDJSON - أسطر JSON متعددة
        // نبحث عن كائنات JSON كاملة باستخدام عداد الأقواس
        let depth = 0;
        let start = -1;

        for (let i = 0; i < responseText.length; i++) {
            const ch = responseText[i];
            if (ch === '{') {
                if (depth === 0) start = i;
                depth++;
            } else if (ch === '}') {
                depth--;
                if (depth === 0 && start !== -1) {
                    try {
                        const obj = JSON.parse(responseText.substring(start, i + 1));
                        jsonObjects.push(obj);
                    } catch {
                        // skip
                    }
                    start = -1;
                }
            }
        }
    }

    console.log('🔍 Found JSON objects:', jsonObjects.length);

    let bestTokens: string[] = [];
    let bestText = '';

    for (const obj of jsonObjects) {
        // البحث عن tokens في كل المسارات الممكنة
        const tokensArray = obj.tokens
            || obj.speech?.tokens
            || obj.audio?.tokens
            || null;

        if (tokensArray && Array.isArray(tokensArray)) {
            const extracted = tokensArray
                .map((t: any) => (t.token || t.value || t.text || '') as string)
                .filter(Boolean);
            if (extracted.length > bestTokens.length) {
                bestTokens = extracted;
            }
        }

        if (obj.text && obj.text.length > bestText.length) {
            bestText = obj.text;
        }
    }

    console.log('🔍 Best tokens:', bestTokens, 'Best text:', bestText);

    // استخدام tokens إذا متاحة، وإلا تقسيم النص
    const result = bestTokens.length > 0 ? bestTokens : bestText.split(/\s+/).filter(Boolean);
    console.log('📝 Final words:', result);
    return result;
};

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
        const err = await response.text().catch(() => '');
        console.error('Wit.ai API error:', response.status, err);
        return [];
    }

    // قراءة الاستجابة بالكامل (بما في ذلك الـ chunks)
    const responseText = await readFullResponse(response);
    return extractWordsFromResponse(responseText);
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

    useEffect(() => { expectedWordsRef.current = expectedWords; }, [expectedWords]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    const processTranscription = useCallback((spokenWords: string[]) => {
        if (spokenWords.length === 0) return;

        const localIndex = currentIndexRef.current;
        const localExpected = expectedWordsRef.current;

        console.log('🎯 Processing:', { spokenWords, localIndex, totalExpected: localExpected.length });
        console.log('🎯 Next expected:', localExpected.slice(localIndex, localIndex + 5));

        if (localIndex >= localExpected.length) {
            console.log('✅ All words matched!');
            return;
        }

        let matchedCount = 0;

        for (const spokenWord of spokenWords) {
            const targetIndex = localIndex + matchedCount;
            if (targetIndex >= localExpected.length) break;

            const expectedWord = localExpected[targetIndex];
            const isMatch = fuzzyMatchWords(spokenWord, expectedWord, 0.5);

            console.log(`🔄 "${spokenWord}" vs "${expectedWord}" => ${isMatch ? '✅' : '❌'}`);

            if (isMatch) {
                matchedCount++;
                onWordMatch?.(targetIndex);
            } else {
                let foundAhead = false;
                const searchWin = Math.min(6, localExpected.length - targetIndex);
                for (let off = 1; off < searchWin; off++) {
                    if (fuzzyMatchWords(spokenWord, localExpected[targetIndex + off], 0.5)) {
                        console.log(`🔄 Found at +${off}: "${localExpected[targetIndex + off]}"`);
                        for (let s = 0; s < off; s++) {
                            onWordMatch?.(targetIndex + s);
                        }
                        matchedCount += off + 1;
                        foundAhead = true;
                        break;
                    }
                }
                if (!foundAhead) onWordMismatch?.(targetIndex);
            }
        }

        console.log(`📊 Matched: ${matchedCount}`);
        if (matchedCount > 0) setCurrentIndex(localIndex + matchedCount);
    }, [onWordMatch, onWordMismatch]);

    const sendChunkToWitAi = useCallback(async () => {
        if (pcmBufferRef.current.length === 0 || isSendingRef.current) return;

        const totalLen = pcmBufferRef.current.reduce((a, b) => a + b.length, 0);
        if (totalLen < 1000) return;

        const combined = new Float32Array(totalLen);
        let off = 0;
        for (const buf of pcmBufferRef.current) { combined.set(buf, off); off += buf.length; }
        pcmBufferRef.current = [];

        isSendingRef.current = true;
        setIsLoading(true);
        try {
            const rate = audioContextRef.current?.sampleRate || 44100;
            const wav = encodeWAV(downsample(combined, rate, SAMPLE_RATE), SAMPLE_RATE);
            console.log(`📤 Sending ${(wav.size / 1024).toFixed(1)} KB WAV`);

            const words = await transcribeWithWitAi(wav);
            if (words.length > 0) processTranscription(words);
        } catch (e) {
            console.error('Wit.ai error:', e);
        } finally {
            isSendingRef.current = false;
            setIsLoading(false);
        }
    }, [processTranscription]);

    const start = useCallback(async () => {
        if (isListeningRef.current) return;
        if (!WIT_AI_TOKEN || WIT_AI_TOKEN === 'YOUR_WIT_AI_TOKEN_HERE') {
            console.error('Set VITE_WIT_AI_TOKEN in .env.local');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
            });
            mediaStreamRef.current = stream;

            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = ctx;

            const src = ctx.createMediaStreamSource(stream);
            const proc = ctx.createScriptProcessor(4096, 1, 1);
            processorRef.current = proc;

            proc.onaudioprocess = (e: AudioProcessingEvent) => {
                if (!isListeningRef.current) return;
                pcmBufferRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
            };

            src.connect(proc);
            proc.connect(ctx.destination);

            chunkTimerRef.current = setInterval(() => {
                if (isListeningRef.current && pcmBufferRef.current.length > 0) sendChunkToWitAi();
            }, CHUNK_INTERVAL_MS);

            isListeningRef.current = true;
            setIsListening(true);
            console.log('🎤 Listening started');
        } catch (e) {
            console.error('Mic error:', e);
            isListeningRef.current = false;
            setIsListening(false);
        }
    }, [sendChunkToWitAi]);

    const stop = useCallback(() => {
        if (!isListeningRef.current) return;
        isListeningRef.current = false;
        setIsListening(false);

        if (chunkTimerRef.current) { clearInterval(chunkTimerRef.current); chunkTimerRef.current = null; }
        if (pcmBufferRef.current.length > 0) sendChunkToWitAi();
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        pcmBufferRef.current = [];
        console.log('🔇 Stopped');
    }, [sendChunkToWitAi]);

    const resetIndex = useCallback(() => { setCurrentIndex(0); currentIndexRef.current = 0; }, []);
    useEffect(() => { return () => { stop(); }; }, [stop]);

    return { currentIndex, isListening, isLoading, start, stop, resetIndex };
};
