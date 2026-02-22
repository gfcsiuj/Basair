import React from 'react';
import Panel from './Panel';
import { Panel as PanelType, Theme } from '../../types';
import { useApp } from '../../hooks/useApp';

const PRESET_COLORS = [
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#ec4899', '#f43f5e', '#f97316', '#eab308',
    '#84cc16', '#14b8a6', '#6366f1', '#a855f7',
];

const SVG = {
    sun: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    moon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
    book: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    palette: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.879-3.879a1.5 1.5 0 10-2.12-2.122l-3.88 3.88a15.996 15.996 0 00-4.645 4.761m-3.418-3.418a15.996 15.996 0 014.761-4.645l3.88-3.88a1.5 1.5 0 10-2.12-2.122l-3.88 3.88a15.995 15.995 0 00-4.648 4.765m3.42 3.42a15.995 15.995 0 01-1.622 3.395m-3.388 1.62a15.998 15.998 0 01-3.388-1.62m3.388 1.62a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395',
    layer: 'M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.236-.027.47-.05.711-.071M6 6.878C3.06 7.22 1.5 8.35 1.5 10.5c0 1.94 1.16 2.97 3.32 3.4M18 6.878c.236-.027.47-.05.711-.071M18 6.878c2.94.342 4.5 1.472 4.5 3.622 0 1.94-1.16 2.97-3.32 3.4m-14.36-.032c1.06.2 2.37.33 3.86.38v3.382a2.25 2.25 0 002.25 2.25h3.75a2.25 2.25 0 002.25-2.25V14.25c1.49-.05 2.8-.18 3.86-.38m-14.36-.032c2.05-.385 3.5-.945 3.5-1.588 0-.643-1.45-1.203-3.5-1.588',
    mic: 'M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z',
    speed: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
    tafsir: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    lang: 'M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.246.035 3.371.106m-3.371-.106v1.5m0-1.516V3m0 0h.01m-1.343 0h.01M12 11.625l-2.046 2.046M9.375 11.25c.66.66 1.345 1.353 2.022 2.063M9.375 11.25a17.072 17.072 0 01-3.136-4.5h3.636M3.375 8.25a17.037 17.037 0 003.565 5.541',
    mosque: 'M12 4.5v15m7.5-10.5h-15m1.5 0v9m12-9v9m-7.5-10.5h-4.5m4.5 0h4.5m-4.5 0a3 3 0 00-3 3m3-3a3 3 0 013 3',
    version: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
    heart: 'M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    link: 'M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
    chevron: 'M15.75 19.5L8.25 12l7.5-7.5',
    minus: 'M19.5 12h-15',
    plus: 'M12 4.5v15m7.5-7.5h-15'
};

const SettingsPanel: React.FC = () => {
    const { state, actions } = useApp();

    const themes: { id: Theme; name: string; icon: string; desc: string; preview: string[] }[] = [
        { id: 'light', name: '\u0641\u0627\u062a\u062d', icon: SVG.sun, desc: '\u0627\u0644\u0645\u0638\u0647\u0631 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a', preview: ['#ffffff', '#10b981', '#f3f4f6'] },
        { id: 'dark', name: '\u062f\u0627\u0643\u0646', icon: SVG.moon, desc: '\u0645\u0631\u064a\u062d \u0644\u0644\u0639\u064a\u0646 \u0644\u064a\u0644\u0627\u064b', preview: ['#0f172a', '#34d399', '#334155'] },
        { id: 'classic', name: '\u0643\u0644\u0627\u0633\u064a\u0643\u064a', icon: SVG.book, desc: '\u0637\u0627\u0628\u0639 \u0627\u0644\u0645\u0635\u062d\u0641 \u0627\u0644\u0642\u062f\u064a\u0645', preview: ['#fcf1e3', '#92400e', '#f3e1c6'] },
        { id: 'custom', name: '\u0645\u062e\u0635\u0635', icon: SVG.palette, desc: '\u0627\u062e\u062a\u0631 \u0644\u0648\u0646\u0643 \u0627\u0644\u0645\u0641\u0636\u0644', preview: ['#ffffff', state.customThemeColor, '#f3f4f6'] },
    ];

    const currentReciter = state.reciters.find(r => r.id === state.selectedReciterId);
    const currentTafsir = state.tafsirs.find(t => t.id === state.selectedTafsirId);
    const currentTranslation = state.translations.find(t => t.id === state.selectedTranslationId);

    const SettingRow: React.FC<{ icon: string; label: string; desc?: string; children: React.ReactNode }> = ({ icon, label, desc, children }) => (
        <div className="flex items-center justify-between py-3.5 px-1 group">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-[14px] bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-text-primary">{label}</p>
                    {desc && <p className="text-[11px] font-medium text-text-tertiary truncate mt-0.5">{desc}</p>}
                </div>
            </div>
            <div className="shrink-0 mr-3">{children}</div>
        </div>
    );

    const SelectorButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
        <button onClick={onClick} className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors max-w-[12rem] font-bold active:scale-95 shadow-sm">
            <span className="truncate">{label}</span>
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.chevron} />
            </svg>
        </button>
    );

    const CustomToggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 text-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border/50"></div>
        </label>
    );

    return (
        <Panel id={PanelType.Settings} title={'\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a'}>
            <div className="p-4 space-y-5 pb-8 overflow-y-auto custom-scrollbar h-full">

                {/* === المظهر === */}
                <div className="bg-bg-secondary p-5 rounded-3xl border border-border/40 shadow-sm animate-listItemEnter" style={{ animationDelay: '0ms' }}>
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-text-primary text-sm px-1">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.palette} />
                        </svg>
                        {'\u0627\u0644\u0645\u0638\u0647\u0631'}
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                        {themes.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => actions.setTheme(theme.id)}
                                className={`p-2.5 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-2 hover:bg-bg-primary/50 ${state.theme === theme.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border/60 hover:border-primary/30'}`}
                            >
                                {/* Mini preview rings */}
                                <div className="flex -space-x-1.5 space-x-reverse justify-center">
                                    {theme.preview.map((c, i) => (
                                        <div key={i} className="w-4 h-4 rounded-full border border-border/20 shadow-sm" style={{ backgroundColor: c, zIndex: 10 - i }}></div>
                                    ))}
                                </div>
                                <p className={`text-[11px] font-bold ${state.theme === theme.id ? 'text-primary' : 'text-text-primary'}`}>{theme.name}</p>
                            </button>
                        ))}
                    </div>

                    {/* Color picker for custom theme */}
                    {state.theme === 'custom' && (
                        <div className="mt-5 pt-4 border-t border-border/40 animate-fadeIn">
                            <p className="text-xs font-bold text-text-secondary mb-3 px-1">{'\u0627\u062e\u062a\u0631 \u0627\u0644\u0644\u0648\u0646 \u0627\u0644\u0623\u0633\u0627\u0633\u064a:'}</p>
                            <div className="grid grid-cols-6 gap-2 mb-4">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`w-full aspect-square rounded-xl shadow-sm transition-transform hover:scale-110 flex items-center justify-center ${state.customThemeColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg-secondary scale-110' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => actions.setCustomColor(color)}
                                    >
                                        {state.customThemeColor === color && (
                                            <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 bg-bg-primary p-3 rounded-2xl border border-border/50">
                                <label className="text-xs font-bold text-text-primary flex-1">{'\u0644\u0648\u0646 \u0645\u062e\u0635\u0635:'}</label>
                                <span className="text-xs font-mono text-text-tertiary uppercase truncate max-w-[60px]">{state.customThemeColor}</span>
                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-border">
                                    <input
                                        type="color"
                                        value={state.customThemeColor}
                                        onChange={(e) => actions.setCustomColor(e.target.value)}
                                        className="w-16 h-16 -mt-4 -ml-4 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* === القراءة === */}
                <div className="bg-bg-secondary p-5 rounded-3xl border border-border/40 shadow-sm animate-listItemEnter" style={{ animationDelay: '50ms' }}>
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-text-primary text-sm px-1">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.layer} />
                        </svg>
                        {'\u0627\u0644\u0642\u0631\u0627\u0621\u0629'}
                    </h3>
                    <div className="divide-y divide-border/30">
                        <SettingRow icon={SVG.layer} label={'\u0639\u0631\u0636 \u0622\u064a\u0629 \u0628\u0622\u064a\u0629'} desc={'\u0639\u0631\u0636 \u0643\u0644 \u0622\u064a\u0629 \u0641\u064a \u0633\u0637\u0631 \u0645\u0646\u0641\u0635\u0644'}>
                            <CustomToggle checked={state.isVerseByVerseLayout} onChange={actions.toggleVerseByVerseLayout} />
                        </SettingRow>
                    </div>
                </div>

                {/* === الصوت === */}
                <div className="bg-bg-secondary p-5 rounded-3xl border border-border/40 shadow-sm animate-listItemEnter" style={{ animationDelay: '100ms' }}>
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-text-primary text-sm px-1">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.mic} />
                        </svg>
                        {'\u0627\u0644\u0635\u0648\u062a'}
                    </h3>
                    <div className="divide-y divide-border/30">
                        <SettingRow icon={SVG.mic} label={'\u0627\u0644\u0642\u0627\u0631\u0626'} desc={currentReciter?.reciter_name}>
                            <SelectorButton
                                label={currentReciter?.reciter_name || '\u0627\u062e\u062a\u0631'}
                                onClick={() => actions.setState(s => ({ ...s, isReciterModalOpen: true }))}
                            />
                        </SettingRow>
                        <SettingRow icon={SVG.speed} label={'\u0633\u0631\u0639\u0629 \u0627\u0644\u062a\u0644\u0627\u0648\u0629'} desc={`${state.playbackRate}x`}>
                            <div className="flex items-center gap-1.5 bg-bg-primary rounded-full p-1 border border-border/50">
                                <button
                                    onClick={() => actions.setPlaybackRate(Math.max(0.5, state.playbackRate - 0.25))}
                                    className="w-7 h-7 rounded-full hover:bg-bg-tertiary flex items-center justify-center text-text-secondary hover:text-primary transition-colors active:scale-90"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={SVG.minus} />
                                    </svg>
                                </button>
                                <span className="text-[13px] font-bold text-primary w-8 text-center tabular-nums">{state.playbackRate}x</span>
                                <button
                                    onClick={() => actions.setPlaybackRate(Math.min(2, state.playbackRate + 0.25))}
                                    className="w-7 h-7 rounded-full hover:bg-bg-tertiary flex items-center justify-center text-text-secondary hover:text-primary transition-colors active:scale-90"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={SVG.plus} />
                                    </svg>
                                </button>
                            </div>
                        </SettingRow>
                    </div>
                </div>

                {/* === المحتوى === */}
                <div className="bg-bg-secondary p-5 rounded-3xl border border-border/40 shadow-sm animate-listItemEnter" style={{ animationDelay: '150ms' }}>
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-text-primary text-sm px-1">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.book} />
                        </svg>
                        {'\u0627\u0644\u0645\u062d\u062a\u0648\u0649'}
                    </h3>
                    <div className="divide-y divide-border/30">
                        <SettingRow icon={SVG.tafsir} label={'\u0627\u0644\u062a\u0641\u0633\u064a\u0631'}>
                            <SelectorButton
                                label={currentTafsir?.name || '\u0627\u062e\u062a\u0631'}
                                onClick={() => actions.setState(s => ({ ...s, isTafsirModalOpen: true }))}
                            />
                        </SettingRow>
                        <SettingRow icon={SVG.lang} label={'\u0627\u0644\u062a\u0631\u062c\u0645\u0629'}>
                            <SelectorButton
                                label={currentTranslation?.name || '\u0627\u062e\u062a\u0631'}
                                onClick={() => actions.setState(s => ({ ...s, isTranslationModalOpen: true }))}
                            />
                        </SettingRow>
                    </div>
                </div>

                {/* === الإشعارات === */}
                <div className="bg-bg-secondary p-5 rounded-3xl border border-border/40 shadow-sm animate-listItemEnter" style={{ animationDelay: '200ms' }}>
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-text-primary text-sm px-1">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                        {'\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a'}
                    </h3>
                    <div className="divide-y divide-border/30">
                        <SettingRow icon={SVG.mosque} label={'\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0627\u0644\u0635\u0644\u0627\u0629'} desc={'\u062a\u0646\u0628\u064a\u0647 \u0639\u0646\u062f \u062f\u062e\u0648\u0644 \u0648\u0642\u062a \u0627\u0644\u0635\u0644\u0627\u0629'}>
                            <CustomToggle checked={state.areNotificationsEnabled} onChange={() => actions.toggleNotifications()} />
                        </SettingRow>
                    </div>
                </div>

                {/* === حول التطبيق === */}
                <div className="bg-bg-secondary p-5 rounded-3xl border border-border/40 shadow-sm animate-listItemEnter" style={{ animationDelay: '250ms' }}>
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-text-primary text-sm px-1">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        {'\u062d\u0648\u0644 \u0627\u0644\u062a\u0637\u0628\u064a\u0642'}
                    </h3>
                    <div className="divide-y divide-border/30">
                        <SettingRow icon={SVG.version} label={'\u0627\u0644\u0625\u0635\u062f\u0627\u0631'} desc={'\u0628\u0635\u0627\u0626\u0631 v2.0'}>
                            <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">2.0.0</span>
                        </SettingRow>
                        <SettingRow icon={SVG.heart} label={'\u0645\u0641\u062a\u0648\u062d \u0627\u0644\u0645\u0635\u062f\u0631'} desc={'\u0645\u0628\u0646\u064a \u0628\u0640 React + TypeScript'}>
                            <a href="#" className="w-8 h-8 rounded-full bg-bg-primary flex flex-col justify-center items-center text-text-tertiary hover:text-primary transition-colors group relative overflow-hidden active:scale-95 border border-border/50">
                                <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={SVG.link} />
                                </svg>
                            </a>
                        </SettingRow>
                    </div>
                </div>

            </div>
        </Panel>
    );
};

export default SettingsPanel;