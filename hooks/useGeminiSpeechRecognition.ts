import { useState, useRef, useCallback, useEffect } from 'react';
import { fuzzyMatchWords } from '../utils/textUtils';

const GEMINI_API_KEY = "AIzaSyDxlZqS32sx0ERnxx2CuKPYEHcCqWLjpEA";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

export const useGeminiSpeechRecognition = ({
    expectedWords,
    onWordMatch,
    onWordMismatch,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentIndexRef = useRef(0);
    const expectedWordsRef = useRef(expectedWords);
    const isListeningRef = useRef(false);

    const streamRef = useRef<MediaStream | null>(null);
    const recordersRef = useRef<MediaRecorder[]>([]);
    const timersRef = useRef<number[]>([]);

    // Sequencing for correctly ordering async Gemini API results
    const seqCounterRef = useRef(0);
    const latestProcessedSeqRef = useRef(-1);
    const pendingResultsRef = useRef<Map<number, string>>(new Map());

    useEffect(() => { expectedWordsRef.current = expectedWords; }, [expectedWords]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const processWords = useCallback((transcript: string) => {
        const words = transcript.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return;

        const localIndex = currentIndexRef.current;
        const localExpected = expectedWordsRef.current;

        if (localIndex >= localExpected.length) return;

        let matchedCount = 0;

        for (const spokenWord of words) {
            const targetIndex = localIndex + matchedCount;
            if (targetIndex >= localExpected.length) break;

            const expectedWord = localExpected[targetIndex];
            // threshold = 0.4 for slightly more lenient matching given Gemini's perfect Arabic text vs Uthmani differences
            const isMatch = fuzzyMatchWords(spokenWord, expectedWord, 0.4);

            if (isMatch) {
                matchedCount++;
                onWordMatch?.(targetIndex);
            } else {
                let foundAhead = false;
                const window = Math.min(6, localExpected.length - targetIndex);
                for (let off = 1; off < window; off++) {
                    if (fuzzyMatchWords(spokenWord, localExpected[targetIndex + off], 0.4)) {
                        for (let s = 0; s < off; s++) {
                            onWordMatch?.(targetIndex + s);
                        }
                        matchedCount += off + 1;
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
            setCurrentIndex(prev => {
                const newIndex = localIndex + matchedCount;
                return Math.max(prev, newIndex);
            });
        }
    }, [onWordMatch, onWordMismatch]);

    const sendBlobToGemini = async (blob: Blob, seq: number) => {
        try {
            const base64 = await blobToBase64(blob);
            const expectedText = expectedWordsRef.current
                .slice(currentIndexRef.current, currentIndexRef.current + 20)
                .join(' ');

            const promptText = `أنت في تطبيق تسميع القرآن. المستخدم يقرأ الآيات بصوته وحالتها مقسمة لمقاطع.
اكتب الكلمات التي تسمعها باللغة العربية حصراً فقط لا غير.
يُتوقع أن يكون النص أو جزء منه: "${expectedText}"
اكتب الكلمات بدون تشكيل. إذا كان صمتاً أرجع نص فارغ تماماً.`;

            const requestBody = {
                contents: [{
                    parts: [
                        { text: promptText },
                        {
                            inline_data: {
                                mime_type: blob.type || 'audio/webm',
                                data: base64.split(',')[1]
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 200
                }
            };

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();

            let transcript = '';
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                transcript = data.candidates[0].content.parts[0].text;
            }

            // Queue and process in order
            pendingResultsRef.current.set(seq, transcript);
            while (pendingResultsRef.current.has(latestProcessedSeqRef.current + 1)) {
                const nextSeq = latestProcessedSeqRef.current + 1;
                const text = pendingResultsRef.current.get(nextSeq);
                pendingResultsRef.current.delete(nextSeq);
                if (text) {
                    processWords(text);
                }
                latestProcessedSeqRef.current = nextSeq;
            }

        } catch (e) {
            console.error("Gemini API error:", e);
            pendingResultsRef.current.set(seq, '');
            while (pendingResultsRef.current.has(latestProcessedSeqRef.current + 1)) {
                latestProcessedSeqRef.current++;
                pendingResultsRef.current.delete(latestProcessedSeqRef.current);
            }
        }
    };

    const startRecordingLoop = useCallback(() => {
        if (!isListeningRef.current || !streamRef.current) return;

        // Use 4s chunks, overlapping by 1s (step = 3s)
        const CHUNK_DURATION = 4000;
        const STEP_DURATION = 3000;

        const loop = () => {
            if (!isListeningRef.current) return;

            const seq = seqCounterRef.current++;
            const mr = new MediaRecorder(streamRef.current!);
            recordersRef.current.push(mr);

            const chunks: BlobPart[] = [];
            mr.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            mr.onstop = () => {
                const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
                recordersRef.current = recordersRef.current.filter(r => r !== mr);

                if (blob.size > 500) {
                    sendBlobToGemini(blob, seq);
                } else {
                    pendingResultsRef.current.set(seq, '');
                    while (pendingResultsRef.current.has(latestProcessedSeqRef.current + 1)) {
                        latestProcessedSeqRef.current++;
                        pendingResultsRef.current.delete(latestProcessedSeqRef.current);
                    }
                }
            };

            mr.start();
            setIsLoading(false);

            const stopTimer = window.setTimeout(() => {
                if (mr.state === 'recording') mr.stop();
            }, CHUNK_DURATION);
            timersRef.current.push(stopTimer);

            const nextTimer = window.setTimeout(() => {
                loop();
            }, STEP_DURATION);
            timersRef.current.push(nextTimer);
        };

        loop();
    }, [processWords]);

    const start = useCallback(async () => {
        if (isListeningRef.current) return;

        setIsLoading(true);
        isListeningRef.current = true;
        setIsListening(true);

        seqCounterRef.current = 0;
        latestProcessedSeqRef.current = -1;
        pendingResultsRef.current.clear();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;
            startRecordingLoop();
        } catch (e) {
            console.error('Failed to get user media:', e);
            setIsLoading(false);
            setIsListening(false);
            isListeningRef.current = false;
        }
    }, [startRecordingLoop]);

    const stop = useCallback(() => {
        isListeningRef.current = false;
        setIsListening(false);
        setIsLoading(false);

        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];

        recordersRef.current.forEach(mr => {
            if (mr.state === 'recording') {
                mr.stop();
            }
        });
        recordersRef.current = [];

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const resetIndex = useCallback(() => {
        setCurrentIndex(0);
        currentIndexRef.current = 0;
    }, []);

    useEffect(() => {
        return () => { stop(); };
    }, [stop]);

    return {
        currentIndex,
        isListening,
        isLoading,
        isSupported: true,
        start,
        stop,
        resetIndex,
    };
};
