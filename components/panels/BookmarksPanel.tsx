import React from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';
import { API_BASE } from '../../constants';
import { showToast } from '../ToastContainer';

const SVG = {
    bookmark: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z',
    trash: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
    arrowLeft: 'M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18'
};

const BookmarksPanel: React.FC = () => {
    const { state, actions } = useApp();

    const sortedBookmarks = [...state.bookmarks].sort((a, b) => b.timestamp - a.timestamp);

    const handleNavigateToVerse = async (verseKey: string) => {
        actions.openPanel(null);
        try {
            const verseData = await actions.fetchWithRetry<{ verse: { page_number: number } }>(`${API_BASE}/verses/by_key/${verseKey}`);
            await actions.loadPage(verseData.verse.page_number);
            setTimeout(() => {
                const el = document.querySelector(`[data-verse-key="${verseKey}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        } catch (err) {
            console.error('Failed to navigate to verse:', err);
            showToast('\u0641\u0634\u0644 \u0641\u064a \u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0622\u064a\u0629', 'error');
        }
    };

    const handleDeleteBookmark = (e: React.MouseEvent, bookmark: any) => {
        e.stopPropagation();
        actions.toggleBookmark({ verse_key: bookmark.verseKey, text_uthmani: bookmark.verseText } as any);
        showToast('\u062a\u0645 \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u0622\u064a\u0629 \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629', 'info');
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    };

    return (
        <Panel id={PanelType.Bookmarks} title={'\u0627\u0644\u0645\u0641\u0636\u0644\u0629'}>
            <div className="p-4 space-y-4 pb-8 h-full overflow-y-auto custom-scrollbar">
                {sortedBookmarks.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-4 bg-primary/5 p-3 rounded-2xl border border-primary/10">
                            <p className="text-xs font-bold text-primary">{sortedBookmarks.length} {'\u0622\u064a\u0629 \u0645\u062d\u0641\u0648\u0638\u0629'}</p>
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={SVG.bookmark} />
                                </svg>
                            </div>
                        </div>
                        {sortedBookmarks.map((bookmark, index) => (
                            <div
                                key={bookmark.verseKey}
                                className="bg-bg-secondary p-5 rounded-3xl animate-listItemEnter cursor-pointer hover:bg-bg-tertiary transition-all active:scale-[0.98] border border-border/40 hover:border-primary/30 shadow-sm group relative overflow-hidden"
                                style={{ animationDelay: `${index * 30}ms` }}
                                onClick={() => handleNavigateToVerse(bookmark.verseKey)}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                                <p className="font-arabic text-[17px] mb-5 text-text-primary leading-[2.2] text-right relative z-10" dir="rtl">{bookmark.verseText}</p>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-[11px] px-3 py-1.5 bg-primary/10 text-primary rounded-full font-bold border border-primary/20 shadow-sm">
                                            {bookmark.surahName} : {bookmark.verseKey.split(':')[1]}
                                        </span>
                                        <span className="text-[10px] font-medium text-text-tertiary bg-bg-tertiary px-2 py-1 rounded-full">{formatDate(bookmark.timestamp)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNavigateToVerse(bookmark.verseKey);
                                            }}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-primary text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors border border-border/50 shadow-sm hover:shadow-md active:scale-95"
                                            title={'\u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0622\u064a\u0629'}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.arrowLeft} />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteBookmark(e, bookmark)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-primary text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors border border-border/50 shadow-sm hover:shadow-md active:scale-95"
                                            title={'\u0625\u0632\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629'}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={SVG.trash} />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-text-secondary animate-fadeIn px-6 text-center">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl"></div>
                            <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-bg-secondary rounded-3xl rotate-12 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                                <svg className="w-10 h-10 text-primary -rotate-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={SVG.bookmark} />
                                </svg>
                            </div>
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-text-primary">{'\u0644\u0627 \u062a\u0648\u062c\u062f \u0622\u064a\u0627\u062a \u0645\u062d\u0641\u0648\u0638\u0629'}</h3>
                        <p className="text-sm text-text-tertiary leading-relaxed max-w-[250px]">
                            {'\u0627\u0636\u063a\u0637 \u0645\u0637\u0648\u0644\u0627\u064b \u0639\u0644\u0649 \u0623\u064a \u0622\u064a\u0629 \u062b\u0645 \u0627\u062e\u062a\u0631 "\u0645\u0641\u0636\u0644\u0629" \u0644\u062d\u0641\u0638\u0647\u0627 \u0647\u0646\u0627'}
                        </p>
                    </div>
                )}
            </div>
        </Panel>
    );
};

export default BookmarksPanel;