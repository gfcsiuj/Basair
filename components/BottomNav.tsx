import React from 'react';
import { useApp } from '../hooks/useApp';
import { Panel, ReadingMode } from '../types';
import AudioControlBar from './AudioControlBar';

const NavItem: React.FC<{ icon: string; label: string; panel?: Panel | 'memorize'; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`nav-item flex flex-col items-center justify-center p-1 transition-colors duration-200 w-full relative ${isActive ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}>
        {isActive && <div className="absolute -top-1 h-1 w-1 bg-primary rounded-full"></div>}
        <i className={`fas ${icon} text-lg mb-0.5`}></i>
        <span className="text-[10px] font-medium">{label}</span>
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
            className={`fixed left-4 right-4 z-40 bg-bg-primary shadow-lg rounded-2xl transition-all duration-300 ease-in-out ${state.isUIVisible ? 'translate-y-0' : 'translate-y-[150%]'}`}
            style={{ 
                // نرفعه عن الأسفل بمقدار المنطقة الآمنة + مسافة (1rem)
                bottom: 'calc(1rem + env(safe-area-inset-bottom, 0rem))',
                height: isAudioOpen ? '13rem' : 'auto' // تعديل الارتفاع ليكون ثابتاً عند فتح الصوت أو تلقائياً
            }}
        >
            {isAudioOpen ? (
                <div className="rounded-2xl overflow-hidden h-full">
                   <AudioControlBar />
                </div>
            ) : (
                 <div className="grid grid-cols-5 max-w-lg mx-auto py-2">
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