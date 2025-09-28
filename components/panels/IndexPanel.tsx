import React from 'react';
import Panel from './Panel';
import { Panel as PanelType, Surah } from '../../types';
import { useApp } from '../../hooks/useApp';

const IndexPanel: React.FC = () => {
    const { state, actions } = useApp();

    const handleSurahClick = (surah: Surah) => {
        actions.loadPage(surah.pages[0]);
        actions.openPanel(null);
    };

    return (
        <Panel id={PanelType.Index} title="فهرس السور">
            <div className="divide-y divide-border">
                {state.surahs.map((surah, index) => (
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
                ))}
            </div>
        </Panel>
    );
};

export default IndexPanel;