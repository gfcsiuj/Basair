import React from 'react';
import { useApp } from '../hooks/useApp';
import { Panel } from '../types';

const Header: React.FC = () => {
    const { state, actions } = useApp();
    const { pageData, currentPage, surahs, isVerseByVerseLayout } = state;

    const firstVerse = pageData.right?.[0] || pageData.left?.[0];
    const surah = firstVerse ? surahs.find(s => s.id === firstVerse.chapter_id) : null;
    const pageNumForDisplay = window.innerWidth > 1024 && state.pageData.left ? `${currentPage + 1}-${currentPage}` : currentPage;

    return (
        <header
            className={`fixed left-3 right-3 glass-panel z-40 transition-all duration-300 ease-in-out rounded-2xl ${state.isUIVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}
            style={{
                top: 'calc(0.5rem + env(safe-area-inset-top, 0rem))',
                background: 'linear-gradient(135deg, rgba(var(--highlight-color), 0.9), rgba(var(--highlight-color), 0.75))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 4px 20px rgba(var(--highlight-color), 0.25)',
            }}
        >
            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => actions.openPanel(Panel.Menu)} className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white">
                        <i className="fas fa-bars text-base"></i>
                    </button>
                    <div>
                        <h1 className="text-sm font-bold leading-tight text-white">{surah?.name_arabic || 'جاري التحميل...'}</h1>
                        <p className="text-[10px] text-white/80 leading-tight">
                            {firstVerse && `الجزء ${firstVerse.juz_number} • ص ${pageNumForDisplay}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => actions.openPanel(Panel.Search)} className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white">
                        <i className="fas fa-search text-base"></i>
                    </button>
                    <button onClick={actions.toggleVerseByVerseLayout} className={`p-1.5 rounded-lg hover:bg-white/15 transition-colors ${isVerseByVerseLayout ? 'text-yellow-300' : 'text-white'}`}>
                        <i className="fas fa-layer-group text-base"></i>
                    </button>
                    <button onClick={() => actions.openPanel(Panel.Settings)} className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white">
                        <i className="fas fa-cog text-base"></i>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;