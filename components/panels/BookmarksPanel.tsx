
import React from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';

const BookmarksPanel: React.FC = () => {
    const { state, actions } = useApp();
    
    const sortedBookmarks = [...state.bookmarks].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <Panel id={PanelType.Bookmarks} title="المفضلة">
            <div className="p-4 space-y-3">
                {sortedBookmarks.length > 0 ? (
                    sortedBookmarks.map((bookmark, index) => (
                        <div 
                            key={bookmark.verseKey} 
                            className="card bg-bg-secondary p-4 rounded-lg animate-listItemEnter"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                             <p className="font-arabic text-lg mb-3 text-text-primary">{bookmark.verseText}</p>
                             <div className="flex items-center justify-between">
                                <p className="text-sm text-text-secondary">{bookmark.surahName} - {bookmark.verseKey.split(':')[1]}</p>
                                <button onClick={() => actions.toggleBookmark({verse_key: bookmark.verseKey, text_uthmani: bookmark.verseText} as any)} className="text-red-500 hover:text-red-700 transition-colors">
                                    <i className="fas fa-trash"></i>
                                </button>
                             </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-text-secondary">
                        <i className="fas fa-bookmark text-4xl mb-4"></i>
                        <p>لا توجد آيات محفوظة</p>
                    </div>
                )}
            </div>
        </Panel>
    );
};

export default BookmarksPanel;