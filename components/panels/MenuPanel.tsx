import React, { useState, useEffect, useMemo, useRef } from 'react';
import Panel from './Panel';
import { Panel as PanelType, ReadingMode, TasbeehCounter } from '../../types';
import { useApp } from '../../hooks/useApp';
import { TOTAL_PAGES } from '../../constants';

// SVG paths for menu icons
const SVG: Record<string, string> = {
    dash: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
    stats: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    heart: 'M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    trophy: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.004 6.004 0 01-2.27.91m0 0a6 6 0 01-4 0m4 0a5.972 5.972 0 01-2 .346 5.972 5.972 0 01-2-.346',
    list: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
    cal: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    dua: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
    loop: 'M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3',
    clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    pen: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
    down: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
    gear: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    mic: 'M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z',
};
const CLR: Record<string, string> = {
    dash: 'bg-blue-500/10 text-blue-500', stats: 'bg-orange-500/10 text-orange-500', heart: 'bg-pink-500/10 text-pink-500',
    trophy: 'bg-yellow-500/10 text-yellow-500', list: 'bg-purple-500/10 text-purple-500', cal: 'bg-teal-500/10 text-teal-500',
    book: 'bg-rose-500/10 text-rose-500', dua: 'bg-indigo-500/10 text-indigo-500', loop: 'bg-green-500/10 text-green-500',
    clock: 'bg-emerald-500/10 text-emerald-500', pen: 'bg-amber-500/10 text-amber-500', down: 'bg-cyan-500/10 text-cyan-500',
    gear: 'bg-gray-500/10 text-gray-500', mic: 'bg-emerald-500/10 text-emerald-500',
};
type MI = { k: string; t: string; s: string; p?: PanelType; rm?: ReadingMode; n?: boolean };
const SECTIONS: { title: string; items: MI[] }[] = [
    {
        title: '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629', items: [
            { k: 'dash', t: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645', s: '\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0639\u0644\u0649 \u062a\u0642\u062f\u0645\u0643', p: PanelType.Dashboard },
            { k: 'stats', t: '\u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a', s: '\u062a\u0627\u0628\u0639 \u062a\u0642\u062f\u0645\u0643 \u0641\u064a \u0627\u0644\u0642\u0631\u0627\u0621\u0629', p: PanelType.Statistics },
            { k: 'heart', t: '\u0627\u0644\u0645\u0641\u0636\u0644\u0629', s: '\u0622\u064a\u0627\u062a\u0643 \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0629', p: PanelType.Bookmarks },
            { k: 'trophy', t: '\u0627\u0644\u0625\u0646\u062c\u0627\u0632\u0627\u062a', s: '\u062a\u0627\u0628\u0639 \u0625\u0646\u062c\u0627\u0632\u0627\u062a\u0643', p: PanelType.Achievements },
        ]
    },
    {
        title: '\u0627\u0644\u062a\u0635\u0641\u062d \u0648\u0627\u0644\u0639\u0628\u0627\u062f\u0629', items: [
            { k: 'mic', t: 'التسميع الصوتي', s: 'اختبر حفظك باستخدام التسميع الصوتي', rm: ReadingMode.Memorization, n: true },
            { k: 'list', t: '\u0627\u0644\u0641\u0647\u0631\u0633 \u0627\u0644\u0645\u0648\u0636\u0648\u0639\u064a', s: '\u062a\u0635\u0641\u062d \u0627\u0644\u0622\u064a\u0627\u062a \u062d\u0633\u0628 \u0627\u0644\u0645\u0648\u0636\u0648\u0639', p: PanelType.ThematicIndex },
            { k: 'cal', t: '\u0627\u0644\u062e\u062a\u0645\u0627\u062a', s: '\u0623\u0646\u0634\u0626 \u0648\u062a\u0627\u0628\u0639 \u062e\u062a\u0645\u0627\u062a\u0643', p: PanelType.Khatmahs },
            { k: 'book', t: '\u0623\u062d\u0627\u062f\u064a\u062b \u0646\u0628\u0648\u064a\u0629', s: '\u0623\u062d\u0627\u062f\u064a\u062b \u0645\u0639 \u0627\u0644\u0634\u0631\u062d \u0648\u0627\u0644\u0641\u0648\u0627\u0626\u062f', p: PanelType.Hadith },
            { k: 'dua', t: '\u0627\u0644\u0623\u062f\u0639\u064a\u0629', s: '\u0623\u062f\u0639\u064a\u0629 \u0645\u0646 \u0627\u0644\u0642\u0631\u0622\u0646 \u0648\u0627\u0644\u0633\u0646\u0629', p: PanelType.Supplications },
            { k: 'loop', t: '\u0627\u0644\u062a\u0633\u0628\u064a\u062d', s: '\u0639\u062f\u0627\u062f \u0627\u0644\u062a\u0633\u0628\u064a\u062d \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a', p: PanelType.Tasbeeh },
        ]
    },
    {
        title: '\u0623\u062f\u0648\u0627\u062a', items: [
            { k: 'clock', t: '\u0623\u0648\u0642\u0627\u062a \u0627\u0644\u0635\u0644\u0627\u0629', s: '\u0627\u0644\u0642\u0628\u0644\u0629 \u0648\u0645\u0648\u0627\u0642\u064a\u062a \u0627\u0644\u0635\u0644\u0627\u0629', p: PanelType.PrayerTimes },
            { k: 'pen', t: '\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a', s: '\u062f\u0648\u0646 \u0645\u0644\u0627\u062d\u0638\u0627\u062a\u0643 \u0648\u062a\u0623\u0645\u0644\u0627\u062a\u0643', p: PanelType.Notes },
            { k: 'down', t: '\u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0628\u062f\u0648\u0646 \u0627\u0646\u062a\u0631\u0646\u062a', s: '\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0633\u0648\u0631 \u0648\u0627\u0644\u062a\u0644\u0627\u0648\u0627\u062a', p: PanelType.OfflineManager },
            { k: 'gear', t: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', s: '\u062a\u062e\u0635\u064a\u0635 \u0645\u0638\u0647\u0631 \u0627\u0644\u062a\u0637\u0628\u064a\u0642', p: PanelType.Settings },
        ]
    },
];

export const MenuPanel: React.FC = () => {
    const { actions } = useApp();
    return (
        <Panel id={PanelType.Menu} title="القائمة الرئيسية">
            <div className="p-3 space-y-5 pb-6">
                {SECTIONS.map((sec, si) => (
                    <div key={sec.title} className="animate-listItemEnter" style={{ animationDelay: `${si * 80}ms` }}>
                        <div className="flex items-center gap-2 px-1 mb-2.5">
                            <h3 className="text-xs font-bold text-text-tertiary tracking-wider">{sec.title}</h3>
                            <div className="flex-1 h-px bg-border/50"></div>
                        </div>
                        <div className="space-y-1">
                            {sec.items.map((item, ii) => (
                                <button key={item.k} onClick={() => {
                                    if (item.rm) {
                                        actions.setReadingMode(item.rm);
                                    } else if (item.p) {
                                        actions.openPanel(item.p);
                                    }
                                }}
                                    className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-bg-secondary active:scale-[0.98] transition-all group animate-listItemEnter"
                                    style={{ animationDelay: `${si * 80 + ii * 40}ms` }}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${CLR[item.k] || 'bg-primary/10 text-primary'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG[item.k]} />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-right min-w-0">
                                        <div className="flex items-center gap-2 justify-end">
                                            {item.n && <span className="text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">جديد</span>}
                                            <h4 className="font-bold text-sm text-text-primary">{item.t}</h4>
                                        </div>
                                        <p className="text-[11px] text-text-tertiary mt-0.5">{item.s}</p>
                                    </div>
                                    <svg className="w-4 h-4 text-text-tertiary/50 group-hover:text-primary transition-colors shrink-0 rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
};

const EmptyState: React.FC<{ icon: string; title: string; subtitle: string; cta?: React.ReactNode }> = ({ icon, title, subtitle, cta }) => (
    <div className="text-center py-10 px-4 text-text-secondary flex flex-col items-center justify-center h-full">
        <i className={`fas ${icon} text-4xl mb-4`}></i>
        <p className="font-bold text-lg">{title}</p>
        <p className="text-sm">{subtitle}</p>
        {cta && <div className="mt-6">{cta}</div>}
    </div>
);

// --- Statistics Panel ---
export const StatisticsPanel: React.FC = () => {
    const { state } = useApp();
    const { readingLog, bookmarks, notes, khatmahs } = state;

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayPages = readingLog[today]?.length || 0;

        let weekPages = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            weekPages += readingLog[dateStr]?.length || 0;
        }

        const activeKhatmah = khatmahs.find(k => !k.completed);
        const khatmahProgress = activeKhatmah ? (activeKhatmah.pagesRead / TOTAL_PAGES) * 100 : 0;

        return { todayPages, weekPages, bookmarksCount: bookmarks.length, notesCount: notes.length, khatmahProgress };
    }, [readingLog, bookmarks, notes, khatmahs]);

    const StatCard: React.FC<{ icon: string; value: string | number; label: string; bg: string; color: string; delay: number }> = ({ icon, value, label, bg, color, delay }) => (
        <div className="bg-bg-secondary p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-border/40 hover:border-primary/20 transition-colors animate-scaleIn text-center" style={{ animationDelay: `${delay}ms` }}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg} ${color}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
            </div>
            <div>
                <p className="text-3xl font-bold tabular-nums text-text-primary mt-1">{value}</p>
                <p className="text-[11px] font-bold text-text-tertiary mt-1">{label}</p>
            </div>
        </div>
    );

    return (
        <Panel id={PanelType.Statistics} title={'\u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a'}>
            <div className="p-4 space-y-4 pb-8">

                {/* Highlighted Progress Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-700 text-white p-5 rounded-2xl shadow-lg shadow-orange-600/20 animate-scaleIn">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="font-bold text-sm opacity-90">{'\u062a\u0642\u062f\u0645 \u0627\u0644\u062e\u062a\u0645\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629'}</h4>
                                <p className="text-[10px] opacity-70 mt-0.5">{'\u0646\u0633\u0628\u0629 \u0627\u0644\u0625\u0646\u062c\u0627\u0632 \u0645\u0646 \u0627\u0644\u0645\u0635\u062d\u0641 \u0643\u0627\u0645\u0644\u0627\u064b'}</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                                <p className="font-bold text-lg tabular-nums">{stats.khatmahProgress.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                            <div className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${stats.khatmahProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        icon={SVG.book}
                        value={stats.todayPages}
                        label={'\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u064a\u0648\u0645'}
                        bg="bg-indigo-500/10" color="text-indigo-500" delay={50}
                    />
                    <StatCard
                        icon={SVG.cal}
                        value={stats.weekPages}
                        label={'\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0623\u0633\u0628\u0648\u0639'}
                        bg="bg-blue-500/10" color="text-blue-500" delay={100}
                    />
                    <StatCard
                        icon={SVG.heart}
                        value={stats.bookmarksCount}
                        label={'\u0622\u064a\u0629 \u0645\u0641\u0636\u0644\u0629'}
                        bg="bg-pink-500/10" color="text-pink-500" delay={150}
                    />
                    <StatCard
                        icon={SVG.pen}
                        value={stats.notesCount}
                        label={'\u0645\u0644\u0627\u062d\u0638\u0629 \u0645\u062f\u0648\u0646\u0629'}
                        bg="bg-amber-500/10" color="text-amber-500" delay={200}
                    />
                </div>
            </div>
        </Panel>
    );
}

// --- Tasbeeh Panel ---
const TasbeehModal: React.FC<{
    counter?: TasbeehCounter | null;
    onClose: () => void;
}> = ({ counter, onClose }) => {
    const { actions } = useApp();
    const [name, setName] = useState(counter?.name || '');
    const [target, setTarget] = useState(counter?.target || 33);
    const mode = counter ? 'edit' : 'add';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (mode === 'add') {
            actions.addTasbeehCounter({ name, target });
        } else if (counter) {
            actions.updateTasbeehCounterDetails(counter.id, { name, target });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-bg-primary rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-scaleIn border border-border/50" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-6 text-text-primary flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                    </div>
                    {mode === 'add' ? '\u0639\u062f\u0627\u062f \u062c\u062f\u064a\u062f' : '\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0639\u062f\u0627\u062f'}
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-text-secondary mb-1.5 block">{'\u0627\u0633\u0645 \u0627\u0644\u0630\u0643\u0631'}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={'\u0633\u0628\u062d\u0627\u0646 \u0627\u0644\u0644\u0647\u060c \u0627\u0644\u062d\u0645\u062f \u0644\u0644\u0647...'} className="w-full bg-bg-secondary border border-border/50 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" required />
                    </div>
                    <div>
                        <label className="text-sm text-text-secondary mb-1.5 block">{'\u0627\u0644\u0647\u062f\u0641'}</label>
                        <input type="number" value={target} onChange={e => setTarget(parseInt(e.target.value))} min="1" className="w-full bg-bg-secondary border border-border/50 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" required />
                    </div>
                </div>
                <div className="flex gap-3 mt-8">
                    <button type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">{'\u062d\u0641\u0638'}</button>
                    <button type="button" onClick={onClose} className="flex-1 bg-bg-secondary text-text-primary font-bold py-3 rounded-xl border border-border/50 hover:bg-bg-tertiary active:scale-95 transition-all">{'\u0625\u0644\u063a\u0627\u0621'}</button>
                </div>
            </form>
        </div>
    );
};

export const TasbeehPanel: React.FC = () => {
    const { state, actions } = useApp();
    const { tasbeehCounters } = state;
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; counter?: TasbeehCounter | null }>({ isOpen: false });
    const isInitialLoad = useRef(true);
    const [activeCounterId, setActiveCounterId] = useState<string | null>(null);

    const sortedCounters = useMemo(() => [...tasbeehCounters].sort((a, b) => a.name.localeCompare(b.name, 'ar')), [tasbeehCounters]);

    useEffect(() => {
        const hasCounters = sortedCounters.length > 0;

        if (!hasCounters) {
            if (activeCounterId !== null) setActiveCounterId(null);
            return;
        }

        const activeCounterExists = sortedCounters.some(c => c.id === activeCounterId);

        if (!activeCounterExists) {
            const lastActiveId = localStorage.getItem('lastActiveTasbeehId');
            const lastActiveCounter = sortedCounters.find(c => c.id === lastActiveId);

            if (lastActiveCounter) {
                setActiveCounterId(lastActiveCounter.id);
            } else {
                setActiveCounterId(sortedCounters[0].id);
            }
        }
    }, [sortedCounters, activeCounterId]);

    useEffect(() => {
        if (activeCounterId) {
            localStorage.setItem('lastActiveTasbeehId', activeCounterId);
        } else if (tasbeehCounters.length === 0) {
            localStorage.removeItem('lastActiveTasbeehId');
        }
    }, [activeCounterId, tasbeehCounters.length]);

    useEffect(() => {
        if (isInitialLoad.current && tasbeehCounters.length === 0) {
            actions.addTasbeehCounter({ name: "\u0633\u0628\u062d\u0627\u0646 \u0627\u0644\u0644\u0647", target: 33 });
            actions.addTasbeehCounter({ name: "\u0627\u0644\u062d\u0645\u062f \u0644\u0644\u0647", target: 33 });
            actions.addTasbeehCounter({ name: "\u0627\u0644\u0644\u0647 \u0623\u0643\u0628\u0631", target: 33 });
        }
        isInitialLoad.current = false;
    }, [actions, tasbeehCounters.length]);

    const activeCounter = useMemo(() => tasbeehCounters.find(c => c.id === activeCounterId), [activeCounterId, tasbeehCounters]);

    const handleIncrement = () => {
        if (!activeCounter) return;
        try { window.navigator.vibrate(10); } catch (e) { }
        const newCount = activeCounter.count + 1;
        actions.updateTasbeehCounter(activeCounter.id, newCount);

        if (newCount >= activeCounter.target) {
            try { window.navigator.vibrate([100, 30, 100]); } catch (e) { }
            const currentIndex = sortedCounters.findIndex(c => c.id === activeCounter.id);
            if (currentIndex > -1 && sortedCounters.length > 1) {
                const nextIndex = (currentIndex + 1) % sortedCounters.length;
                setActiveCounterId(sortedCounters[nextIndex].id);
            }
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0630\u0643\u0631\u061f')) {
            if (activeCounterId === id) {
                setActiveCounterId(null);
            }
            actions.deleteTasbeehCounter(id);
        }
    };

    const handleResetAll = () => {
        if (window.confirm('\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u062c\u0645\u064a\u0639 \u0627\u0644\u0639\u062f\u0627\u062f\u0627\u062a \u0625\u0644\u0649 \u0627\u0644\u0635\u0641\u0631\u061f')) {
            actions.resetAllTasbeehCounters();
        }
    };

    const progress = activeCounter ? (activeCounter.target > 0 ? (activeCounter.count / activeCounter.target) * 100 : 0) : 0;
    const circumference = 2 * Math.PI * 120; // Radius is 120
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    const headerActions = (
        <button onClick={handleResetAll} className="w-8 h-8 flex items-center justify-center bg-bg-secondary rounded-full border border-border/50 text-text-secondary hover:text-primary transition-colors" title={'\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u0643\u0644'}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        </button>
    );

    return (
        <Panel id={PanelType.Tasbeeh} title={'\u0627\u0644\u062a\u0633\u0628\u064a\u062d'} headerActions={headerActions}>
            <div className="flex flex-col h-full bg-bg-primary">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2.5">
                    {sortedCounters.map((counter, index) => {
                        const isActive = activeCounterId === counter.id;
                        return (
                            <div key={counter.id} onClick={() => setActiveCounterId(counter.id)} className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex items-center justify-between group animate-listItemEnter ${isActive ? 'bg-primary/5 border-primary/50 shadow-md shadow-primary/5' : 'bg-bg-secondary border-border/20 hover:border-primary/30'}`} style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-border/50 text-text-tertiary'}`}>
                                        <span className="font-bold tabular-nums text-sm">{Math.round((counter.count / counter.target) * 100)}%</span>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm mb-1 ${isActive ? 'text-primary' : 'text-text-primary'}`}>{counter.name}</h4>
                                        <p className="text-xs font-medium text-text-tertiarytabular-nums">{counter.count} <span className="opacity-50">/</span> {counter.target}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setModalConfig({ isOpen: true, counter }); }} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                                    </button>
                                    <button onClick={(e) => handleDelete(counter.id, e)} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-tertiary hover:bg-red-500/10 hover:text-red-500 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={() => setModalConfig({ isOpen: true })} className="w-full flex items-center justify-center gap-2 p-4 mt-2 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 text-text-secondary hover:text-primary transition-all font-bold">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        {'\u0625\u0636\u0627\u0641\u0629 \u0630\u0643\u0631 \u062c\u062f\u064a\u062f'}
                    </button>
                    <div className="h-6"></div> {/* Spacer for scroll */}
                </div>

                <div className="flex-shrink-0 flex flex-col items-center justify-center p-8 relative bg-bg-secondary rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-border/20 z-10">
                    {activeCounter ? (
                        <>
                            <div className="text-center mb-6">
                                <p className="text-xl font-bold text-text-primary transition-all duration-300" key={`${activeCounter.id}-name`}>
                                    {activeCounter.name}
                                </p>
                                <p className="text-sm font-medium text-text-tertiary mt-1">{'\u0627\u0644\u0647\u062f\u0641'}: {activeCounter.target}</p>
                            </div>

                            <div className="relative w-72 h-72 flex items-center justify-center">
                                {/* Subtle background pulse for active state */}
                                <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse blur-xl"></div>

                                <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 260 260">
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: 'var(--primary-light)', stopOpacity: 1 }} />
                                            <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 1 }} />
                                        </linearGradient>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="4" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    <circle cx="130" cy="130" r="120" stroke="currentColor" className="text-border/30" strokeWidth="6" fill="transparent" />
                                    <circle cx="130" cy="130" r="120" stroke="url(#progressGradient)" strokeWidth="12" fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500 ease-out" filter="url(#glow)" />
                                </svg>

                                <button
                                    onClick={handleIncrement}
                                    className="relative z-10 w-52 h-52 bg-gradient-to-br from-bg-primary to-bg-secondary rounded-full flex items-center justify-center text-primary shadow-[inset_0_-4px_10px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.1)] active:shadow-[inset_0_4px_10px_rgba(0,0,0,0.05),0_2px_5px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-primary/20 border border-border/40"
                                    aria-label={`\u0632\u064a\u0627\u062f\u0629 \u0639\u062f\u0627\u062f ${activeCounter.name}`}
                                >
                                    <span className="text-6xl font-black tabular-nums transition-all duration-300 tracking-tighter" key={`${activeCounter.id}-count`}>
                                        {activeCounter.count}
                                    </span>
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mt-8">
                                <button onClick={() => actions.resetTasbeehCounter(activeCounter.id)} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-bg-primary border border-border/50 text-sm font-bold text-text-secondary hover:text-primary hover:border-primary/30 transition-all active:scale-95 shadow-sm">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                    <span>{'\u062a\u0635\u0641\u064a\u0631'}</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full py-16">
                            <EmptyState
                                icon="fa-stream"
                                title={'\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u062f\u0627\u062f\u0627\u062a'}
                                subtitle={'\u0627\u0628\u062f\u0623 \u0628\u0625\u0636\u0627\u0641\u0629 \u0639\u062f\u0627\u062f \u062c\u062f\u064a\u062f \u0644\u062a\u062a\u0628\u0639 \u0623\u0630\u0643\u0627\u0631\u0643.'}
                            />
                        </div>
                    )}
                </div>
            </div>
            {modalConfig.isOpen && <TasbeehModal counter={modalConfig.counter} onClose={() => setModalConfig({ isOpen: false })} />}
        </Panel>
    );
};


// --- Notes Panel ---
export const NotesPanel: React.FC = () => {
    const { state, actions } = useApp();
    const { notes, noteVerseTarget } = state;
    const [editingNote, setEditingNote] = useState<any>(null); // Use a more specific type if needed
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        if (noteVerseTarget) {
            const surah = state.surahs.find(s => s.id === noteVerseTarget.chapter_id);
            setEditingNote({
                verseKey: noteVerseTarget.verse_key,
                verseText: noteVerseTarget.text_uthmani,
                surahName: surah?.name_arabic || '',
            });
            setNoteText('');
            actions.setState(s => ({ ...s, noteVerseTarget: null }));
        }
    }, [noteVerseTarget, state.surahs, actions]);

    const handleSave = () => {
        if (!noteText.trim() || !editingNote) return;
        if (editingNote.id) { // Editing existing note
            actions.updateNote({ ...editingNote, text: noteText });
        } else { // Creating new note
            actions.addNote({ ...editingNote, text: noteText });
        }
        setEditingNote(null);
        setNoteText('');
    };

    const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);

    if (editingNote) {
        return (
            <Panel id={PanelType.Notes} title={editingNote.id ? '\u062a\u0639\u062f\u064a\u0644 \u0645\u0644\u0627\u062d\u0638\u0629' : '\u0645\u0644\u0627\u062d\u0638\u0629 \u062c\u062f\u064a\u062f\u0629'}>
                <div className="p-4 flex flex-col h-full animate-fadeIn pb-8">
                    <div className="bg-bg-secondary p-4 rounded-2xl mb-4 border border-border/40 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                            <p className="text-xs font-bold">{editingNote.surahName} - {'\u0627\u0644\u0622\u064a\u0629'} {editingNote.verseKey.split(':')[1]}</p>
                        </div>
                        <p className="font-arabic text-xl leading-loose text-text-primary">{editingNote.verseText}</p>
                    </div>

                    <div className="flex-1 flex flex-col bg-bg-secondary rounded-2xl border border-border/40 overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-sm">
                        <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            className="flex-1 w-full bg-transparent border-none focus:ring-0 p-4 text-text-primary resize-none placeholder-text-tertiary text-sm leading-relaxed"
                            placeholder={'\u0627\u0643\u062a\u0628 \u062a\u0623\u0645\u0644\u0627\u062a\u0643 \u0647\u0646\u0627...'}
                            autoFocus
                        ></textarea>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button onClick={handleSave} className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                            </svg>
                            {'\u062d\u0641\u0638'}
                        </button>
                        <button onClick={() => setEditingNote(null)} className="bg-bg-secondary text-text-primary px-6 font-bold py-3.5 rounded-xl border border-border/50 hover:bg-bg-tertiary active:scale-[0.98] transition-all">
                            {'\u0625\u0644\u063a\u0627\u0621'}
                        </button>
                    </div>
                </div>
            </Panel>
        )
    }

    return (
        <Panel id={PanelType.Notes} title={'\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a'}>
            <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                {sortedNotes.length > 0 ? (
                    <div className="space-y-4 pb-8">
                        {sortedNotes.map((note, index) => (
                            <div key={note.id} className="bg-bg-secondary p-5 rounded-2xl border border-border/40 hover:border-primary/30 transition-colors group animate-listItemEnter" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-text-primary">{note.surahName}</p>
                                            <p className="text-[11px] text-text-tertiary mt-0.5">{'\u0627\u0644\u0622\u064a\u0629'} {note.verseKey.split(':')[1]}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingNote(note); setNoteText(note.text); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-primary text-text-tertiary hover:text-primary transition-colors border border-border/30 hover:border-primary/30 shadow-sm" title={'\u062a\u0639\u062f\u064a\u0644'}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>
                                        <button onClick={() => { if (window.confirm('\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629\u061f')) actions.deleteNote(note.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-primary text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors border border-border/30 hover:border-red-500/20 shadow-sm" title={'\u062d\u0630\u0641'}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-bg-primary/50 p-4 rounded-xl border border-border/20">
                                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{note.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full py-20 animate-fadeIn flex flex-col items-center justify-center">
                        <div className="w-24 h-24 mb-6 rounded-full bg-primary/5 flex items-center justify-center relative">
                            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
                            <svg className="w-10 h-10 text-primary/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">{'\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0644\u0627\u062d\u0638\u0627\u062a'}</h3>
                        <p className="text-sm text-text-tertiary text-center max-w-[200px] leading-relaxed mt-2">
                            {'\u0627\u0636\u063a\u0637 \u0645\u0637\u0648\u0644\u0627\u064b \u0639\u0644\u0649 \u0623\u064a \u0622\u064a\u0629 \u062b\u0645 \u0627\u062e\u062a\u0631 "\u0645\u0644\u0627\u062d\u0638\u0629" \u0644\u0644\u0628\u062f\u0621 \u0641\u064a \u062a\u062f\u0648\u064a\u0646 \u062a\u0623\u0645\u0644\u0627\u062a\u0643.'}
                        </p>
                    </div>
                )}
            </div>
        </Panel>
    );
};



const DefaultExport = MenuPanel;
export default DefaultExport;