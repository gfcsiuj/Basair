import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';

// SVG Icons
const SVG = {
    fajr: 'M20.25 17.252a9.758 9.758 0 01-13.368-8.624 9.753 9.753 0 0011.666 11.666 9.758 9.758 0 011.702-3.042z',
    sunrise: 'M12 3v2.25M12 18.75V21M3 12h2.25M18.75 12H21M5.636 5.636l1.591 1.591M16.773 16.773l1.591 1.591M5.636 18.364l1.591-1.591M16.773 7.227l1.591-1.591M12 15a3 3 0 100-6 3 3 0 000 6z',
    dhuhr: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    asr: 'M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z',
    maghrib: 'M20.25 17.25c-.217 0-.43-.016-.638-.046a9.753 9.753 0 01-10.963-10.963 9.758 9.758 0 00-1.07-1.125c-4.493-3.812-11.215-2.29-11.215 5.51A7.636 7.636 0 006.354 18.25c.01.077.027.151.042.227-.247-.197-.565-.333-.913-.37a3.75 3.75 0 00-2.316.59C2.08 17.846 1.157 16.735 1.157 15.28c0-3.13 2.532-5.666 5.662-5.666.257 0 .509.02.755.056a2.25 2.25 0 011.66-1.636 3.743 3.743 0 012.37.135 4.706 4.706 0 011.838.995c.571-.628 1.34-1.026 2.191-1.026 1.708 0 3.09 1.393 3.09 3.111v6.002c0 1.258.625 2.365 1.583 3.024z',
    isha: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
    location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
    compass: 'M12 21a9 9 0 100-18 9 9 0 000 18z M10.5 7.5L13.5 16.5M7.5 10.5l9 3',
    bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
};

const PrayerTimesPanel: React.FC = () => {
    const { state, actions } = useApp();
    const { prayerTimes, prayerTimesStatus, locationName, areNotificationsEnabled } = state;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (state.activePanel === PanelType.PrayerTimes && prayerTimesStatus === 'idle') {
            actions.loadPrayerTimes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.activePanel, prayerTimesStatus]);

    const formatTo12Hour = (time24: string): string => {
        if (!time24) return '';
        const [hour, minute] = time24.split(':');
        const date = new Date(2000, 0, 1, parseInt(hour, 10), parseInt(minute, 10));
        return date.toLocaleTimeString('ar', { hour: 'numeric', minute: 'numeric', hour12: true, numberingSystem: 'arab' });
    };

    const prayerNames = [
        { key: 'Fajr', name: '\u0627\u0644\u0641\u062c\u0631', icon: SVG.fajr, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { key: 'Sunrise', name: '\u0627\u0644\u0634\u0631\u0648\u0642', icon: SVG.sunrise, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { key: 'Dhuhr', name: '\u0627\u0644\u0638\u0647\u0631', icon: SVG.dhuhr, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        { key: 'Asr', name: '\u0627\u0644\u0639\u0635\u0631', icon: SVG.asr, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { key: 'Maghrib', name: '\u0627\u0644\u0645\u063a\u0631\u0628', icon: SVG.maghrib, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { key: 'Isha', name: '\u0627\u0644\u0639\u0634\u0627\u0621', icon: SVG.isha, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    const renderContent = () => {
        if (prayerTimesStatus === 'loading' || prayerTimesStatus === 'idle') {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-text-tertiary animate-fadeIn">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6"></div>
                    <p className="font-medium">{'\u062c\u0627\u0631\u064a \u062a\u062d\u062f\u064a\u062f \u0645\u0648\u0642\u0639\u0643 \u0648\u062c\u0644\u0628 \u0645\u0648\u0627\u0642\u064a\u062a \u0627\u0644\u0635\u0644\u0627\u0629...'}</p>
                </div>
            );
        }

        if (prayerTimesStatus === 'error') {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6 animate-scaleIn">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="font-bold text-lg text-text-primary mb-2">{'\u0641\u0634\u0644 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639.'}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{'\u064a\u0631\u062c\u0649 \u0627\u0644\u062a\u0623\u0643\u062f \u0645\u0646 \u062a\u0641\u0639\u064a\u0644 \u062e\u062f\u0645\u0629 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 \u0641\u064a \u0645\u062a\u0635\u0641\u062d\u0643 \u0648\u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.'}</p>
                </div>
            );
        }

        if (prayerTimesStatus === 'success' && prayerTimes) {
            return (
                <div className="space-y-3">
                    {prayerNames.map((prayer, index) => {
                        const time = prayerTimes[prayer.key as keyof typeof prayerTimes];
                        if (!time) return null;

                        // Check if it's the next prayer (simple heuristic based on current local time vs list order, actually complex so we skip active highlighting for now)

                        return (
                            <div key={prayer.key}
                                className="bg-bg-secondary p-4 rounded-2xl flex items-center justify-between border border-border/40 hover:border-primary/30 transition-colors group animate-listItemEnter"
                                style={{ animationDelay: `${index * 60}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${prayer.bg} ${prayer.color} group-hover:scale-110 transition-transform`}>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={prayer.icon} />
                                        </svg>
                                    </div>
                                    <span className="font-bold text-text-primary">{prayer.name}</span>
                                </div>
                                <span className="font-digital text-2xl font-bold text-primary tracking-wider tabular-nums">{formatTo12Hour(time)}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return null;
    };

    const timeString = currentTime.toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit', hour12: true, numberingSystem: 'arab' });
    const timeParts = timeString.split(' ');
    const mainTime = timeParts[0];
    const mainPeriod = timeParts.length > 1 ? timeParts[1] : '';


    return (
        <Panel id={PanelType.PrayerTimes} title={'\u0623\u0648\u0642\u0627\u062a \u0627\u0644\u0635\u0644\u0627\u0629'}>
            <div className="p-4 space-y-6 pb-8">
                {/* Header Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-900 text-white p-8 rounded-3xl shadow-xl shadow-indigo-900/20 text-center animate-scaleIn">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-end justify-center gap-2 font-digital text-white drop-shadow-lg mb-2" dir="rtl">
                            <h2 className="text-[5rem] font-bold tracking-tight leading-none">{mainTime}</h2>
                            {mainPeriod && <span className="text-3xl font-bold pb-3 opacity-90">{mainPeriod}</span>}
                        </div>
                        <p className="opacity-80 mt-1 font-display text-sm">
                            {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>

                        <div className="mt-6 flex flex-col items-center justify-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                                <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={SVG.location} />
                                </svg>
                                <span className="font-semibold text-sm drop-shadow-sm truncate max-w-[200px]">
                                    {locationName || '\u062c\u0627\u0631\u064a \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639...'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 animate-fadeIn" style={{ animationDelay: '100ms' }}>
                    {/* Qibla Direction Card */}
                    <div className="bg-bg-secondary p-5 rounded-3xl flex flex-col items-center justify-center text-center border border-border/40 hover:border-primary/20 transition-colors shadow-sm">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center relative mb-3 group">
                            <div className="absolute inset-0 border-[3px] border-primary/20 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>
                            <svg className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" style={{ transform: 'rotate(20deg)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0v-9m0 0l3-3m-3 3l-3-3" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-sm text-text-primary mb-1">{'\u0627\u062a\u062c\u0627\u0647 \u0627\u0644\u0642\u0628\u0644\u0629'}</h3>
                        <p className="text-[11px] text-text-tertiary font-medium">20° {'\u062c\u0646\u0648\u0628 \u0634\u0631\u0642'}</p>
                    </div>

                    {/* Notification Toggle */}
                    <div className="bg-bg-secondary p-5 rounded-3xl flex flex-col items-center justify-center text-center border border-border/40 hover:border-primary/20 transition-colors shadow-sm">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${areNotificationsEnabled ? 'bg-indigo-500/10 text-indigo-500' : 'bg-bg-tertiary text-text-tertiary'}`}>
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.bell} />
                            </svg>
                        </div>
                        <h3 className="font-bold text-sm text-text-primary mb-2">{'\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0627\u0644\u0635\u0644\u0627\u0629'}</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={areNotificationsEnabled}
                                onChange={actions.toggleNotifications}
                            />
                            <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>

                {/* Prayer Times List */}
                <div className="mt-4">
                    <h3 className="font-bold text-sm text-text-tertiary mb-3 px-2">{'\u0645\u0648\u0627\u0642\u064a\u062a \u0627\u0644\u064a\u0648\u0645'}</h3>
                    {renderContent()}
                </div>
            </div>
        </Panel>
    );
};

export default PrayerTimesPanel;