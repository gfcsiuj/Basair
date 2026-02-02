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
            className={`fixed left-4 right-4 bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shadow-lg z-40 transition-transform duration-300 ease-in-out rounded-2xl ${state.isUIVisible ? 'translate-y-0' : '-translate-y-[150%]'}`}
            style={{ 
                // نجعل الهيدر يبدأ بعد المنطقة الآمنة + مسافة صغيرة
                top: 'calc(0.5rem + env(safe-area-inset-top, 0rem))' 
            }}
        >
            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => actions.openPanel(Panel.Menu)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <i className="fas fa-bars text-base"></i>
                    </button>
                    <div>
                        <h1 className="text-sm font-bold leading-tight">{surah?.name_arabic || 'جاري التحميل...'}</h1>
                        <p className="text-[10px] opacity-90 leading-tight">
                            {firstVerse && `الجزء ${firstVerse.juz_number} • ص ${pageNumForDisplay}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => actions.openPanel(Panel.Search)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <i className="fas fa-search text-base"></i>
                    </button>
                    <button onClick={actions.toggleVerseByVerseLayout} className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${isVerseByVerseLayout ? 'text-secondary' : ''}`}>
                        <i className="fas fa-layer-group text-base"></i>
                    </button>
                    <button onClick={() => actions.openPanel(Panel.Settings)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <i className="fas fa-cog text-base"></i>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;