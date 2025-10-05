import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../hooks/useApp';
import { FunctionDeclaration, Type, Content } from '@google/genai';
import { API_BASE } from '../constants';
import { Panel } from '../types';

interface Message {
    text: string;
    sender: 'user' | 'ai';
}

const allSuggestions = [
    "انتقل إلى سورة الكهف", "اذهب إلى صفحة 50", "ما هو سبب نزول سورة الإخلاص؟",
    "اشرح لي معنى 'الصمد'", "من هو مطور هذا التطبيق؟", "ما هو اسم هذا التطبيق؟",
    "حديث عن فضل قراءة القرآن", "ما هي السبع الموبقات؟", "انتقل إلى الجزء الثلاثين",
    "ما معنى 'ألم نشرح لك صدرك'؟", "كم عدد آيات سورة البقرة؟", "تفسير آية الكرسي",
    "من هم أولو العزم من الرسل؟", "ما الفرق بين القرآن المكي والمدني؟", "انتقل إلى سورة يس",
    "ما هي أحكام النون الساكنة؟", "قصة أصحاب الكهف باختصار", "اذهب إلى الصفحة الأولى",
    "ما هو فضل ليلة القدر؟", "معلومات عن صحيح البخاري", "انتقل إلى سورة الملك",
    "من هو النبي الذي ابتلعه الحوت؟", "ما معنى 'وقضى ربك ألا تعبدوا إلا إياه'؟",
    "اذهب إلى آخر صفحة في المصحف", "ما هي أركان الإسلام؟", "تفسير 'قل هو الله أحد'",
    "انتقل إلى سورة الرحمن", "ما هي قصة النبي موسى مع الخضر؟", "من أول من أسلم من الرجال؟",
    "اقترح عليّ خطة لختم القرآن في شهر", "ما هي آداب تلاوة القرآن؟",
    "اذهب إلى صفحة 255"
];

const AIAssistant: React.FC = () => {
    const { state, actions } = useApp();
    const [messages, setMessages] = useState<Message[]>([
        { text: 'السلام عليكم! أنا عبد الحكيم، مساعدك لفهم وتدبر القرآن الكريم. كيف يمكنني خدمتك اليوم؟', sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatHistory = useRef<Content[]>([]);
    const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);

    const { isAIAssistantOpen, aiAutoPrompt, activePanel } = state;

    const [isRendered, setIsRendered] = useState(isAIAssistantOpen);
    
    // Swipe to dismiss state
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);

    const onDismiss = useCallback(() => {
        actions.setState(s => ({ ...s, isAIAssistantOpen: false }));
    }, [actions]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        let deltaY = currentY - touchStartY.current;
        if (deltaY < 0) deltaY = 0; // Prevent dragging up
        setTranslateY(deltaY);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (translateY > 80) { // Threshold
            onDismiss();
        } else {
            setTranslateY(0);
        }
    };

    const panelStyle: React.CSSProperties = {
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    };

    useEffect(() => {
        if (isAIAssistantOpen) {
            setIsRendered(true);
            setTranslateY(0); // Reset position when opening
        }
    }, [isAIAssistantOpen]);

    const handleAnimationEnd = () => {
        if (!isAIAssistantOpen) {
            setIsRendered(false);
        }
    };

    useEffect(() => {
        // Initialize chat history when component mounts
        chatHistory.current = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
    }, []); // Run only once

    useEffect(() => {
        if (!state.isUIVisible && isAIAssistantOpen) {
            actions.setState(s => ({ ...s, isAIAssistantOpen: false }));
        }
    }, [state.isUIVisible, isAIAssistantOpen, actions]);

    useEffect(() => {
        if (isAIAssistantOpen) {
            const pickSuggestions = () => {
                const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random());
                setCurrentSuggestions(shuffled.slice(0, 3));
            };
            pickSuggestions();
            const intervalId = setInterval(pickSuggestions, 30000);
            return () => clearInterval(intervalId);
        }
    }, [isAIAssistantOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const systemInstruction = `أنت 'عبدالحكيم'، مساعد ذكاء اصطناعي حكيم وعالم، متخصص في القرآن الكريم وعلومه والتفسير والحديث النبوي. مهمتك هي إرشاد المستخدمين ومساعدتهم في رحلتهم لفهم الإسلام وتدبر آياته.
        - اسمك: عبدالحكيم.
        - مطورك: محمد حازم احمد الخاتوني.
        - التطبيق الذي تعمل به: بصائر.
        عندما يُطلب منك التنقل (إلى صفحة، سورة، آية، أو جزء)، استخدم الأدوات (functions) المتاحة لك مباشرةً. لا تخبر المستخدم أنك ستنتقل، بل قم بتنفيذ الأمر. بعد تنفيذ الأمر، قم بالرد برسالة تأكيد مناسبة.
        لأي استفسار آخر، قدم إجابات دقيقة ومفيدة ومستندة إلى مصادر موثوقة. كن دائمًا مهذبًا وواضحًا وموجزًا في ردودك.`;

    const tools: FunctionDeclaration[] = [
        {
            name: 'navigateToPage',
            parameters: {
                type: Type.OBJECT,
                properties: { pageNumber: { type: Type.NUMBER, description: 'رقم الصفحة المراد الانتقال إليها' } },
                required: ['pageNumber'],
            },
        },
        {
            name: 'navigateToSurah',
            parameters: {
                type: Type.OBJECT,
                properties: { surahIdentifier: { type: Type.STRING, description: 'اسم السورة أو رقمها' } },
                required: ['surahIdentifier'],
            },
        },
        {
            name: 'navigateToVerse',
            parameters: {
                type: Type.OBJECT,
                properties: { verseKey: { type: Type.STRING, description: 'مفتاح الآية، مثل "2:255" لآية الكرسي' } },
                required: ['verseKey'],
            },
        },
        {
            name: 'navigateToJuz',
            parameters: {
                type: Type.OBJECT,
                properties: { juzNumber: { type: Type.NUMBER, description: 'رقم الجزء المراد الانتقال إليه (1-30)' } },
                required: ['juzNumber'],
            },
        }
    ];

    const sendMessage = useCallback(async (promptOverride?: string) => {
        const userMessageText = promptOverride || input;
        if (!userMessageText.trim() || isLoading || !state.ai) return;

        const userMessage: Message = { text: userMessageText, sender: 'user' };
        
        setMessages(prev => [...prev, userMessage]);
        if (!promptOverride) {
            setInput('');
        }
        setIsLoading(true);

        chatHistory.current.push({ role: 'user', parts: [{ text: userMessageText }] });

        try {
            const result = await state.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: chatHistory.current,
                config: { systemInstruction, tools: [{ functionDeclarations: tools }] }
            });

            const response = result;

            if (response.functionCalls) {
                const call = response.functionCalls[0]; // Assuming one call for now
                let functionResult: string = 'لم يتم العثور على الوظيفة';

                if (call.name === 'navigateToPage') {
                    const pageNumber = call.args.pageNumber as number;
                    await actions.loadPage(pageNumber);
                    functionResult = `تم الانتقال إلى صفحة ${pageNumber}`;
                    actions.setState(s => ({ ...s, isAIAssistantOpen: false }));
                } else if (call.name === 'navigateToSurah') {
                    const surahIdentifier = call.args.surahIdentifier as string;
                    const surah = state.surahs.find(s => String(s.id) === String(surahIdentifier) || s.name_arabic === surahIdentifier || s.name_simple.toLowerCase() === String(surahIdentifier).toLowerCase());
                    if (surah) {
                        await actions.loadPage(surah.pages[0]);
                        functionResult = `تم الانتقال إلى سورة ${surah.name_arabic}`;
                        actions.setState(s => ({ ...s, isAIAssistantOpen: false }));
                    } else {
                        functionResult = `لم أجد سورة باسم ${surahIdentifier}`;
                    }
                } else if (call.name === 'navigateToVerse') {
                    const verseKey = call.args.verseKey as string;
                     try {
                        const verseData = await actions.fetchWithRetry<{ verse: { page_number: number } }>(`${API_BASE}/verses/by_key/${verseKey}`);
                        await actions.loadPage(verseData.verse.page_number);
                        functionResult = `تم الانتقال إلى الآية ${verseKey}`;
                        actions.setState(s => ({ ...s, isAIAssistantOpen: false }));
                    } catch (err) {
                        functionResult = `لم أتمكن من العثور على الآية ${verseKey}`;
                    }
                } else if (call.name === 'navigateToJuz') {
                    const juzNumber = call.args.juzNumber as number;
                    if (juzNumber >= 1 && juzNumber <= 30) {
                        try {
                            const juzsData = await actions.fetchWithRetry<{ juzs: { id: number; juz_number: number; verse_mapping: Record<string, string> }[] }>(`${API_BASE}/juzs`);
                            const juz = juzsData.juzs.find(j => j.juz_number === juzNumber);
                            if (juz && Object.keys(juz.verse_mapping).length > 0) {
                                const firstSurah = Object.keys(juz.verse_mapping)[0];
                                const range = juz.verse_mapping[firstSurah];
                                const firstVerseNum = range.split('-')[0];
                                const firstVerseKey = `${firstSurah}:${firstVerseNum}`;
                                
                                const verseData = await actions.fetchWithRetry<{ verse: { page_number: number } }>(`${API_BASE}/verses/by_key/${firstVerseKey}`);
                                await actions.loadPage(verseData.verse.page_number);
                                functionResult = `تم الانتقال إلى الجزء ${juzNumber}`;
                                actions.setState(s => ({ ...s, isAIAssistantOpen: false }));
                            } else {
                                functionResult = `لم أتمكن من العثور على بداية الجزء ${juzNumber}`;
                            }
                        } catch (err) {
                             functionResult = `حدث خطأ أثناء الانتقال إلى الجزء ${juzNumber}`;
                        }
                    } else {
                        functionResult = `رقم الجزء ${juzNumber} غير صالح.`;
                    }
                }
                
                chatHistory.current.push({ role: 'model', parts: response.candidates![0].content.parts });
                chatHistory.current.push({
                    role: 'function',
                    parts: [{ functionResponse: { name: call.name, response: { result: functionResult } } }]
                });

                const secondResult = await state.ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: chatHistory.current,
                    config: { systemInstruction }
                });

                const finalResponseText = secondResult.text;
                const aiMessage: Message = { text: finalResponseText, sender: 'ai' };
                setMessages(prev => [...prev, aiMessage]);
                chatHistory.current.push({ role: 'model', parts: [{ text: finalResponseText }] });

            } else {
                const responseText = response.text;
                const aiMessage: Message = { text: responseText, sender: 'ai' };
                setMessages(prev => [...prev, aiMessage]);
                chatHistory.current.push({ role: 'model', parts: [{ text: responseText }] });
            }
        } catch (error) {
            console.error("AI Error:", error);
            const errorMessage: Message = { text: 'عذراً، حدث خطأ أثناء التواصل مع المساعد.', sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
            chatHistory.current.push({ role: 'model', parts: [{ text: errorMessage.text }] });
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input, isLoading, state.ai]);

    useEffect(() => {
        if (aiAutoPrompt && isAIAssistantOpen) {
            sendMessage(aiAutoPrompt);
            actions.setState(s => ({...s, aiAutoPrompt: null }));
        }
    }, [aiAutoPrompt, isAIAssistantOpen, sendMessage, actions]);

    if (state.readingMode === 'memorization') return null;

    const isAudioPanelOpen = activePanel === Panel.Audio;
    const fabBottomPosition = isAudioPanelOpen
        ? 'calc(13rem + env(safe-area-inset-bottom, 0rem))'
        : 'calc(5rem + env(safe-area-inset-bottom, 0rem))';


    return (
        <>
            <button 
                onClick={() => actions.setState(s => ({ ...s, isAIAssistantOpen: !s.isAIAssistantOpen }))}
                className={`ai-fab fixed left-5 w-14 h-14 bg-gradient-to-br from-primary to-primary-light text-white rounded-full flex items-center justify-center shadow-lg z-30 transition-all duration-300 hover:scale-110 ${state.isUIVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ bottom: fabBottomPosition }}
            >
                <i className={`fas ${isAIAssistantOpen ? 'fa-times' : 'fa-robot'} text-2xl transition-transform duration-300 ${isAIAssistantOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isRendered && (
                <div 
                    onAnimationEnd={handleAnimationEnd}
                    className={`ai-window fixed inset-0 md:inset-auto md:bottom-[calc(8.75rem+env(safe-area-inset-bottom,0rem))] md:left-5 md:right-auto md:w-96 md:h-[60vh] md:max-h-[500px] bg-bg-primary border border-border md:rounded-2xl shadow-xl flex flex-col z-40 ${isAIAssistantOpen ? 'animate-slideInUp' : 'animate-slideOutDown'}`}
                    style={panelStyle}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-full flex justify-center pt-3 shrink-0">
                         <div className="w-12 h-1.5 bg-bg-tertiary rounded-full"></div>
                    </div>
                    <div 
                        className="panel-header flex items-center justify-between p-3 text-text-primary md:rounded-t-2xl shrink-0"
                    >
                        <div className="flex items-center gap-3">
                            <i className="fas fa-robot text-primary"></i>
                            <h3 className="font-bold">المساعد الذكي: عبد الحكيم</h3>
                        </div>
                        <button onClick={onDismiss} className="p-2 hover:bg-bg-secondary rounded-full md:hidden"><i className="fas fa-times"></i></button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-2.5 mb-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-blue-500' : 'bg-primary'}`}>
                                    <i className={`fas ${msg.sender === 'user' ? 'fa-user' : 'fa-robot'} text-white text-sm`}></i>
                                </div>
                                <div className={`p-3 rounded-xl max-w-[80%] ${msg.sender === 'user' ? 'bg-blue-100 dark:bg-blue-900/40 rounded-br-none' : 'bg-bg-secondary rounded-bl-none'}`}>
                                    <p className="text-sm text-text-primary whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex gap-2.5 mb-4">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary">
                                    <i className="fas fa-robot text-white text-sm"></i>
                                </div>
                                <div className="p-3 rounded-xl max-w-[80%] bg-bg-secondary rounded-bl-none">
                                    <i className="fas fa-spinner fa-pulse"></i>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div 
                        className="p-2 border-t border-border"
                        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0rem))' }}
                    >
                        <div className="flex gap-1 overflow-x-auto pb-2">
                           {currentSuggestions.map(s => (
                               <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1 bg-bg-tertiary rounded-full shrink-0 hover:bg-primary/20 transition-colors">{s}</button>
                           ))}
                        </div>
                        <div className="flex items-center gap-2 p-2">
                            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="اسأل عبد الحكيم..." className="input flex-1 bg-bg-secondary border-border focus:border-primary !rounded-full px-4" />
                            <button onClick={() => sendMessage()} className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shrink-0" disabled={isLoading}>
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAssistant;
