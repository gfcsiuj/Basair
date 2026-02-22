import React, { useState, useEffect, useMemo } from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';

// Husn Al Muslim API from multiple reliable sources or fallback
const DUA_API = 'https://raw.githubusercontent.com/nawafalqari/husn-al-muslim-json/main/husn-al-muslim.json';

// Minimal Dua type based on standard structures
interface DuaItem {
    id: number;
    text: string;
}

interface DuaCategory {
    id: number;
    title: string;
    audio_url: string;
    text: string;
    array: DuaItem[];
}

const DuaDecoration = () => (
    <svg viewBox="0 0 120 40" className="w-24 h-8 text-primary/30 mx-auto" fill="none">
        <path d="M10 20 Q30 5 60 20 Q90 35 110 20" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="60" cy="20" r="4" fill="currentColor" opacity="0.5" />
        <circle cx="30" cy="15" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="90" cy="25" r="2" fill="currentColor" opacity="0.3" />
    </svg>
);

const DuasPanel: React.FC = () => {
    const { state } = useApp();
    const [categories, setCategories] = useState<DuaCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<DuaCategory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDuas = async () => {
            try {
                setIsLoading(true);
                // Attempt to fetch from public GitHub raw
                const response = await fetch('https://raw.githubusercontent.com/osamahamal/husn-al-muslim-json/main/husn_ar.json');

                if (!response.ok) {
                    throw new Error('فشل جلب الأذكار');
                }

                const data = await response.json();

                // Transform data if needed depending on exact structure, assuming standard hisn muslim json array
                setCategories(Array.isArray(data) ? data : []);
                setIsLoading(false);
            } catch (err) {
                console.error("Dua API Error:", err);

                // Fallback to minimal built-in duas if API fails completely to guarantee functionality
                const fallbackCategories = [
                    {
                        id: 1, title: 'أذكار الصباح', audio_url: '', text: '',
                        array: [
                            { id: 101, text: 'أَعُوذُ بِاللهِ مِنْ الشَّيْطَانِ الرَّجِيمِ\nاللّهُ لاَ إِلَـهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ.' },
                            { id: 102, text: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم\nقُلْ هُوَ ٱللَّهُ أَحَدٌ، ٱللَّهُ ٱلصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ. (ثلاث مرات)' },
                            { id: 103, text: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم\nقُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ، مِن شَرِّ مَا خَلَقَ، وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ، وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ. (ثلاث مرات)' },
                            { id: 104, text: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم\nقُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ، مَلِكِ ٱلنَّاسِ، إِلَٰهِ ٱلنَّاسِ، مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ، ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ، مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ. (ثلاث مرات)' },
                            { id: 105, text: 'أَصْـبَحْنا وَأَصْـبَحَ المُـلْكُ لله وَالحَمدُ لله ، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ لهُ، لهُ المُـلكُ ولهُ الحَمْـد، وهُوَ على كلّ شَيءٍ قدير ، رَبِّ أسْـأَلُـكَ خَـيرَ ما في هـذا اليوم وَخَـيرَ ما بَعْـدَه ، وَأَعـوذُ بِكَ مِنْ شَـرِّ ما في هـذا اليوم وَشَرِّ ما بَعْـدَه، رَبِّ أَعـوذُبِكَ مِنَ الْكَسَـلِ وَسـوءِ الْكِـبَر ، رَبِّ أَعـوذُ بِكَ مِنْ عَـذابٍ في النّـارِ وَعَـذابٍ في القَـبْر.' },
                            { id: 106, text: 'اللّهُـمَّ بِكَ أَصْـبَحْنا وَبِكَ أَمْسَـينا ، وَبِكَ نَحْـيا وَبِكَ نَمُـوتُ وَإِلَـيْكَ النُّـشُور.' },
                            { id: 107, text: 'اللّهـمَّ أَنْتَ رَبِّـي لا إلهَ إلاّ أَنْتَ ، خَلَقْتَنـي وَأَنا عَبْـدُك ، وَأَنا عَلـى عَهْـدِكَ وَوَعْـدِكَ ما اسْتَـطَعْـت ، أَعـوذُبِكَ مِنْ شَـرِّ ما صَنَـعْت ، أَبـوءُ لَـكَ بِنِعْـمَتِـكَ عَلَـيَّ وَأَبـوءُ بِذَنْـبي فَاغْفـِرْ لي فَإِنَّـهُ لا يَغْـفِرُ الذُّنـوبَ إِلاّ أَنْتَ.' },
                            { id: 108, text: 'اللّهُـمَّ إِنِّـي أَصْبَـحْتُ أُشْـهِدُك ، وَأُشْـهِدُ حَمَلَـةَ عَـرْشِـك ، وَمَلائِكَتِك ، وَجَمـيعَ خَلْـقِك ، أَنَّـكَ أَنْـتَ اللهُ لا إلهَ إلاّ أَنْـتَ وَحْـدَكَ لا شَريكَ لَـك ، وَأَنَّ مُحَمّـداً عَبْـدُكَ وَرَسـولُـك. (أربع مرات)' },
                            { id: 109, text: 'اللّهُـمَّ ما أَصْبَـَحَ بي مِـنْ نِعْـمَةٍ أَو بِأَحَـدٍ مِـنْ خَلْـقِك ، فَمِـنْكَ وَحْـدَكَ لا شريكَ لَـك ، فَلَـكَ الْحَمْـدُ وَلَـكَ الشُّكْـر.' },
                            { id: 110, text: 'حَسْبِـيَ اللّهُ لا إلهَ إلاّ هُوَ عَلَـيهِ تَوَكَّـلتُ وَهُوَ رَبُّ العَرْشِ العَظـيم. (سبع مرات)' }
                        ]
                    },
                    {
                        id: 2, title: 'أذكار المساء', audio_url: '', text: '',
                        array: [
                            { id: 201, text: 'أَعُوذُ بِاللهِ مِنْ الشَّيْطَانِ الرَّجِيمِ\nاللّهُ لاَ إِلَـهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ...' },
                            { id: 202, text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ...' },
                            { id: 203, text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.' },
                            { id: 204, text: 'اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ، أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ.' },
                            { id: 205, text: 'أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ...' }
                        ]
                    },
                    {
                        id: 3, title: 'أدعية قرآنية', audio_url: '', text: '',
                        array: [
                            { id: 301, text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ' },
                            { id: 302, text: 'رَبَّنَا لاَ تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ' },
                            { id: 303, text: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ' }
                        ]
                    },
                    {
                        id: 4, title: 'أذكار النوم', audio_url: '', text: '',
                        array: [
                            { id: 401, text: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا...' },
                            { id: 402, text: 'اللَّهُمَّ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا...' }
                        ]
                    },
                    {
                        id: 5, title: 'دعاء الاستخارة', audio_url: '', text: '',
                        array: [
                            { id: 501, text: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ...' }
                        ]
                    }
                ];
                setCategories(fallbackCategories);
                setIsLoading(false);
            }
        };

        fetchDuas();
    }, []);

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        return categories.filter(cat => cat.title.includes(searchQuery.trim()));
    }, [categories, searchQuery]);

    const handleBack = () => {
        setSelectedCategory(null);
    };

    if (selectedCategory) {
        return (
            <Panel
                id={PanelType.Supplications}
                title={selectedCategory.title}
                headerActions={
                    <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center hover:bg-white/15 rounded-full transition-colors ml-2" title="الرجوع للقائمة">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                }
            >
                <div className="flex flex-col h-full bg-bg-primary">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                        <div className="text-center mb-8 animate-fadeIn">
                            <DuaDecoration />
                        </div>

                        {selectedCategory.array?.map((dua, index) => (
                            <div key={dua.id || index} className="bg-bg-secondary p-6 rounded-3xl border border-border/40 shadow-sm animate-listItemEnter relative group overflow-hidden" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                                <div className="flex justify-between items-start mb-6 relative">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                                        {index + 1}
                                    </div>
                                    <button
                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-bg-primary text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors border border-border/50 shadow-sm"
                                        onClick={() => navigator.clipboard.writeText(dua.text)}
                                        title="نسخ الدعاء"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                        </svg>
                                    </button>
                                </div>

                                <p className="font-arabic text-2xl leading-[2.8] text-text-primary text-center relative z-10 whitespace-pre-wrap" style={{ fontFamily: 'QCF_BSML, var(--font-arabic)' }}>
                                    {dua.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </Panel>
        );
    }

    return (
        <Panel id={PanelType.Supplications} title="حصن المسلم والأدعية">
            <div className="flex flex-col h-full bg-bg-primary">
                <div className="p-4 sticky top-0 bg-bg-primary/90 backdrop-blur-md z-10 border-b border-border/50">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ابحث في الأذكار والأدعية..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-secondary border border-border/50 text-text-primary text-sm rounded-xl pl-4 pr-11 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                        />
                        <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-text-tertiary animate-pulse">
                            <svg className="w-8 h-8 animate-spin mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <p>جاري جلب الأذكار...</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-16 text-text-tertiary animate-fadeIn">
                            <div className="bg-bg-secondary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <p className="font-bold text-lg mb-2">لا توجد نتائج</p>
                            <p className="text-sm opacity-70">لم يتم العثور على أذكار مطابقة لبحثك</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredCategories.map((cat, index) => (
                                <button
                                    key={cat.id || index}
                                    onClick={() => setSelectedCategory(cat)}
                                    className="bg-bg-secondary p-4 rounded-2xl border border-border/40 hover:border-primary/40 hover:bg-bg-tertiary transition-all text-right group animate-listItemEnter flex items-center justify-between"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.315 48.315 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-text-primary text-sm mb-1">{cat.title || cat.text}</h4>
                                            {cat.array && (
                                                <p className="text-xs text-text-tertiary">{cat.array.length} دعاء</p>
                                            )}
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Panel>
    );
};

export default DuasPanel;
