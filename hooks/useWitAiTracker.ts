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
 * تحليل استجابة Wit.ai - تدعم JSON عادي و NDJSON
 */
const parseWitResponse = (responseText: string): { tokens: string[], text: string } => {
    let tokens: string[] = [];
    let text = '';

    // أولاً: محاولة تحليل الاستجابة كاملة كـ JSON واحد
    try {
        const parsed = JSON.parse(responseText);
        if (parsed.tokens && Array.isArray(parsed.tokens)) {
            tokens = parsed.tokens
                .map((t: any) => (t.token || t.value || t.text || '') as string)
                .filter(Boolean);
        }
        if (parsed.text) {
            text = parsed.text;
        }
        console.log('🔍 Parsed as single JSON - tokens:', tokens, 'text:', text);
        return { tokens, text };
    } catch {
        // ليست JSON واحد، نحاول NDJSON
    }

    // ثانياً: محاولة تحليل كـ NDJSON (سطور JSON متعددة)
    const lines = responseText.trim().split('\n').filter(Boolean);
    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);
            if (parsed.tokens && Array.isArray(parsed.tokens)) {
                tokens = parsed.tokens
                    .map((t: any) => (t.token || t.value || t.text || '') as string)
                    .filter(Boolean);
            }
            if (parsed.text) {
                text = parsed.text;
            }
        } catch {
            // تجاهل السطر
        }
    }

    console.log('🔍 Parsed as NDJSON - tokens:', tokens, 'text:', text);
    return { tokens, text };
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

    const responseText = await response.text();
    const { tokens, text } = parseWitResponse(responseText);

    // استخدام tokens إذا متاحة، وإلا تقسيم النص
    const result = tokens.length > 0 ? tokens : text.split(/\s+/).filter(Boolean);
    console.log('📝 Wit.ai final words:', result);
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
                        // Mark skipped words
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
