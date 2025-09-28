import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { Panel as PanelType } from '../../types';

interface PanelProps {
    id: PanelType;
    title: string;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ id, title, children, headerActions }) => {
    const { state, actions } = useApp();
    const isVisible = state.activePanel === id;
    const [isRendered, setIsRendered] = useState(isVisible);

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
        }
    }, [isVisible]);

    const handleAnimationEnd = () => {
        if (!isVisible) {
            setIsRendered(false);
        }
    };

    if (!isRendered) return null;

    return (
        <div 
            className={`fixed inset-0 bg-bg-primary z-50 flex flex-col ${isVisible ? 'animate-slideInUp' : 'animate-slideOutDown'}`}
            onAnimationEnd={handleAnimationEnd}
        >
            <header 
                className="panel-header flex items-center justify-between px-4 pb-4 bg-gradient-to-l from-primary to-primary-light text-white shadow-md shrink-0"
                style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0rem))' }}
            >
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="flex items-center gap-1">
                    {headerActions}
                    <button onClick={() => actions.openPanel(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    );
};

export default Panel;