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
    '\u0627\u0644\u0645', '\u0633\u064a\u0642\u0648\u0644', '\u062a\u0644\u0643 \u0627\u0644\u0631\u0633\u0644', '\u0644\u0646 \u062a\u0646\u0627\u0644\u0648\u0627', '\u0648\u0627\u0644\u0645\u062d\u0635\u0646\u0627\u062a',
    '\u0644\u0627 \u064a\u062d\u0628 \u0627\u0644\u0644\u0647', '\u0648\u0625\u0630\u0627 \u0633\u0645\u0639\u0648\u0627', '\u0648\u0644\u0648 \u0623\u0646\u0646\u0627', '\u0642\u0627\u0644 \u0627\u0644\u0645\u0644\u0623', '\u0648\u0627\u0639\u0644\u0645\u0648\u0627',
    '\u064a\u0639\u062a\u0630\u0631\u0648\u0646', '\u0648\u0645\u0627 \u0645\u0646 \u062f\u0627\u0628\u0629', '\u0648\u0645\u0627 \u0623\u0628\u0631\u0626', '\u0631\u0628\u0645\u0627', '\u0633\u0628\u062d\u0627\u0646 \u0627\u0644\u0630\u064a',
    '\u0642\u0627\u0644 \u0623\u0644\u0645', '\u0627\u0642\u062a\u0631\u0628', '\u0642\u062f \u0623\u0641\u0644\u062d', '\u0648\u0642\u0627\u0644 \u0627\u0644\u0630\u064a\u0646', '\u0623\u0645\u0646 \u062e\u0644\u0642',
    '\u0627\u062a\u0644 \u0645\u0627 \u0623\u0648\u062d\u064a', '\u0648\u0645\u0646 \u064a\u0642\u0646\u062a', '\u0648\u0645\u0627 \u0644\u064a', '\u0641\u0645\u0646 \u0623\u0638\u0644\u0645', '\u0625\u0644\u064a\u0647 \u064a\u0631\u062f',
    '\u062d\u0645', '\u0642\u0627\u0644 \u0641\u0645\u0627 \u062e\u0637\u0628\u0643\u0645', '\u0642\u062f \u0633\u0645\u0639 \u0627\u0644\u0644\u0647', '\u062a\u0628\u0627\u0631\u0643', '\u0639\u0645',
];

const SVG = {
    search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    chevronDown: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
    bookQuran: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    layerGroup: 'M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.236-.027.47-.05.711-.071M6 6.878C3.06 7.22 1.5 8.35 1.5 10.5c0 1.94 1.16 2.97 3.32 3.4M18 6.878c.236-.027.47-.05.711-.071M18 6.878c2.94.342 4.5 1.472 4.5 3.622 0 1.94-1.16 2.97-3.32 3.4m-14.36-.032c1.06.2 2.37.33 3.86.38v3.382a2.25 2.25 0 002.25 2.25h3.75a2.25 2.25 0 002.25-2.25V14.25c1.49-.05 2.8-.18 3.86-.38m-14.36-.032c2.05-.385 3.5-.945 3.5-1.588 0-.643-1.45-1.203-3.5-1.588',
    circle: 'M12 21a9 9 0 100-18 9 9 0 000 18z'
};

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
            surah.translated_name?.name?.toLowerCase().includes(query)
        );
    }, [state.surahs, searchQuery]);

    const renderSurahTab = () => (
        <>
            {/* Search Input */}
            <div className="px-4 py-3 sticky top-0 bg-bg-primary/80 backdrop-blur-md z-10 border-b border-border/50">
                <div className="relative group">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={'\u0627\u0628\u062d\u062b \u0639\u0646 \u0633\u0648\u0631\u0629...'}
                        className="w-full h-11 pr-11 pl-4 rounded-xl bg-bg-secondary border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all duration-300 shadow-sm"
                    />
                    <svg className="w-5 h-5 absolute top-1/2 right-4 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={SVG.search} />
                    </svg>
                </div>
            </div>

            {/* Surahs List */}
            <div className="p-2 space-y-1 pb-6 w-full max-w-[400px] mx-auto custom-scrollbar h-[calc(100vh-140px)] overflow-y-auto">
                {filteredSurahs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-secondary animate-fadeIn">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 rotate-12">
                            <svg className="w-8 h-8 text-primary -rotate-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.search} />
                            </svg>
                        </div>
                        <p className="font-bold text-lg">{'\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0633\u0648\u0631 \u0645\u0637\u0627\u0628\u0642\u0629'}</p>
                    </div>
                ) : (
                    filteredSurahs.map((surah, index) => (
                        <div
                            key={surah.id}
                            onClick={() => handleSurahClick(surah)}
                            className="group flex items-center justify-between p-3 rounded-2xl cursor-pointer hover:bg-bg-secondary/80 hover:shadow-sm border border-transparent hover:border-border/50 transition-all active:scale-[0.98] animate-listItemEnter"
                            style={{ animationDelay: `${Math.min(index * 20, 500)}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                {/* Surah number in decorative badge */}
                                <div className="w-11 h-11 flex items-center justify-center relative text-primary group-hover:scale-110 transition-transform duration-300">
                                    <IslamicStar size={44} />
                                    <span className="absolute font-bold text-xs">{surah.id}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-primary text-[15px] group-hover:text-primary transition-colors">{surah.name_arabic}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {surah.revelation_place === 'makkah' ? (
                                            <MakkiIcon size={13} className="text-amber-600" />
                                        ) : (
                                            <MadaniIcon size={13} className="text-emerald-600" />
                                        )}
                                        <span className="text-[11px] font-medium text-text-tertiary">
                                            {surah.revelation_place === 'makkah' ? '\u0645\u0643\u064a\u0629' : '\u0645\u062f\u0646\u064a\u0629'} • {surah.verses_count} {'\u0622\u064a\u0629'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[11px] font-bold text-text-secondary bg-primary/5 group-hover:bg-primary/10 border border-primary/10 px-2.5 py-1 rounded-lg transition-colors">
                                    {'\u0635'} {surah.pages[0]}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );

    const renderJuzTab = () => (
        <div className="p-3 space-y-2 pb-6 w-full max-w-[400px] mx-auto custom-scrollbar h-[calc(100vh-140px)] overflow-y-auto">
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
                        { label: '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u0623\u0648\u0644', page: hStart },
                        { label: '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u062b\u0627\u0646\u064a', page: hStart + Math.floor(range / 4) },
                        { label: '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u062b\u0627\u0644\u062b', page: hStart + Math.floor(range / 2) },
                        { label: '\u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u0631\u0627\u0628\u0639', page: hStart + Math.floor(range * 3 / 4) },
                    ];
                };

                return (
                    <div key={juz} className={`rounded-2xl border transition-all duration-300 overflow-hidden animate-listItemEnter ${isExpanded ? 'bg-bg-secondary border-primary/20 shadow-md' : 'bg-transparent border-transparent hover:bg-bg-secondary/50'}`} style={{ animationDelay: `${juz * 15}ms` }}>
                        {/* Juz Header */}
                        <div
                            onClick={() => setExpandedJuz(isExpanded ? null : juz)}
                            className="w-full flex items-center justify-between p-3.5 cursor-pointer group"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
                                    <span className="font-bold text-sm tabular-nums">{juz}</span>
                                </div>
                                <div className="text-right">
                                    <h4 className={`font-bold text-[15px] transition-colors ${isExpanded ? 'text-primary' : 'text-text-primary group-hover:text-primary'}`}>{'\u0627\u0644\u062c\u0632\u0621'} {new Intl.NumberFormat('ar-EG').format(juz)}</h4>
                                    <p className="text-[11px] font-medium text-text-tertiary mt-0.5">{JUZ_NAMES[juz - 1]} • {'\u0635'} {startPage}-{endPage}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    onClick={(e) => { e.stopPropagation(); handlePageClick(startPage); }}
                                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${isExpanded ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-bg-tertiary text-text-secondary hover:text-primary hover:bg-primary/10'}`}
                                >
                                    {'\u0627\u0646\u062a\u0642\u0627\u0644'}
                                </span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary/10' : 'bg-transparent'}`}>
                                    <svg className={`w-4 h-4 text-text-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={SVG.chevronDown} />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Hizb/Arba' content */}
                        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden px-4">
                                <div className="pt-2 border-t border-border/50">
                                    <JuzHeaderDecoration className="mb-4 opacity-70 w-full max-w-[150px] mx-auto" />

                                    <div className="flex gap-4">
                                        {/* Hizb 1 */}
                                        <div className="flex-1 bg-bg-primary/50 rounded-2xl p-3 border border-border/30">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
                                                <svg className="w-3.5 h-3.5 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d={SVG.circle} />
                                                </svg>
                                                <span className="text-xs font-bold text-secondary">{'\u0627\u0644\u062d\u0632\u0628'} {(juz - 1) * 2 + 1}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {makeArba(hizb1Start, hizbMid).map((arba, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handlePageClick(arba.page)}
                                                        className="w-full flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-bg-secondary hover:text-primary transition-colors text-right group relative overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <span className="text-[11px] font-medium text-text-secondary group-hover:text-primary relative z-10">{arba.label}</span>
                                                        <span className="text-[10px] font-bold text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded text-left min-w-[32px] group-hover:bg-primary/10 group-hover:text-primary relative z-10">
                                                            {arba.page}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Hizb 2 */}
                                        <div className="flex-1 bg-bg-primary/50 rounded-2xl p-3 border border-border/30">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
                                                <svg className="w-3.5 h-3.5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={SVG.circle} />
                                                </svg>
                                                <span className="text-xs font-bold text-secondary">{'\u0627\u0644\u062d\u0632\u0628'} {(juz - 1) * 2 + 2}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {makeArba(hizb2Start, endPage).map((arba, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handlePageClick(arba.page)}
                                                        className="w-full flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-bg-secondary hover:text-primary transition-colors text-right group relative overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <span className="text-[11px] font-medium text-text-secondary group-hover:text-primary relative z-10">{arba.label}</span>
                                                        <span className="text-[10px] font-bold text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded text-left min-w-[32px] group-hover:bg-primary/10 group-hover:text-primary relative z-10">
                                                            {arba.page}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <Panel id={PanelType.Index} title={'\u0627\u0644\u0641\u0647\u0631\u0633'}>
            {/* Tab Selector */}
            <div className="px-4 py-3 sticky top-0 bg-bg-primary/95 backdrop-blur z-20 shadow-sm border-b border-border/30">
                <div className="flex bg-bg-secondary rounded-2xl p-1.5 gap-1.5 border border-border/40">
                    <button
                        onClick={() => setActiveTab('surahs')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'surahs'
                            ? 'bg-white dark:bg-bg-primary text-primary shadow-sm border border-border/50'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.bookQuran} />
                        </svg>
                        {'\u0641\u0647\u0631\u0633 \u0627\u0644\u0633\u0648\u0631'}
                    </button>
                    <button
                        onClick={() => setActiveTab('juz')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'juz'
                            ? 'bg-white dark:bg-bg-primary text-primary shadow-sm border border-border/50'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.layerGroup} />
                        </svg>
                        {'\u0627\u0644\u0623\u062c\u0632\u0627\u0621 \u0648\u0627\u0644\u0623\u062d\u0632\u0627\u0628'}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'surahs' ? renderSurahTab() : renderJuzTab()}
        </Panel>
    );
};

export default IndexPanel;