import React, { useState } from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';
import { API_BASE } from '../../constants';

// SVG icons
const SVG = {
    patience: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z',
    prophets: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    family: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    knowledge: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    hereafter: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z',
    prayer: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    charity: 'M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    paradise: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z'
};

const thematicData = [
    { theme: "\u0627\u0644\u0635\u0628\u0631", icon: SVG.patience, count: 4, verses: ["2:153", "3:200", "8:46", "39:10"] },
    { theme: "\u0627\u0644\u0623\u0646\u0628\u064a\u0627\u0621", icon: SVG.prophets, count: 4, verses: ["21:7", "6:83", "12:101", "3:33"] },
    { theme: "\u0627\u0644\u0623\u0633\u0631\u0629 \u0648\u0627\u0644\u0645\u062c\u062a\u0645\u0639", icon: SVG.family, count: 4, verses: ["17:23", "30:21", "4:1", "66:6"] },
    { theme: "\u0627\u0644\u0639\u0644\u0645 \u0648\u0627\u0644\u062a\u0641\u0643\u0631", icon: SVG.knowledge, count: 4, verses: ["96:1-5", "20:114", "39:9", "58:11"] },
    { theme: "\u0627\u0644\u0635\u0644\u0627\u0629 \u0648\u0627\u0644\u0639\u0628\u0627\u062f\u0629", icon: SVG.prayer, count: 4, verses: ["2:45", "11:114", "20:14", "29:45"] },
    { theme: "\u0627\u0644\u0632\u0643\u0627\u0629 \u0648\u0627\u0644\u0635\u062f\u0642\u0627\u062a", icon: SVG.charity, count: 4, verses: ["2:261", "2:267", "9:60", "24:39"] },
    { theme: "\u0627\u0644\u062c\u0646\u0629 \u0648\u0627\u0644\u0646\u0639\u064a\u0645", icon: SVG.paradise, count: 4, verses: ["18:107", "32:17", "47:15", "56:12"] },
    { theme: "\u064a\u0648\u0645 \u0627\u0644\u0642\u064a\u0627\u0645\u0629", icon: SVG.hereafter, count: 4, verses: ["99:1-8", "82:1-5", "75:6-12", "22:1"] }
];

const ThematicIndexPanel: React.FC = () => {
    const { actions } = useApp();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleVerseClick = async (verseKey: string) => {
        actions.openPanel(null);
        try {
            // Support passing ranges e.g. "99:1-8" => fetch "99:1"
            const firstKey = verseKey.includes('-') ? verseKey.split('-')[0] : verseKey;
            const verseData = await actions.fetchWithRetry<{ verse: { page_number: number } }>(`${API_BASE}/verses/by_key/${firstKey}`);
            actions.loadPage(verseData.verse.page_number);
        } catch (err) {
            console.error('Failed to get page for verse:', err);
        }
    };

    return (
        <Panel id={PanelType.ThematicIndex} title={'\u0627\u0644\u0641\u0647\u0631\u0633 \u0627\u0644\u0645\u0648\u0636\u0648\u0639\u064a'}>
            <div className="p-4 space-y-3 pb-8">
                {thematicData.map((item, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div
                            key={item.theme}
                            className={`bg-bg-secondary rounded-2xl border transition-all duration-300 animate-listItemEnter ${isOpen ? 'border-primary/30 shadow-md shadow-primary/5' : 'border-border/40 hover:border-primary/20'}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <button
                                className="w-full p-4 flex items-center justify-between"
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                            >
                                <div className="flex flex-col items-start min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-primary/10 text-primary'}`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                            </svg>
                                        </div>
                                        <div className="text-right">
                                            <h4 className="font-bold text-text-primary text-sm">{item.theme}</h4>
                                            <p className="text-[11px] text-text-tertiary mt-0.5">{item.count} {'\u0645\u0648\u0627\u0636\u0639'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-bg-primary text-primary' : 'bg-transparent text-text-tertiary'}`}>
                                    <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </button>

                            <div
                                className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                            >
                                <div className="overflow-hidden">
                                    <div className="p-3 pt-0 border-t border-border/10 space-y-1.5 mx-2 mb-2">
                                        <p className="text-[11px] text-text-tertiary px-2 py-1">{'\u0627\u0644\u0622\u064a\u0627\u062a \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629:'}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {item.verses.map(verseKey => (
                                                <button
                                                    key={verseKey}
                                                    onClick={() => handleVerseClick(verseKey)}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-bg-primary hover:bg-primary/5 hover:text-primary transition-colors border border-border/20 group"
                                                >
                                                    <span className="text-sm font-medium font-mono tabular-nums" dir="ltr">{verseKey}</span>
                                                    <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
};

export default ThematicIndexPanel;