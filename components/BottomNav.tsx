import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { Panel } from '../types';
import AudioControlBar from './AudioControlBar';
import { AutoScrollIcon } from './SvgDecorations';
import { TOTAL_PAGES, API_BASE } from '../constants';

const NavItem: React.FC<{ icon: string; label: string; isActive: boolean; onClick: () => void; customIcon?: React.ReactNode }> = ({ icon, label, isActive, onClick, customIcon }) => (
    <button onClick={onClick} className={`nav-item flex flex-col items-center justify-center p-1 transition-all duration-200 w-full relative ${isActive ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}>
        {isActive && <div className="absolute -top-0.5 h-1 w-6 bg-primary rounded-full transition-all"></div>}
        {customIcon ? customIcon : <i className={`fas ${icon} text-lg mb-0.5 ${isActive ? 'scale-110' : ''} transition-transform`}></i>}
        <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
);

// Page Slider Bar component
const PageSliderBar: React.FC = () => {
    const { state, actions } = useApp();
    const [isDragging, setIsDragging] = useState(false);
    const [tooltipPage, setTooltipPage] = useState(state.currentPage);

    const currentSurah = useMemo(() => {
        const verse = state.pageData.right?.[0] || state.pageData.left?.[0];
        if (!verse) return null;
        return state.surahs.find(s => s.id === verse.chapter_id);
    }, [state.pageData, state.surahs]);

    const juzNumber = state.pageData.right?.[0]?.juz_number || state.pageData.left?.[0]?.juz_number;

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const page = parseInt(e.target.value);
        setTooltipPage(page);
        setIsDragging(true);
    }, []);

    const handleSliderRelease = useCallback(() => {
        setIsDragging(false);
        actions.loadPage(tooltipPage);
    }, [actions, tooltipPage]);

    const tooltipSurah = useMemo(() => {
        if (!isDragging || !state.surahs.length) return null;
        // Find surah for the tooltip page
        return state.surahs.find(s => s.pages.includes(tooltipPage)) || state.surahs.find(s => tooltipPage >= s.pages[0] && tooltipPage <= s.pages[s.pages.length - 1]);
    }, [isDragging, tooltipPage, state.surahs]);

    return (
        <div className="px-4 pb-1.5">
            <div className="glass-slider-bar rounded-full px-3 py-1.5 relative">
                {/* Tooltip when dragging */}
                {isDragging && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg z-50 animate-fadeIn">
                        <div className="font-bold">{tooltipSurah?.name_arabic || '...'}</div>
                        <div className="text-[10px] opacity-80 text-center">ص {tooltipPage} • جزء {Math.ceil(tooltipPage / 20.13) || 1}</div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-text-tertiary font-medium w-12 text-center shrink-0">
                        {currentSurah?.name_arabic || '...'}
                    </span>
                    <input
                        type="range"
                        min="1"
                        max={TOTAL_PAGES}
                        value={isDragging ? tooltipPage : state.currentPage}
                        onChange={handleSliderChange}
                        onMouseUp={handleSliderRelease}
                        onTouchEnd={handleSliderRelease}
                        className="page-slider w-full"
                        dir="rtl"
                    />
                    <span className="text-[9px] text-text-tertiary font-medium w-8 text-center shrink-0">
                        ص {state.currentPage}
                    </span>
                </div>
            </div>
        </div>
    );
};

const BottomNav: React.FC = () => {
    const { state, actions } = useApp();

    const handleNavClick = (panel?: Panel | 'autoScroll') => {
        if (panel === 'autoScroll') {
            actions.toggleAutoScroll();
            return;
        }

        if (panel) {
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
    const [showLastReadPopup, setShowLastReadPopup] = useState(false);

    const handleLastReadClick = () => {
        if (!state.lastRead) {
            alert('لا توجد قراءة محفوظة مؤخرًا');
            return;
        }
        setShowLastReadPopup(true);
    };

    const handleNavigateToLastRead = async () => {
        if (!state.lastRead) return;
        setShowLastReadPopup(false);
        actions.openPanel(null);
        try {
            const verseData = await actions.fetchWithRetry<{ verse: { page_number: number } }>(`${API_BASE}/verses/by_key/${state.lastRead.verseKey}`);
            await actions.loadPage(verseData.verse.page_number);

            setTimeout(() => {
                const el = document.querySelector(`[data-verse-key="${state.lastRead!.verseKey}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        } catch (err) {
            console.error('Failed to navigate to last read verse:', err);
        }
    };

    const renderLastReadPopup = () => {
        if (!showLastReadPopup || !state.lastRead) return null;

        let popupFontFamily: string | undefined = undefined;
        let popupText = state.lastRead.text;

        if (state.font === 'qpc-v1' && state.wordGlyphData && state.lastRead.pageNumber) {
            popupFontFamily = `QuranPageFontV2-${state.lastRead.pageNumber}`;
            const verseKeyPrefix = `${state.lastRead.verseKey}:`;
            popupText = Object.entries(state.wordGlyphData)
                .filter(([key]) => key.startsWith(verseKeyPrefix))
                .map(([key, wordInfo]) => ({ ...wordInfo, wordNum: parseInt(key.split(':')[2], 10) }))
                .sort((a, b) => a.wordNum - b.wordNum)
                .map(wordInfo => (wordInfo as any).text)
                .join('');

            if (!popupText) popupText = state.lastRead.text;
        }

        return (
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn"
                onClick={() => setShowLastReadPopup(false)}
            >
                <div
                    className="bg-bg-primary rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-scaleIn border border-border"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-border bg-bg-secondary flex justify-between items-center">
                        <h3 className="font-bold text-primary flex items-center gap-2">
                            <i className="fas fa-bookmark"></i>
                            آخر قراءة
                        </h3>
                        <button onClick={() => setShowLastReadPopup(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-tertiary text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="p-6 text-center cursor-pointer hover:bg-bg-secondary/50 transition-colors group" onClick={handleNavigateToLastRead}>
                        <p
                            className="font-arabic text-2xl leading-loose mb-6 text-text-primary group-hover:text-primary transition-colors"
                            style={{ fontFamily: popupFontFamily }}
                        >
                            {popupText}
                        </p>
                        <div className="inline-flex items-center justify-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                            سورة {state.lastRead.surahName}
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                            الآية {state.lastRead.verseKey.split(':')[1]}
                        </div>
                    </div>
                    <div className="p-4 bg-bg-secondary border-t border-border flex justify-center">
                        <button onClick={handleNavigateToLastRead} className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/30">
                            الانتقال إلى الآية
                            <i className="fas fa-arrow-left text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {renderLastReadPopup()}
            <div
                className={`fixed left-0 right-0 bottom-0 z-40 transition-all duration-300 ease-in-out ${state.isUIVisible ? 'translate-y-0' : 'translate-y-[150%]'}`}
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0rem)' }}
            >
                {isAudioOpen ? (
                    <div className="mx-3 mb-2 rounded-2xl overflow-hidden" style={{
                        background: 'var(--bg-primary)',
                        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
                        border: '1px solid var(--border)',
                    }}>
                        <AudioControlBar />
                    </div>
                ) : state.isAutoScrolling ? (
                    /* ===== Auto-Scroll Mode: Full-width control bar ===== */
                    <nav className="mx-3 mb-2">
                        <div
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                            style={{
                                background: 'var(--bg-secondary)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            {/* Exit auto-scroll button */}
                            <button
                                onClick={() => actions.toggleAutoScroll()}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                                title="إيقاف التمرير"
                            >
                                <i className="fas fa-times text-sm"></i>
                            </button>

                            {/* Speed icon */}
                            <i className="fas fa-tachometer-alt text-primary text-xs shrink-0"></i>

                            {/* Speed slider */}
                            <input
                                type="range"
                                min="0.3"
                                max="5"
                                step="0.1"
                                value={state.autoScrollSpeed}
                                onChange={(e) => actions.setAutoScrollSpeed(parseFloat(e.target.value))}
                                className="flex-1 h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
                            />

                            {/* Speed label */}
                            <span className="text-xs text-primary font-bold w-10 text-center shrink-0">{state.autoScrollSpeed.toFixed(1)}x</span>

                            {/* Pause/Resume button */}
                            <button
                                onClick={() => actions.toggleAutoScroll()}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                            >
                                <i className="fas fa-pause text-sm"></i>
                            </button>
                        </div>
                    </nav>
                ) : (
                    <>
                        {/* Mini player when audio is playing but panel is closed */}
                        {state.audioQueue.length > 0 && state.isPlaying && (
                            <div className="mx-3 mb-1.5">
                                <div
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer"
                                    onClick={() => handleNavClick(Panel.Audio)}
                                    style={{
                                        background: 'rgba(var(--highlight-color), 0.08)',
                                        border: '1px solid rgba(var(--highlight-color), 0.15)',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm shrink-0 animate-pulse">
                                        <i className="fas fa-music"></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-text-primary font-medium truncate">
                                            {state.surahs.find(s => s.id === parseInt(state.audioQueue[state.currentAudioIndex]?.verseKey?.split(':')[0]))?.name_arabic || 'جاري التشغيل...'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); actions.togglePlayPause(); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-primary hover:bg-primary/10 transition-colors"
                                    >
                                        <i className={`fas ${state.isPlaying ? 'fa-pause' : 'fa-play'} text-sm`}></i>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Page Slider Bar (separate from tabs) */}
                        <PageSliderBar />

                        {/* Navigation tabs with rounded corners */}
                        <nav className="mx-3 mb-2">
                            <div
                                className="grid grid-cols-5 py-2 rounded-2xl"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <NavItem icon="fa-home" label="الرئيسية" isActive={state.activePanel === Panel.Dashboard} onClick={() => handleNavClick(Panel.Dashboard)} />
                                <NavItem icon="fa-headphones-alt" label="الصوت" isActive={false} onClick={() => handleNavClick(Panel.Audio)} />
                                <NavItem
                                    icon=""
                                    label="تمرير"
                                    customIcon={<AutoScrollIcon size={20} isActive={state.isAutoScrolling} />}
                                    isActive={state.isAutoScrolling}
                                    onClick={() => handleNavClick('autoScroll')}
                                />
                                <NavItem icon="fa-bookmark" label="آخر قراءة" isActive={false} onClick={handleLastReadClick} />
                                <NavItem icon="fa-list" label="الفهرس" isActive={state.activePanel === Panel.Index} onClick={() => handleNavClick(Panel.Index)} />
                            </div>
                        </nav>
                    </>
                )}
            </div>
        </>
    );
};

export default BottomNav;