import React, { useMemo } from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';
import { TOTAL_PAGES } from '../../constants';

const DashboardPanel: React.FC = () => {
    const { state, actions } = useApp();
    const { khatmahs, currentPage, surahs, readingLog, bookmarks } = state;

    const stats = useMemo(() => {
        const activeKhatmah = khatmahs.find(k => !k.completed);
        const today = new Date().toISOString().split('T')[0];
        const todayPages = readingLog[today]?.length || 0;
        const lastReadSurah = surahs.find(s => s.pages[0] <= currentPage && s.pages[1] >= currentPage);
        
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
    }, [khatmahs, currentPage, surahs, readingLog]);

    const ayahOfTheDay = useMemo(() => {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const verseKey = `${(dayOfYear % 114) + 1}:${(dayOfYear % 20) + 1}`;
        // This is a placeholder, a real implementation would fetch this verse data.
        return {
            text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
            ref: "الفاتحة: ٦",
            key: "1:6"
        };
    }, []);

    const shortcuts = [
        { icon: 'fa-calendar-check', label: 'الختمات', panel: PanelType.Khatmahs },
        { icon: 'fa-bookmark', label: 'المفضلة', panel: PanelType.Bookmarks },
        { icon: 'fa-chart-line', label: 'الإحصائيات', panel: PanelType.Statistics },
        { icon: 'fa-stream', label: 'التسبيح', panel: PanelType.Tasbeeh },
    ];

    return (
        <Panel id={PanelType.Dashboard} title="الرئيسية">
            <div className="p-4 space-y-4">
                {/* Continue Reading Card */}
                <div 
                    className="bg-gradient-to-l from-primary to-primary-light text-white p-4 rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => actions.openPanel(null)}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm opacity-80">متابعة القراءة</p>
                            <h3 className="text-xl font-bold">{stats.lastReadSurah?.name_arabic || '...'}</h3>
                        </div>
                        <div className="text-right">
                             <p className="text-sm opacity-80">صفحة</p>
                             <h3 className="text-2xl font-bold">{currentPage}</h3>
                        </div>
                    </div>
                </div>

                {/* Khatmah Progress Card */}
                {stats.activeKhatmah && (
                    <div className="bg-bg-secondary p-4 rounded-lg">
                        <h4 className="font-bold text-sm text-text-secondary mb-2">تقدم الختمة: {stats.activeKhatmah.name}</h4>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="font-bold text-lg text-primary">{stats.todayPages}</p>
                                <p className="text-xs text-text-secondary">صفحات اليوم</p>
                            </div>
                            <div>
                                <p className="font-bold text-lg text-primary">{stats.dailyTarget}</p>
                                <p className="text-xs text-text-secondary">الهدف اليومي</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ayah of the Day */}
                <div className="bg-bg-secondary p-4 rounded-lg">
                    <h4 className="font-bold text-sm text-text-secondary mb-2">آية اليوم</h4>
                    <p className="font-arabic text-xl text-center text-text-primary mb-2">"{ayahOfTheDay.text}"</p>
                    <p className="text-xs text-center text-text-tertiary">{ayahOfTheDay.ref}</p>
                </div>

                {/* Shortcuts */}
                 <div className="grid grid-cols-4 gap-3 text-center">
                    {shortcuts.map(item => (
                        <button key={item.label} onClick={() => actions.openPanel(item.panel)} className="flex flex-col items-center justify-center p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors space-y-2">
                            <i className={`fas ${item.icon} text-xl text-primary`}></i>
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </Panel>
    );
};

export default DashboardPanel;