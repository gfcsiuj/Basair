import React, { useMemo } from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';
import { TOTAL_PAGES } from '../../constants';

// SVG decorative element for cards
const CardDeco = () => (
    <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
    </svg>
);

const SVG = {
    play: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z',
    cal: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    heart: 'M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    stats: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z',
    loop: 'M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3',
    quran: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    quote: 'M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z'
};

const DashboardPanel: React.FC = () => {
    const { state, actions } = useApp();
    const { khatmahs, currentPage, surahs, readingLog, activePanel } = state;

    const stats = useMemo(() => {
        const activeKhatmah = khatmahs.find(k => !k.completed);
        const today = new Date().toISOString().split('T')[0];
        const todayPages = readingLog[today]?.length || 0;
        const lastReadSurah = surahs.find(s => s.pages[0] <= currentPage && s.pages[s.pages.length - 1] >= currentPage);

        let dailyTarget = 0;
        if (activeKhatmah) {
            const todayDate = new Date();
            const startDate = new Date(activeKhatmah.startDate);
            const daysElapsed = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
            const remainingDays = Math.max(0, activeKhatmah.duration - daysElapsed);
            const remainingPages = TOTAL_PAGES - activeKhatmah.pagesRead;
            dailyTarget = remainingDays > 0 ? Math.ceil(remainingPages / remainingDays) : remainingPages;
        }

        return { activeKhatmah, todayPages, lastReadSurah, dailyTarget };
    }, [khatmahs, currentPage, surahs, readingLog, activePanel]);

    const ayahOfTheDay = useMemo(() => {
        const dailyVerses = [
            { text: "\u0671\u0647\u0652\u062f\u0650\u0646\u0631\u0627 \u0671\u0644\u0635\u0651\u0650\u0631\u064e\u0670\u0637\u064e \u0671\u0644\u0652\u0645\u064f\u0633\u0652\u062a\u064e\u0642\u0650\u064a\u0645\u064e", ref: "\u0627\u0644\u0641\u0627\u062a\u062d\u0629: 6", key: "1:6" },
            { text: "\u0625\u0650\u0646\u0651\u064e \u0645\u064e\u0639\u064e \u0671\u0644\u0652\u0639\u064f\u0633\u0652\u0631\u0650 \u064a\u064f\u0633\u0652\u0631\u064b\u0627", ref: "\u0627\u0644\u0634\u0631\u062d: 6", key: "94:6" },
            { text: "\u0625\u0650\u0646\u0651\u064e \u0671\u0644\u0644\u0651\u064e\u0647\u064e \u0645\u064e\u0639\u064e \u0671\u0644\u0635\u0651\u064e\u0640\u0670\u0628\u0650\u0631\u0650\u064a\u0646\u064e", ref: "\u0627\u0644\u0628\u0642\u0631\u0629: 153", key: "2:153" },
            { text: "\u0648\u064e\u0644\u064e\u0633\u064e\u0648\u0652\u0641\u064e \u064a\u064f\u0639\u0652\u0637\u0650\u064a\u0643\u064e \u0631\u064e\u0628\u0651\u064f\u0643\u064e \u0641\u064e\u062a\u064e\u0631\u0652\u0636\u064e\u0649\u0670\u06e4", ref: "\u0627\u0644\u0636\u062d\u0649: 5", key: "93:5" },
            { text: "\u0648\u064e\u0642\u064f\u0644 \u0631\u0651\u064e\u0628\u0651\u0650 \u0632\u0650\u062f\u0652\u0646\u0650\u0649 \u0639\u0650\u0644\u0652\u0645\u064b\u0627", ref: "\u0637\u0647: 114", key: "20:114" },
            { text: "\u0623\u064e\u0644\u064e\u0627 \u0628\u0650\u0630\u0650\u0643\u0652\u0631\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u062a\u064e\u0637\u0652\u0645\u064e\u0626\u0650\u0646\u0651\u064f \u0671\u0644\u0652\u0642\u064f\u0644\u064f\u0648\u0628\u064f", ref: "\u0627\u0644\u0631\u0639\u062f: 28", key: "13:28" },
        ];
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        return dailyVerses[dayOfYear % dailyVerses.length];
    }, []);

    const shortcuts = [
        { id: 'khatmahs', icon: SVG.cal, label: '\u0627\u0644\u062e\u062a\u0645\u0627\u062a', panel: PanelType.Khatmahs, color: 'text-teal-500', bg: 'bg-teal-500/10' },
        { id: 'bookmarks', icon: SVG.heart, label: '\u0627\u0644\u0645\u0641\u0636\u0644\u0629', panel: PanelType.Bookmarks, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { id: 'stats', icon: SVG.stats, label: '\u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a', panel: PanelType.Statistics, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'tasbeeh', icon: SVG.loop, label: '\u0627\u0644\u062a\u0633\u0628\u064a\u062d', panel: PanelType.Tasbeeh, color: 'text-green-500', bg: 'bg-green-500/10' },
    ];

    return (
        <Panel id={PanelType.Dashboard} title={'\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645'}>
            <div className="p-4 space-y-4 pb-8">

                {/* Greeting & Date */}
                <div className="flex justify-between items-end px-1 pt-2 animate-listItemEnter" style={{ animationDelay: '50ms' }}>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">{'\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064a\u0643\u0645'} \u0650\u060c</h2>
                        <p className="text-sm text-text-tertiary mt-0.5">{'\u062a\u0642\u0628\u0644 \u0627\u0644\u0644\u0647 \u0637\u0627\u0639\u062a\u0643\u0645'}</p>
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-full">
                            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>

                {/* Continue Reading Card */}
                <div
                    className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 rounded-2xl shadow-lg shadow-emerald-700/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all animate-listItemEnter group"
                    style={{ animationDelay: '100ms' }}
                    onClick={() => actions.openPanel(null)}
                >
                    <CardDeco />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={SVG.quran} /></svg>
                                <p className="text-[11px] font-medium tracking-wide">{'\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0642\u0631\u0627\u0621\u0629'}</p>
                            </div>
                            <h3 className="text-2xl font-bold font-arabic">{stats.lastReadSurah?.name_arabic || '\u0627\u0644\u0641\u0627\u062a\u062d\u0629'}</h3>
                        </div>
                        <div className="text-center bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 group-hover:bg-white/15 transition-colors">
                            <p className="text-[10px] opacity-80 mb-0.5">{'\u0635\u0641\u062d\u0629'}</p>
                            <h3 className="text-2xl font-bold tabular-nums">{currentPage}</h3>
                        </div>
                    </div>
                </div>

                {/* Khatmah Progress Card */}
                {stats.activeKhatmah && (
                    <div className="relative overflow-hidden bg-bg-secondary p-5 rounded-2xl border border-border/40 animate-listItemEnter" style={{ animationDelay: '150ms' }}>
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={SVG.cal} />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-text-primary">{'\u0627\u0644\u062e\u062a\u0645\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629'}</h4>
                                <p className="text-[11px] text-text-tertiary">{stats.activeKhatmah.name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-center mb-3">
                            <div className="bg-bg-primary rounded-xl p-3 border border-border/30">
                                <p className="text-xs text-text-secondary mb-1">{'\u0648\u0650\u0631\u062f \u0627\u0644\u064a\u0648\u0645'}</p>
                                <p className="font-bold text-xl text-primary tabular-nums">
                                    {stats.todayPages} <span className="text-[10px] text-text-tertiary font-normal">/ {stats.dailyTarget}</span>
                                </p>
                            </div>
                            <div className="bg-bg-primary rounded-xl p-3 border border-border/30">
                                <p className="text-xs text-text-secondary mb-1">{'\u0627\u0644\u0645\u062a\u0628\u0642\u064a'}</p>
                                <p className="font-bold text-xl text-text-primary tabular-nums">
                                    {TOTAL_PAGES - stats.activeKhatmah.pagesRead} <span className="text-[10px] text-text-tertiary font-normal">{'\u0635\u0641\u062d\u0629'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-teal-500 h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${(stats.activeKhatmah.pagesRead / TOTAL_PAGES) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Ayah of the Day */}
                <div className="relative overflow-hidden bg-bg-secondary p-5 rounded-2xl border border-border/40 text-center animate-listItemEnter" style={{ animationDelay: '200ms' }}>
                    <svg className="w-8 h-8 mx-auto text-primary/20 mb-3" fill="currentColor" viewBox="0 0 24 24"><path d={SVG.quote} /></svg>
                    <p className="font-arabic text-xl leading-loose text-text-primary mb-3">"{ayahOfTheDay.text}"</p>
                    <div className="inline-block px-3 py-1 bg-primary/10 rounded-full">
                        <p className="text-[11px] font-bold text-primary">{ayahOfTheDay.ref}</p>
                    </div>
                </div>

                {/* Shortcuts Grid */}
                <div>
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3 px-1">{'\u0648\u0635\u0648\u0644 \u0633\u0631\u064a\u0639'}</h4>
                    <div className="grid grid-cols-4 gap-2 text-center animate-listItemEnter" style={{ animationDelay: '250ms' }}>
                        {shortcuts.map(item => (
                            <button
                                key={item.id}
                                onClick={() => actions.openPanel(item.panel)}
                                className="group flex flex-col items-center justify-center p-3 bg-bg-secondary rounded-2xl hover:bg-bg-tertiary hover:border-border transition-all border border-transparent active:scale-95 gap-2"
                            >
                                <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-text-primary">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Panel>
    );
};

export default DashboardPanel;