import React from 'react';
import { useApp } from '../hooks/useApp';
import { Panel } from '../types';

const Header: React.FC = () => {
    const { state, actions } = useApp();
    const { pageData, currentPage, surahs, isVerseByVerseLayout } = state;

    const firstVerse = pageData.right?.[0] || pageData.left?.[0];
    const surah = firstVerse ? surahs.find(s => s.id === firstVerse.chapter_id) : null;
    const pageNumForDisplay = window.innerWidth > 1024 && state.pageData.left ? `${currentPage + 1}-${currentPage}`: currentPage;


    return (
        <header 
            className={`fixed top-0 left-0 right-0 bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shadow-md z-40 transition-transform duration-300 ease-in-out ${state.isUIVisible ? 'translate-y-0' : '-translate-y-full'}`}
        >
            <div 
                className="flex items-center justify-between px-4 pb-3"
                style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0rem))' }}
            >
                <div className="flex items-center gap-3">
                    <button onClick={() => actions.openPanel(Panel.Menu)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <i className="fas fa-bars text-lg"></i>
                    </button>
                    <div>
                        <h1 className="text-sm font-bold">{surah?.name_arabic || 'جاري التحميل...'}</h1>
                        <p className="text-xs opacity-90">
                            {firstVerse && `الجزء ${firstVerse.juz_number} • صفحة ${pageNumForDisplay}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => actions.openPanel(Panel.Search)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <i className="fas fa-search text-lg"></i>
                    </button>
                    <button onClick={actions.toggleVerseByVerseLayout} className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${isVerseByVerseLayout ? 'text-secondary' : ''}`}>
                        <i className="fas fa-layer-group text-lg"></i>
                    </button>
                    <button onClick={() => actions.openPanel(Panel.Settings)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <i className="fas fa-cog text-lg"></i>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;