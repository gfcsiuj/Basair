import React from 'react';
import Panel from './Panel';
import { Panel as PanelType, Theme } from '../../types';
import { useApp } from '../../hooks/useApp';

const PRESET_COLORS = [
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#ec4899', '#f43f5e', '#f97316', '#eab308',
    '#84cc16', '#14b8a6', '#6366f1', '#a855f7',
];

const SettingsPanel: React.FC = () => {
    const { state, actions } = useApp();

    const themes: { id: Theme; name: string; icon: string; desc: string; preview: string[] }[] = [
        { id: 'light', name: 'فاتح', icon: 'fa-sun', desc: 'المظهر الافتراضي', preview: ['#ffffff', '#10b981', '#f3f4f6'] },
        { id: 'dark', name: 'داكن', icon: 'fa-moon', desc: 'مريح للعين ليلاً', preview: ['#0f172a', '#34d399', '#334155'] },
        { id: 'classic', name: 'كلاسيكي', icon: 'fa-book', desc: 'طابع المصحف القديم', preview: ['#fef9ef', '#92400e', '#fce9c0'] },
        { id: 'custom', name: 'مخصص', icon: 'fa-palette', desc: 'اختر لونك المفضل', preview: ['#ffffff', state.customThemeColor, '#f3f4f6'] },
    ];

    const currentReciter = state.reciters.find(r => r.id === state.selectedReciterId);
    const currentTafsir = state.tafsirs.find(t => t.id === state.selectedTafsirId);
    const currentTranslation = state.translations.find(t => t.id === state.selectedTranslationId);

    const SettingRow: React.FC<{ icon: string; label: string; desc?: string; children: React.ReactNode }> = ({ icon, label, desc, children }) => (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <i className={`fas ${icon} text-primary text-sm`}></i>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{label}</p>
                    {desc && <p className="text-[11px] text-text-tertiary truncate">{desc}</p>}
                </div>
            </div>
            <div className="shrink-0 mr-1">{children}</div>
        </div>
    );

    const SelectorButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
        <button onClick={onClick} className="flex items-center gap-1.5 text-xs text-primary bg-primary/8 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors max-w-[10rem]">
            <span className="truncate">{label}</span>
            <i className="fas fa-chevron-left text-[8px] shrink-0"></i>
        </button>
    );

    return (
        <Panel id={PanelType.Settings} title="الإعدادات">
            <div className="p-4 space-y-4 pb-8">

                {/* === المظهر === */}
                <div className="card bg-bg-secondary p-4 rounded-xl animate-listItemEnter" style={{ animationDelay: '0ms' }}>
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-text-primary text-sm">
                        <i className="fas fa-palette text-primary"></i> المظهر
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        {themes.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => actions.setTheme(theme.id)}
                                className={`p-2 rounded-xl border-2 transition-all text-center ${state.theme === theme.id ? 'border-primary shadow-md shadow-primary/20' : 'border-border'}`}
                            >
                                {/* Mini preview */}
                                <div className="flex gap-0.5 justify-center mb-1.5">
                                    {theme.preview.map((c, i) => (
                                        <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }}></div>
                                    ))}
                                </div>
                                <p className="text-[11px] font-medium text-text-primary">{theme.name}</p>
                            </button>
                        ))}
                    </div>

                    {/* Color picker for custom theme */}
                    {state.theme === 'custom' && (
                        <div className="mt-4 pt-3 border-t border-border">
                            <p className="text-xs text-text-secondary mb-2">اختر اللون الأساسي:</p>
                            <div className="color-picker-grid">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`color-swatch ${state.customThemeColor === color ? 'active' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => actions.setCustomColor(color)}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <label className="text-xs text-text-tertiary">لون مخصص:</label>
                                <input
                                    type="color"
                                    value={state.customThemeColor}
                                    onChange={(e) => actions.setCustomColor(e.target.value)}
                                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                                />
                                <span className="text-xs text-text-tertiary font-mono">{state.customThemeColor}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* === القراءة === */}
                <div className="card bg-bg-secondary p-4 rounded-xl animate-listItemEnter" style={{ animationDelay: '50ms' }}>
                    <h3 className="font-bold mb-1 flex items-center gap-2 text-text-primary text-sm">
                        <i className="fas fa-book-open text-primary"></i> القراءة
                    </h3>
                    <div className="divide-y divide-border/50">
                        <SettingRow icon="fa-layer-group" label="عرض آية بآية" desc="عرض كل آية في سطر منفصل">
                            <div
                                className={`toggle-switch ${state.isVerseByVerseLayout ? 'active' : ''}`}
                                onClick={actions.toggleVerseByVerseLayout}
                            ></div>
                        </SettingRow>
                    </div>
                </div>

                {/* === الصوت === */}
                <div className="card bg-bg-secondary p-4 rounded-xl animate-listItemEnter" style={{ animationDelay: '100ms' }}>
                    <h3 className="font-bold mb-1 flex items-center gap-2 text-text-primary text-sm">
                        <i className="fas fa-headphones text-primary"></i> الصوت
                    </h3>
                    <div className="divide-y divide-border/50">
                        <SettingRow icon="fa-microphone" label="القارئ" desc={currentReciter?.reciter_name}>
                            <SelectorButton
                                label={currentReciter?.reciter_name || 'اختر'}
                                onClick={() => actions.setState(s => ({ ...s, isReciterModalOpen: true }))}
                            />
                        </SettingRow>
                        <SettingRow icon="fa-gauge-high" label="سرعة التلاوة" desc={`${state.playbackRate}x`}>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => actions.setPlaybackRate(Math.max(0.5, state.playbackRate - 0.25))}
                                    className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center text-text-secondary hover:text-primary text-xs"
                                >
                                    <i className="fas fa-minus"></i>
                                </button>
                                <span className="text-sm font-bold text-primary w-10 text-center">{state.playbackRate}x</span>
                                <button
                                    onClick={() => actions.setPlaybackRate(Math.min(2, state.playbackRate + 0.25))}
                                    className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center text-text-secondary hover:text-primary text-xs"
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                        </SettingRow>
                    </div>
                </div>

                {/* === المحتوى === */}
                <div className="card bg-bg-secondary p-4 rounded-xl animate-listItemEnter" style={{ animationDelay: '150ms' }}>
                    <h3 className="font-bold mb-1 flex items-center gap-2 text-text-primary text-sm">
                        <i className="fas fa-file-alt text-primary"></i> المحتوى
                    </h3>
                    <div className="divide-y divide-border/50">
                        <SettingRow icon="fa-book-quran" label="التفسير">
                            <SelectorButton
                                label={currentTafsir?.name || 'اختر'}
                                onClick={() => actions.setState(s => ({ ...s, isTafsirModalOpen: true }))}
                            />
                        </SettingRow>
                        <SettingRow icon="fa-language" label="الترجمة">
                            <SelectorButton
                                label={currentTranslation?.name || 'اختر'}
                                onClick={() => actions.setState(s => ({ ...s, isTranslationModalOpen: true }))}
                            />
                        </SettingRow>
                    </div>
                </div>

                {/* === الإشعارات === */}
                <div className="card bg-bg-secondary p-4 rounded-xl animate-listItemEnter" style={{ animationDelay: '200ms' }}>
                    <h3 className="font-bold mb-1 flex items-center gap-2 text-text-primary text-sm">
                        <i className="fas fa-bell text-primary"></i> الإشعارات
                    </h3>
                    <div className="divide-y divide-border/50">
                        <SettingRow icon="fa-mosque" label="إشعارات الصلاة" desc="تنبيه عند دخول وقت الصلاة">
                            <div
                                className={`toggle-switch ${state.areNotificationsEnabled ? 'active' : ''}`}
                                onClick={() => actions.toggleNotifications()}
                            ></div>
                        </SettingRow>
                    </div>
                </div>

                {/* === حول التطبيق === */}
                <div className="card bg-bg-secondary p-4 rounded-xl animate-listItemEnter" style={{ animationDelay: '250ms' }}>
                    <h3 className="font-bold mb-1 flex items-center gap-2 text-text-primary text-sm">
                        <i className="fas fa-info-circle text-primary"></i> حول التطبيق
                    </h3>
                    <div className="divide-y divide-border/50">
                        <SettingRow icon="fa-code-branch" label="الإصدار" desc="بصائر v2.0">
                            <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-1 rounded-full">2.0.0</span>
                        </SettingRow>
                        <SettingRow icon="fa-heart" label="مفتوح المصدر" desc="مبني بـ React + TypeScript">
                            <i className="fas fa-external-link-alt text-text-tertiary text-xs"></i>
                        </SettingRow>
                    </div>
                </div>

            </div>
        </Panel>
    );
};

export default SettingsPanel;