import React from 'react';
import { useApp } from '../hooks/useApp';
import { Panel } from '../types';

interface HeaderProps {
    onAnimationEnd: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAnimationEnd }) => {
    const { state, actions } = useApp();
    const { pageData, currentPage, surahs, isPlaying, audioQueue, currentAudioIndex } = state;

    const firstVerse = pageData?.[0];
    const surah = firstVerse ? surahs.find(s => s.id === firstVerse.chapter_id) : null;
    
    const audioEl = document.getElementById('page-audio') as HTMLAudioElement;
    const progress = audioEl && audioEl.duration ? (audioEl.currentTime / audioEl.duration) * 100 : 0;

    return (
        <header 
            onAnimationEnd={onAnimationEnd}
            className={`bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shadow-md z-40 shrink-0 ${state.isUIVisible ? 'animate-slideInDown' : 'animate-slideOutUp'}`}
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
                            {firstVerse && `الجزء ${firstVerse.juz_number} • صفحة ${currentPage}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={actions.playPrev} className="p-2 rounded-lg hover:bg-white/10 transition-colors" disabled={currentAudioIndex === 0}>
                        <i className="fas fa-backward text-sm"></i>
                    </button>
                    <button onClick={actions.togglePlayPause} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        {isPlaying ? <i className="fas fa-pause text-lg"></i> : <i className="fas fa-play text-lg"></i>}
                    </button>
                    <button onClick={actions.playNext} className="p-2 rounded-lg hover:bg-white/10 transition-colors" disabled={currentAudioIndex >= audioQueue.length - 1 && currentPage === 604}>
                        <i className="fas fa-forward text-sm"></i>
                    </button>
                    <button onClick={() => actions.openPanel(Panel.Search)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <i className="fas fa-search text-lg"></i>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;