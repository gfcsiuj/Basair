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

    // Strict Request Queue to prevent parallel API calls and handle 429
    const isProcessingQueueRef = useRef(false);
    const requestQueueRef = useRef<{ blob: Blob, seq: number }[]>([]);
    const lastRequestTimeRef = useRef(0); // Track exactly when we last pinged Gemini

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

    const processQueue = useCallback(async () => {
        if (isProcessingQueueRef.current || requestQueueRef.current.length === 0) return;

        isProcessingQueueRef.current = true;

        while (requestQueueRef.current.length > 0 && isListeningRef.current) {
            const { blob, seq } = requestQueueRef.current[0]; // Peek at the first item

            try {
                const base64 = await blobToBase64(blob);
                const expectedText = expectedWordsRef.current
                    .slice(currentIndexRef.current, currentIndexRef.current + 20)
                    .join(' ');

                const promptText = `أنت في تطبيق تسميع القرآن. المستخدم يقرأ الآيات بصوته وحالتها مقسمة لمقاطع.
اكتب الكلمات التي تسمعها باللغة العربية حصراً فقط لا غير ولا تكتب أي تعليقات.
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

                // Rate limiting strategy: Gemini Free Tier allows 15 RPM = 1 request exactly every 4000ms.
                // We enforce a hard minimum gap of 4100ms between EVERY request.
                const now = Date.now();
                const timeSinceLastRequest = now - lastRequestTimeRef.current;
                const timeToWait = Math.max(0, 4100 - timeSinceLastRequest);

                if (timeToWait > 0) {
                    await new Promise(resolve => setTimeout(resolve, timeToWait));
                }

                lastRequestTimeRef.current = Date.now();

                const response = await fetch(GEMINI_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        console.warn(`تم تجاوز الحد المسموح للطلبات (429). سنحاول مجدداً بعد 5 ثوانٍ.`);
                        lastRequestTimeRef.current = Date.now() + 5000; // Force an extra 5s delay
                        continue; // Retry the same request
                    } else {
                        console.error("خطأ في الاتصال بالخادم:", response.status);
                        throw new Error(`HTTP Error: ${response.status}`);
                    }
                }

                // Remove item from queue only on success or permanent error
                requestQueueRef.current.shift();

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

                // Small delay to let React process words nicely
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (e) {
                console.error("Gemini API error:", e);
                // Remove item from queue on permanent error so we don't get stuck forever
                requestQueueRef.current.shift();

                pendingResultsRef.current.set(seq, '');
                while (pendingResultsRef.current.has(latestProcessedSeqRef.current + 1)) {
                    latestProcessedSeqRef.current++;
                    pendingResultsRef.current.delete(latestProcessedSeqRef.current);
                }
            }
        }

        isProcessingQueueRef.current = false;
    }, [processWords]);

    const queueBlobForGemini = useCallback((blob: Blob, seq: number) => {
        requestQueueRef.current.push({ blob, seq });
        processQueue();
    }, [processQueue]);

    const startRecordingLoop = useCallback(() => {
        if (!isListeningRef.current || !streamRef.current) return;

        // Use 4s chunks, step 4s
        // 60 / 4 = 15 requests per minute exactly.
        // Queue will natively space them out to be 4100ms apart safely.
        const CHUNK_DURATION = 4000;
        const STEP_DURATION = 4000;

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
                    queueBlobForGemini(blob, seq);
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
    }, [queueBlobForGemini]);

    const start = useCallback(async () => {
        if (isListeningRef.current) return;

        setIsLoading(true);
        isListeningRef.current = true;
        setIsListening(true);

        seqCounterRef.current = 0;
        latestProcessedSeqRef.current = -1;
        pendingResultsRef.current.clear();

        try {
            // Check if there is an existing stream first to ensure clean state
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            requestQueueRef.current = [];
            lastRequestTimeRef.current = 0;
            isProcessingQueueRef.current = false;

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

        requestQueueRef.current = [];
        lastRequestTimeRef.current = 0;
        isProcessingQueueRef.current = false;

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
