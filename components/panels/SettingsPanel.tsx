import React, { useMemo } from 'react';
import Panel from './Panel';
import { Panel as PanelType, Theme, Font } from '../../types';
import { useApp } from '../../hooks/useApp';

const SettingsPanel: React.FC = () => {
    const { state, actions } = useApp();

    const sortedReciters = useMemo(() => {
        const favorites = new Set(state.favoriteReciters);
        return [...state.reciters].sort((a, b) => {
            const aIsFav = favorites.has(a.id);
            const bIsFav = favorites.has(b.id);
            if (aIsFav && !bIsFav) return -1;
            if (!aIsFav && bIsFav) return 1;
            return a.reciter_name.localeCompare(b.reciter_name, 'ar');
        });
    }, [state.reciters, state.favoriteReciters]);

    const themes: { id: Theme; name: string; icon: string; color: string }[] = [
        { id: 'light', name: 'فاتح', icon: 'fa-sun', color: 'text-yellow-500' },
        { id: 'dark', name: 'داكن', icon: 'fa-moon', color: 'text-blue-400' },
        { id: 'sepia', name: 'سيبيا', icon: 'fa-coffee', color: 'text-amber-700' },
        { id: 'blue', name: 'أزرق', icon: 'fa-water', color: 'text-sky-500' },
    ];
    
    const fonts: { id: Font; name: string }[] = [
        { id: 'arabic', name: 'الخط العثماني' },
        { id: 'qpc-v1', name: 'خط النسخ (QPC v1)' },
        { id: 'indopak', name: 'هندي-باكستاني' },
        { id: 'noto', name: 'نسخ' },
    ];

    const settingCards = [
        {
            title: "المظهر",
            icon: "fa-palette",
            content: (
                <div className="grid grid-cols-2 gap-3">
                    {themes.map(theme => (
                         <button key={theme.id} onClick={() => actions.setTheme(theme.id)} className={`p-3 rounded-lg border-2 transition-all text-center ${state.theme === theme.id ? 'border-primary bg-primary/10' : 'border-border bg-bg-primary'}`}>
                            <i className={`fas ${theme.icon} ${theme.color} mb-1 text-lg`}></i>
                            <p className="text-sm font-medium text-text-primary">{theme.name}</p>
                        </button>
                    ))}
                </div>
            )
        },
        {
            title: "الخط",
            icon: "fa-font",
            content: (
                <div className="space-y-4">
                    <div>
                         <label className="block text-sm mb-2 text-text-secondary">نوع الخط</label>
                         <select value={state.font} onChange={(e) => actions.setFont(e.target.value as Font)} className="input w-full bg-bg-primary border-border focus:border-primary">
                            {fonts.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}
                         </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-2 text-text-secondary">حجم الخط</label>
                         <div className="flex items-center gap-4">
                            <span className="text-lg">أ</span>
                            <input type="range" min="16" max="36" step="1" value={state.fontSize} onChange={(e) => actions.setFontSize(parseInt(e.target.value))} className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-primary" />
                            <span className="text-3xl">أ</span>
                        </div>
                    </div>
                 </div>
            )
        },
        {
            title: "تفضيلات المحتوى والصوت",
            icon: "fa-user-cog",
            content: (
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm mb-2 text-text-secondary">القارئ</label>
                        <select value={state.selectedReciterId} onChange={(e) => actions.setReciter(parseInt(e.target.value))} className="input w-full bg-bg-primary border-border focus:border-primary">
                            {sortedReciters.map(reciter => <option key={reciter.id} value={reciter.id}>{state.favoriteReciters.includes(reciter.id) ? '⭐ ' : ''}{reciter.reciter_name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm mb-2 text-text-secondary">سرعة التلاوة ({state.playbackRate}x)</label>
                         <div className="flex items-center gap-4">
                            <i className="fas fa-tortoise"></i>
                            <input type="range" min="0.5" max="2" step="0.25" value={state.playbackRate} onChange={(e) => actions.setPlaybackRate(parseFloat(e.target.value))} className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-primary" />
                            <i className="fas fa-hare"></i>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm mb-2 text-text-secondary">التفسير</label>
                        <select value={state.selectedTafsirId} onChange={(e) => actions.setTafsir(parseInt(e.target.value))} className="input w-full bg-bg-primary border-border focus:border-primary">
                            {state.tafsirs.map(tafsir => <option key={tafsir.id} value={tafsir.id}>{tafsir.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-2 text-text-secondary">الترجمة</label>
                        <select value={state.selectedTranslationId} onChange={(e) => actions.setTranslation(parseInt(e.target.value))} className="input w-full bg-bg-primary border-border focus:border-primary">
                            {state.translations.map(translation => <option key={translation.id} value={translation.id}>{translation.name}</option>)}
                        </select>
                    </div>
                </div>
            )
        }
    ];

    return (
        <Panel id={PanelType.Settings} title="الإعدادات">
            <div className="p-4 space-y-6">
                {settingCards.map((card, index) => (
                     <div 
                        key={card.title} 
                        className="card bg-bg-secondary p-4 rounded-lg animate-listItemEnter"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <h3 className="font-bold mb-3 flex items-center gap-2 text-text-primary">
                            <i className={`fas ${card.icon} text-primary`}></i> {card.title}
                        </h3>
                        {card.content}
                    </div>
                ))}
            </div>
        </Panel>
    );
};

export default SettingsPanel;