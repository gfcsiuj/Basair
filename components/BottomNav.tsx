import React from 'react';
import { useApp } from '../hooks/useApp';
import { Panel, ReadingMode } from '../types';
import AudioControlBar from './AudioControlBar';

const NavItem: React.FC<{ icon: string; label: string; panel?: Panel | 'memorize'; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`nav-item flex flex-col items-center justify-center p-2 transition-colors duration-200 w-full relative ${isActive ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}>
        {isActive && <div className="absolute top-0 h-0.5 w-1/2 bg-primary rounded-full"></div>}
        <i className={`fas ${icon} text-xl mb-1`}></i>
        <span className="text-xs font-medium">{label}</span>
    </button>
);

const BottomNav: React.FC = () => {
    const { state, actions } = useApp();
    
    const handleNavClick = (panel?: Panel | 'memorize') => {
        if (panel === 'memorize') {
            actions.setReadingMode(ReadingMode.Memorization);
            return;
        } 
        
        if (panel) {
            // If the audio panel is already open, clicking the audio icon does nothing (it has its own back button).
            // For other icons, toggle them off if they are already active.
            if (state.activePanel === Panel.Audio && panel === Panel.Audio) {
                return;
            }
            
            if (state.activePanel === panel) {
                actions.openPanel(null);
            } else {
                actions.openPanel(panel);
            }
        } else {
            actions.openPanel(null);
        }
    };

    const isAudioOpen = state.activePanel === Panel.Audio;

    return (
        <nav 
            className={`fixed bottom-0 left-0 right-0 z-40 bg-bg-primary border-t border-border shadow-md transition-all duration-300 ease-in-out ${state.isUIVisible ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ 
                height: isAudioOpen ? `calc(13rem + env(safe-area-inset-bottom, 0rem))` : 'auto'
            }}
        >
            {isAudioOpen ? (
                <AudioControlBar />
            ) : (
                 <div className="grid grid-cols-5 max-w-lg mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0rem)' }}>
                    <NavItem icon="fa-home" label="الرئيسية" panel={Panel.Dashboard} isActive={state.activePanel === Panel.Dashboard} onClick={() => handleNavClick(Panel.Dashboard)} />
                    <NavItem icon="fa-headphones-alt" label="الصوت" panel={Panel.Audio} isActive={isAudioOpen} onClick={() => handleNavClick(Panel.Audio)} />
                    <NavItem icon="fa-brain" label="الحفظ" panel="memorize" isActive={state.readingMode === ReadingMode.Memorization} onClick={() => handleNavClick('memorize')} />
                    <NavItem icon="fa-list" label="الفهرس" panel={Panel.Index} isActive={state.activePanel === Panel.Index} onClick={() => handleNavClick(Panel.Index)} />
                    <NavItem icon="fa-bookmark" label="المفضلة" panel={Panel.Bookmarks} isActive={state.activePanel === Panel.Bookmarks} onClick={() => handleNavClick(Panel.Bookmarks)} />
                </div>
            )}
        </nav>
    );
};

export default BottomNav;