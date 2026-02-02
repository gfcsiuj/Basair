import React from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';
import { API_BASE } from '../../constants';

const thematicData = [
    {
        theme: "الصبر",
        icon: "fa-leaf",
        verses: ["2:153", "3:200", "8:46", "39:10"]
    },
    {
        theme: "الأنبياء",
        icon: "fa-user-check",
        verses: ["21:7", "6:83", "12:101", "3:33"]
    },
    {
        theme: "الأسرة",
        icon: "fa-users",
        verses: ["17:23", "30:21", "4:1", "66:6"]
    },
    {
        theme: "العلم",
        icon: "fa-book-open",
        verses: ["96:1-5", "20:114", "39:9", "58:11"]
    },
    {
        theme: "يوم القيامة",
        icon: "fa-balance-scale",
        verses: ["99:1-8", "82:1-5", "75:6-12", "22:1"]
    }
];

const ThematicIndexPanel: React.FC = () => {
    const { actions } = useApp();

    const handleVerseClick = async (verseKey: string) => {
        actions.openPanel(null);
        try {
            const verseData = await actions.fetchWithRetry<{ verse: { page_number: number } }>(`${API_BASE}/verses/by_key/${verseKey}`);
            actions.loadPage(verseData.verse.page_number);
        } catch (err) {
            console.error('Failed to get page for verse:', err);
            // Optionally show an error to the user
        }
    };
    
    return (
        <Panel id={PanelType.ThematicIndex} title="الفهرس الموضوعي">
            <div className="p-4 space-y-3">
                {thematicData.map((item, index) => (
                    <div key={item.theme} className="bg-bg-secondary rounded-lg overflow-hidden animate-listItemEnter" style={{ animationDelay: `${index * 50}ms` }}>
                        <details className="group">
                            <summary className="p-4 flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <i className={`fas ${item.icon} text-primary`}></i>
                                    <h4 className="font-bold text-text-primary">{item.theme}</h4>
                                </div>
                                <i className="fas fa-chevron-down text-text-secondary group-open:rotate-180 transition-transform"></i>
                            </summary>
                            <div className="bg-bg-primary border-t border-border p-2">
                                {item.verses.map(verseKey => (
                                    <button 
                                        key={verseKey} 
                                        onClick={() => handleVerseClick(verseKey)}
                                        className="w-full text-right p-2 rounded-md hover:bg-bg-secondary"
                                    >
                                        <span className="text-sm font-mono text-primary">{verseKey}</span>
                                    </button>
                                ))}
                            </div>
                        </details>
                    </div>
                ))}
            </div>
        </Panel>
    );
};

export default ThematicIndexPanel;