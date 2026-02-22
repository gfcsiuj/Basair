import React, { useMemo } from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';
import { TOTAL_PAGES } from '../../constants';

const SVG = {
    play: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z',
    bookOpen: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    trophy: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871m-5.804 0h-.872c-.621 0-1.125.504-1.125 1.125v3.375m15-6.375v-1.5c0-1.242-1.008-2.25-2.25-2.25H4.5C3.258 8.25 2.25 9.258 2.25 10.5v1.5c0 1.242 1.008 2.25 2.25 2.25h15c1.242 0 2.25-1.008 2.25-2.25zm-20.25-3h18',
    fire: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.866 8.21 8.21 0 003 2.48z',
    bookmark: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z',
    heart: 'M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    flag: 'M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5',
    crown: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    calendarCheck: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z',
    calendarWeek: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    mosque: 'M12 4.5v15m7.5-10.5h-15m1.5 0v9m12-9v9m-7.5-10.5h-4.5m4.5 0h4.5m-4.5 0a3 3 0 00-3 3m3-3a3 3 0 013 3',
    lock: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
    checkCircle: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
};

interface Achievement {
    id: string;
    title: string;
    desc: string;
    icon: string;
    color: string;
    condition: (stats: any) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_page', title: '\u0627\u0644\u0628\u062f\u0627\u064a\u0629', desc: '\u0642\u0631\u0627\u0621\u0629 \u0623\u0648\u0644 \u0635\u0641\u062d\u0629', icon: SVG.play, color: 'from-blue-400 to-blue-600', condition: (s) => s.totalPages > 0 },
    { id: 'ten_pages', title: '\u0627\u0644\u0642\u0627\u0631\u0626 \u0627\u0644\u0645\u0628\u062a\u062f\u0626', desc: '\u0642\u0631\u0627\u0621\u0629 10 \u0635\u0641\u062d\u0627\u062a', icon: SVG.bookOpen, color: 'from-green-400 to-green-600', condition: (s) => s.totalPages >= 10 },
    { id: 'fifty_pages', title: '\u0627\u0644\u0642\u0627\u0631\u0626 \u0627\u0644\u0645\u062c\u062a\u0647\u062f', desc: '\u0642\u0631\u0627\u0621\u0629 50 \u0635\u0641\u062d\u0629', icon: SVG.star, color: 'from-yellow-400 to-yellow-600', condition: (s) => s.totalPages >= 50 },
    { id: 'juz_complete', title: '\u062c\u0632\u0621 \u0643\u0627\u0645\u0644', desc: '\u0642\u0631\u0627\u0621\u0629 \u062c\u0632\u0621 \u0643\u0627\u0645\u0644 (20 \u0635\u0641\u062d\u0629)', icon: SVG.trophy, color: 'from-purple-400 to-purple-600', condition: (s) => s.totalPages >= 20 },
    { id: 'hundred_pages', title: '\u0627\u0644\u0645\u062b\u0627\u0628\u0631', desc: '\u0642\u0631\u0627\u0621\u0629 100 \u0635\u0641\u062d\u0629', icon: SVG.fire, color: 'from-orange-400 to-orange-600', condition: (s) => s.totalPages >= 100 },
    { id: 'first_bookmark', title: '\u062d\u0627\u0641\u0638 \u0627\u0644\u0622\u064a\u0627\u062a', desc: '\u062d\u0641\u0638 \u0623\u0648\u0644 \u0622\u064a\u0629 \u0641\u064a \u0627\u0644\u0645\u0641\u0636\u0644\u0629', icon: SVG.bookmark, color: 'from-pink-400 to-pink-600', condition: (s) => s.bookmarks > 0 },
    { id: 'five_bookmarks', title: '\u062c\u0627\u0645\u0639 \u0627\u0644\u0622\u064a\u0627\u062a', desc: '\u062d\u0641\u0638 5 \u0622\u064a\u0627\u062a \u0641\u064a \u0627\u0644\u0645\u0641\u0636\u0644\u0629', icon: SVG.heart, color: 'from-rose-400 to-rose-600', condition: (s) => s.bookmarks >= 5 },
    { id: 'first_khatmah', title: '\u062e\u062a\u0645\u0629 \u062c\u062f\u064a\u062f\u0629', desc: '\u0628\u062f\u0621 \u0623\u0648\u0644 \u062e\u062a\u0645\u0629', icon: SVG.flag, color: 'from-cyan-400 to-cyan-600', condition: (s) => s.khatmahs > 0 },
    { id: 'khatmah_complete', title: '\u062e\u062a\u0645 \u0627\u0644\u0642\u0631\u0622\u0646', desc: '\u0625\u0643\u0645\u0627\u0644 \u062e\u062a\u0645\u0629 \u0643\u0627\u0645\u0644\u0629', icon: SVG.crown, color: 'from-amber-400 to-amber-500', condition: (s) => s.completedKhatmahs > 0 },
    { id: 'streak_3', title: '\u0627\u0644\u0645\u0648\u0627\u0638\u0628', desc: '\u0627\u0644\u0642\u0631\u0627\u0621\u0629 3 \u0623\u064a\u0627\u0645 \u0645\u062a\u062a\u0627\u0644\u064a\u0629', icon: SVG.calendarCheck, color: 'from-indigo-400 to-indigo-600', condition: (s) => s.streak >= 3 },
    { id: 'streak_7', title: '\u0623\u0633\u0628\u0648\u0639 \u0643\u0627\u0645\u0644', desc: '\u0627\u0644\u0642\u0631\u0627\u0621\u0629 7 \u0623\u064a\u0627\u0645 \u0645\u062a\u062a\u0627\u0644\u064a\u0629', icon: SVG.calendarWeek, color: 'from-emerald-400 to-emerald-600', condition: (s) => s.streak >= 7 },
    { id: 'half_quran', title: '\u0646\u0635\u0641 \u0627\u0644\u0642\u0631\u0622\u0646', desc: '\u0642\u0631\u0627\u0621\u0629 302 \u0635\u0641\u062d\u0629', icon: SVG.mosque, color: 'from-teal-400 to-teal-600', condition: (s) => s.totalPages >= 302 },
];

const AchievementsPanel: React.FC = () => {
    const { state } = useApp();

    const stats = useMemo(() => {
        const readingLog = state.readingLog || {};
        const allDays = Object.keys(readingLog).sort();
        const totalPages = new Set(allDays.flatMap(day => readingLog[day] || [])).size;

        // Calculate streak
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            if (readingLog[dateStr] && readingLog[dateStr].length > 0) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }

        return {
            totalPages,
            bookmarks: state.bookmarks.length,
            khatmahs: state.khatmahs.length,
            completedKhatmahs: state.khatmahs.filter(k => k.completed).length,
            streak,
            daysActive: allDays.filter(d => readingLog[d]?.length > 0).length,
        };
    }, [state.readingLog, state.bookmarks, state.khatmahs]);

    const unlockedCount = ACHIEVEMENTS.filter(a => a.condition(stats)).length;
    const progressPercent = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

    return (
        <Panel id={PanelType.Achievements} title={'\u0627\u0644\u0625\u0646\u062c\u0627\u0632\u0627\u062a'}>
            <div className="p-4 space-y-5 pb-8 h-full overflow-y-auto custom-scrollbar">
                {/* Overview Card */}
                <div className="bg-gradient-to-br from-primary to-primary-light text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-2xl font-black tabular-nums">{unlockedCount} / {ACHIEVEMENTS.length}</h3>
                                <p className="text-xs font-bold text-white/80">{'\u0625\u0646\u062c\u0627\u0632 \u0645\u0643\u062a\u0633\u0628'}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-2xl font-black tabular-nums">{stats.streak}</h3>
                                <p className="text-xs font-bold text-white/80">{'\u0623\u064a\u0627\u0645 \u0645\u062a\u062a\u0627\u0644\u064a\u0629'}</p>
                            </div>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2.5 p-0.5 backdrop-blur-sm">
                            <div className="bg-white rounded-full h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <p className="text-[11px] font-bold mt-2 opacity-90 text-center">{progressPercent}% {'\u0645\u0643\u062a\u0645\u0644'}</p>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-bg-secondary p-4 rounded-2xl border border-border/40 shadow-sm flex flex-col items-center justify-center">
                        <p className="text-xl font-black text-primary mb-1 tabular-nums animate-scaleIn">{stats.totalPages}</p>
                        <p className="text-[11px] font-bold text-text-tertiary">{'\u0635\u0641\u062d\u0629'}</p>
                    </div>
                    <div className="bg-bg-secondary p-4 rounded-2xl border border-border/40 shadow-sm flex flex-col items-center justify-center">
                        <p className="text-xl font-black text-primary mb-1 tabular-nums animate-scaleIn" style={{ animationDelay: '100ms' }}>{stats.daysActive}</p>
                        <p className="text-[11px] font-bold text-text-tertiary">{'\u064a\u0648\u0645 \u0646\u0634\u0637'}</p>
                    </div>
                    <div className="bg-bg-secondary p-4 rounded-2xl border border-border/40 shadow-sm flex flex-col items-center justify-center">
                        <p className="text-xl font-black text-primary mb-1 tabular-nums animate-scaleIn" style={{ animationDelay: '200ms' }}>{stats.completedKhatmahs}</p>
                        <p className="text-[11px] font-bold text-text-tertiary">{'\u062e\u062a\u0645\u0629 \u0645\u0643\u062a\u0645\u0644\u0629'}</p>
                    </div>
                </div>

                {/* Achievements List */}
                <div className="space-y-3">
                    <h4 className="font-bold text-sm text-text-primary px-1">{'\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0625\u0646\u062c\u0627\u0632\u0627\u062a'}</h4>
                    <div className="grid gap-3">
                        {ACHIEVEMENTS.map((achievement, i) => {
                            const isUnlocked = achievement.condition(stats);
                            return (
                                <div
                                    key={achievement.id}
                                    className={`flex items-center gap-4 p-4 rounded-3xl transition-all animate-listItemEnter border ${isUnlocked ? 'bg-bg-secondary border-border/40 shadow-sm' : 'bg-bg-tertiary/50 border-transparent opacity-60 grayscale-[0.5]'}`}
                                    style={{ animationDelay: `${i * 30}ms` }}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isUnlocked ? `bg-gradient-to-br ${achievement.color} text-white` : 'bg-bg-primary text-text-tertiary border border-border/50'}`}>
                                        <svg className="w-6 h-6" fill={isUnlocked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={isUnlocked ? 0 : 1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={isUnlocked ? achievement.icon : SVG.lock} />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[15px] font-bold mb-0.5 ${isUnlocked ? 'text-text-primary' : 'text-text-secondary'}`}>{achievement.title}</p>
                                        <p className="text-xs font-medium text-text-tertiary">{achievement.desc}</p>
                                    </div>
                                    {isUnlocked && (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 animate-scaleIn">
                                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.checkCircle} />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Panel>
    );
};

export default AchievementsPanel;
