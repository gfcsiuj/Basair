import React from 'react';
import { useApp } from '../hooks/useApp';
import { Panel, ReadingMode } from '../types';

const NavItem: React.FC<{ icon: string; label: string; panel?: Panel | 'home' | 'memorize'; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`nav-item flex flex-col items-center justify-center p-2 transition-colors duration-200 w-full relative ${isActive ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}>
        {isActive && <div className="absolute top-0 h-0.5 w-1/2 bg-primary rounded-full"></div>}
        <i className={`fas ${icon} text-xl mb-1`}></i>
        <span className="text-xs font-medium">{label}</span>
    </button>
);

interface BottomNavProps {
    onAnimationEnd: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onAnimationEnd }) => {
    const { state, actions } = useApp();
    
    const handleNavClick = (panel?: Panel | 'home' | 'memorize') => {
        if (panel === 'home') {
            actions.openPanel(null);
            actions.setReadingMode(ReadingMode.Reading);
        } else if (panel === 'memorize') {
            actions.setReadingMode(ReadingMode.Memorization);
        } else if(panel) {
            actions.openPanel(panel);
        }
    };

    return (
        <nav 
            onAnimationEnd={onAnimationEnd}
            className={`bottom-nav bg-bg-primary border-t border-border shadow-md shrink-0 ${state.isUIVisible ? 'animate-slideInUp' : 'animate-slideOutDown'}`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0rem)' }}
        >
            <div className="grid grid-cols-5 max-w-lg mx-auto">
                <NavItem icon="fa-book-quran" label="المصحف" panel="home" isActive={!state.activePanel && state.readingMode === ReadingMode.Reading} onClick={() => handleNavClick('home')} />
                <NavItem icon="fa-brain" label="الحفظ" panel="memorize" isActive={state.readingMode === ReadingMode.Memorization} onClick={() => handleNavClick('memorize')} />
                <NavItem icon="fa-list" label="الفهرس" panel={Panel.Index} isActive={state.activePanel === Panel.Index} onClick={() => handleNavClick(Panel.Index)} />
                <NavItem icon="fa-bookmark" label="المفضلة" panel={Panel.Bookmarks} isActive={state.activePanel === Panel.Bookmarks} onClick={() => handleNavClick(Panel.Bookmarks)} />
                <NavItem icon="fa-cog" label="الإعدادات" panel={Panel.Settings} isActive={state.activePanel === Panel.Settings} onClick={() => handleNavClick(Panel.Settings)} />
            </div>
        </nav>
    );
};

export default BottomNav;