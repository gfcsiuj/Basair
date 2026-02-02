import React, { useState, useMemo } from 'react';
import Panel from './Panel';
import { Panel as PanelType, Surah } from '../../types';
import { useApp } from '../../hooks/useApp';

const IndexPanel: React.FC = () => {
    const { state, actions } = useApp();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSurahClick = (surah: Surah) => {
        actions.loadPage(surah.pages[0]);
        actions.openPanel(null);
    };

    // Filter surahs based on search query
    const filteredSurahs = useMemo(() => {
        if (!searchQuery.trim()) {
            return state.surahs;
        }
        const query = searchQuery.trim().toLowerCase();
        return state.surahs.filter(surah =>
            surah.name_arabic.includes(query) ||
            surah.name_simple.toLowerCase().includes(query) ||
            surah.id.toString() === query ||
            surah.translated_name?.name?.includes(query)
        );
    }, [state.surahs, searchQuery]);

    return (
        <Panel id={PanelType.Index} title="فهرس السور">
            {/* Search Input */}
            <div className="p-4 sticky top-0 bg-bg-primary z-10 border-b border-border">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن سورة..."
                        className="input w-full pr-10 bg-bg-secondary border-border focus:border-primary"
                    />
                    <i className="fas fa-search absolute top-1/2 right-3 -translate-y-1/2 text-text-tertiary"></i>
                </div>
            </div>

            {/* Surahs List */}
            <div className="divide-y divide-border">
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
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-secondary transition-colors animate-listItemEnter"
                            style={{ animationDelay: `${index * 25}ms` }}
                        >
                            <div className="flex items-center gap-4">
                                <span className="w-10 h-10 flex items-center justify-center bg-bg-secondary text-primary rounded-lg font-bold text-sm">{surah.id}</span>
                                <div>
                                    <h4 className="font-bold text-text-primary text-lg">{surah.name_arabic}</h4>
                                    <p className="text-xs text-text-secondary">
                                        {surah.revelation_place === 'makkah' ? 'مكية' : 'مدنية'} • {surah.verses_count} آيات
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm text-text-secondary font-arabic">ص {surah.pages[0]}</span>
                        </div>
                    ))
                )}
            </div>
        </Panel>
    );
};

export default IndexPanel;