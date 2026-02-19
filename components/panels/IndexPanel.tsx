import React, { useState, useMemo } from 'react';
import Panel from './Panel';
import { Panel as PanelType, Surah } from '../../types';
import { useApp } from '../../hooks/useApp';
import { MakkiIcon, MadaniIcon, JuzHeaderDecoration, IslamicStar } from '../SvgDecorations';

// Juz/Hizb data - page numbers for each Juz start
const JUZ_DATA = [
    { juz: 1, startPage: 1 }, { juz: 2, startPage: 22 }, { juz: 3, startPage: 42 },
    { juz: 4, startPage: 62 }, { juz: 5, startPage: 82 }, { juz: 6, startPage: 102 },
    { juz: 7, startPage: 121 }, { juz: 8, startPage: 142 }, { juz: 9, startPage: 162 },
    { juz: 10, startPage: 182 }, { juz: 11, startPage: 201 }, { juz: 12, startPage: 222 },
    { juz: 13, startPage: 242 }, { juz: 14, startPage: 262 }, { juz: 15, startPage: 282 },
    { juz: 16, startPage: 302 }, { juz: 17, startPage: 322 }, { juz: 18, startPage: 342 },
    { juz: 19, startPage: 362 }, { juz: 20, startPage: 382 }, { juz: 21, startPage: 402 },
    { juz: 22, startPage: 422 }, { juz: 23, startPage: 442 }, { juz: 24, startPage: 462 },
    { juz: 25, startPage: 482 }, { juz: 26, startPage: 502 }, { juz: 27, startPage: 522 },
    { juz: 28, startPage: 542 }, { juz: 29, startPage: 562 }, { juz: 30, startPage: 582 },
];

const JUZ_NAMES = [
    'الم', 'سيقول', 'تلك الرسل', 'لن تنالوا', 'والمحصنات',
    'لا يحب الله', 'وإذا سمعوا', 'ولو أننا', 'قال الملأ', 'واعلموا',
    'يعتذرون', 'وما من دابة', 'وما أبرئ', 'ربما', 'سبحان الذي',
    'قال ألم', 'اقترب', 'قد أفلح', 'وقال الذين', 'أمن خلق',
    'اتل ما أوحي', 'ومن يقنت', 'وما لي', 'فمن أظلم', 'إليه يرد',
    'حم', 'قال فما خطبكم', 'قد سمع الله', 'تبارك', 'عم',
];

const IndexPanel: React.FC = () => {
    const { state, actions } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'surahs' | 'juz'>('surahs');
    const [expandedJuz, setExpandedJuz] = useState<number | null>(null);

    const handleSurahClick = (surah: Surah) => {
        actions.loadPage(surah.pages[0]);
        actions.openPanel(null);
    };

    const handlePageClick = (page: number) => {
        actions.loadPage(page);
        actions.openPanel(null);
    };

    const filteredSurahs = useMemo(() => {
        if (!searchQuery.trim()) return state.surahs;
        const query = searchQuery.trim().toLowerCase();
        return state.surahs.filter(surah =>
            surah.name_arabic.includes(query) ||
            surah.name_simple.toLowerCase().includes(query) ||
            surah.id.toString() === query ||
            surah.translated_name?.name?.includes(query)
        );
    }, [state.surahs, searchQuery]);

    const renderSurahTab = () => (
        <>
            {/* Search Input */}
            <div className="p-3 sticky top-0 bg-bg-primary z-10 border-b border-border">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن سورة..."
                        className="input w-full pr-10 bg-bg-secondary border-border focus:border-primary text-sm"
                    />
                    <i className="fas fa-search absolute top-1/2 right-3 -translate-y-1/2 text-text-tertiary"></i>
                </div>
            </div>

            {/* Surahs List */}
            <div className="divide-y divide-border/50">
                {filteredSurahs.length === 0 ? (
                    <div className="text-center py-10 text-text-secondary">
                        <i className="fas fa-search text-3xl mb-2"></i>
                        <p>لم يتم العثور على سور مطابقة</p>
                    </div>
                ) : (
                    filteredSurahs.map((surah, index) => (
                        <div
                            key={surah.id}
                            onClick={() => handleSurahClick(surah)}
                            className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-bg-secondary transition-colors animate-listItemEnter"
                            style={{ animationDelay: `${Math.min(index * 20, 500)}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                {/* Surah number in decorative badge */}
                                <div className="w-10 h-10 flex items-center justify-center relative">
                                    <IslamicStar size={40} />
                                    <span className="absolute text-primary font-bold text-xs">{surah.id}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-primary text-base">{surah.name_arabic}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {surah.revelation_place === 'makkah' ? (
                                            <MakkiIcon size={14} className="text-amber-600" />
                                        ) : (
                                            <MadaniIcon size={14} className="text-emerald-600" />
                                        )}
                                        <span className="text-[11px] text-text-tertiary">
                                            {surah.revelation_place === 'makkah' ? 'مكية' : 'مدنية'} • {surah.verses_count} آية
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="text-xs text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full">ص {surah.pages[0]}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );

    const renderJuzTab = () => (
        <div className="divide-y divide-border/30">
            {JUZ_DATA.map(({ juz, startPage }) => {
                const isExpanded = expandedJuz === juz;
                const endPage = juz < 30 ? JUZ_DATA[juz].startPage - 1 : 604;

                // Calculate Hizb pages (each Juz has 2 Hizbs)
                const hizb1Start = startPage;
                const hizbMid = Math.floor((startPage + endPage) / 2);
                const hizb2Start = hizbMid + 1;

                // Each Hizb has 4 Arba' (quarters)
                const makeArba = (hStart: number, hEnd: number) => {
                    const range = hEnd - hStart;
                    return [
                        { label: 'الربع الأول', page: hStart },
                        { label: 'الربع الثاني', page: hStart + Math.floor(range / 4) },
                        { label: 'الربع الثالث', page: hStart + Math.floor(range / 2) },
                        { label: 'الربع الرابع', page: hStart + Math.floor(range * 3 / 4) },
                    ];
                };

                return (
                    <div key={juz} className="animate-listItemEnter" style={{ animationDelay: `${juz * 15}ms` }}>
                        {/* Juz Header */}
                        <div
                            onClick={() => setExpandedJuz(isExpanded ? null : juz)}
                            className="w-full flex items-center justify-between p-3.5 hover:bg-bg-secondary/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <span className="text-primary font-bold text-sm">{juz}</span>
                                </div>
                                <div className="text-right">
                                    <h4 className="font-bold text-text-primary text-sm">الجزء {new Intl.NumberFormat('ar-EG').format(juz)}</h4>
                                    <p className="text-[11px] text-text-tertiary mt-0.5">{JUZ_NAMES[juz - 1]} • ص {startPage}-{endPage}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    onClick={(e) => { e.stopPropagation(); handlePageClick(startPage); }}
                                    className="text-[10px] text-primary bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                                >
                                    انتقال
                                </span>
                                <i className={`fas fa-chevron-down text-xs text-text-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                            </div>
                        </div>

                        {/* Expanded Hizb/Arba' content */}
                        {isExpanded && (
                            <div className="pb-2 px-3 animate-fadeIn">
                                <JuzHeaderDecoration className="mb-2 opacity-50" />

                                {/* Hizb 1 */}
                                <div className="mr-6 mb-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-6 h-6 bg-secondary/10 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-circle text-[6px] text-secondary"></i>
                                        </div>
                                        <span className="text-xs font-bold text-secondary">الحزب {(juz - 1) * 2 + 1}</span>
                                        <span className="text-[10px] text-text-tertiary">ص {hizb1Start}</span>
                                    </div>
                                    <div className="mr-8 space-y-0.5">
                                        {makeArba(hizb1Start, hizbMid).map((arba, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handlePageClick(arba.page)}
                                                className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-bg-secondary transition-colors text-right"
                                            >
                                                <span className="text-[11px] text-text-secondary">{arba.label}</span>
                                                <span className="text-[10px] text-text-tertiary">ص {arba.page}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Hizb 2 */}
                                <div className="mr-6">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-6 h-6 bg-secondary/10 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-circle text-[6px] text-secondary"></i>
                                        </div>
                                        <span className="text-xs font-bold text-secondary">الحزب {(juz - 1) * 2 + 2}</span>
                                        <span className="text-[10px] text-text-tertiary">ص {hizb2Start}</span>
                                    </div>
                                    <div className="mr-8 space-y-0.5">
                                        {makeArba(hizb2Start, endPage).map((arba, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handlePageClick(arba.page)}
                                                className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-bg-secondary transition-colors text-right"
                                            >
                                                <span className="text-[11px] text-text-secondary">{arba.label}</span>
                                                <span className="text-[10px] text-text-tertiary">ص {arba.page}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <Panel id={PanelType.Index} title="الفهرس">
            {/* Tab Selector */}
            <div className="p-3 sticky top-0 bg-bg-primary z-20 border-b border-border">
                <div className="flex bg-bg-secondary rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('surahs')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'surahs'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        <i className="fas fa-book-quran ml-1.5"></i>
                        فهرس السور
                    </button>
                    <button
                        onClick={() => setActiveTab('juz')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'juz'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        <i className="fas fa-layer-group ml-1.5"></i>
                        الأجزاء والأحزاب
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'surahs' ? renderSurahTab() : renderJuzTab()}
        </Panel>
    );
};

export default IndexPanel;