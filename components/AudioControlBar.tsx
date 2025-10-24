import React from 'react';
import { useApp } from '../hooks/useApp';
import { RepeatMode } from '../types';
// FIX: Import TOTAL_PAGES constant to resolve reference error.
import { TOTAL_PAGES } from '../constants';

const AudioControlBar: React.FC = () => {
    const { state, actions } = useApp();
    const { isPlaying, audioQueue, currentAudioIndex, surahs, audioCurrentTime, audioDuration, repeatMode, playbackRate, selectedReciterId } = state;
    const audioElRef = React.useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        audioElRef.current = document.getElementById('page-audio') as HTMLAudioElement;
    }, []);

    const currentVerseKey = audioQueue[currentAudioIndex]?.verseKey;
    const [surahId, verseNum] = currentVerseKey?.split(':').map(Number) || [null, null];
    const currentSurah = surahs.find(s => s.id === surahId);
    const progress = audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0;
    const currentReciterName = state.reciters.find(r => r.id === selectedReciterId)?.reciter_name || '...';

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioElRef.current || !isFinite(audioDuration)) return;
        const newTime = (parseFloat(e.target.value) / 100) * audioDuration;
        audioElRef.current.currentTime = newTime;
    };
    
    const toggleRepeatMode = () => {
        const modes = [RepeatMode.Off, RepeatMode.All, RepeatMode.One];
        const currentIndex = modes.indexOf(repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        actions.setRepeatMode(modes[nextIndex]);
    };

    const handlePlayPause = () => {
        try { window.navigator.vibrate(10); } catch(e) {}
        actions.togglePlayPause();
    }

    const repeatIcon = {
        [RepeatMode.Off]: 'fa-random',
        [RepeatMode.One]: 'fa-repeat-1',
        [RepeatMode.All]: 'fa-repeat',
    };
    
    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <div 
            className="w-full h-full flex flex-col px-4 pt-2 justify-around text-text-primary"
            style={{ paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom, 0rem))` }}
        >
            <div className="w-full text-center" onClick={() => actions.openPanel(null)}>
                <div className="w-12 h-1.5 bg-bg-tertiary rounded-full mx-auto cursor-pointer"></div>
            </div>

            <div className="text-center">
                <h3 className="text-xl font-bold">{currentSurah?.name_arabic || "القرآن الكريم"}</h3>
                <p className="text-sm text-text-secondary">الآية {verseNum || '...'}</p>
                 <div className="flex justify-center items-center gap-4 mt-1">
                    <button onClick={() => actions.setState(s => ({ ...s, isReciterModalOpen: true }))} className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-colors">
                        {currentReciterName} <i className="fas fa-chevron-down text-xs ml-1"></i>
                    </button>
                     <button onClick={() => actions.setState(s => ({ ...s, isRangeModalOpen: true }))} className="text-xs flex items-center gap-1 text-text-secondary hover:text-primary bg-bg-tertiary px-2 py-1 rounded-full">
                        <i className="fas fa-list-ol"></i>
                        <span>نطاق</span>
                    </button>
                </div>
            </div>

            <div className="w-full">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
                    aria-label="Seek audio"
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>{formatTime(audioCurrentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                </div>
            </div>

            <div className="flex justify-between items-center w-full max-w-sm mx-auto">
                 <button onClick={() => {const rates = [1, 1.25, 1.5, 2, 0.75, 0.5]; actions.setPlaybackRate(rates[(rates.indexOf(playbackRate) + 1) % rates.length])}} className="w-12 h-12 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary" title={`سرعة ${playbackRate}x`}>
                    <span className="font-bold text-base">{playbackRate.toFixed(2)}x</span>
                </button>
                
                <button onClick={actions.playPrev} className="text-text-secondary hover:text-primary text-3xl p-3 rounded-full transition-colors disabled:opacity-30" disabled={currentAudioIndex === 0}>
                    <i className="fas fa-backward-step"></i>
                </button>

                <button onClick={handlePlayPause} className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-4xl shadow-lg hover:bg-primary-dark transition-colors active:scale-95">
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>

                <button onClick={actions.playNext} className="text-text-secondary hover:text-primary text-3xl p-3 rounded-full transition-colors disabled:opacity-30" disabled={!audioQueue[currentAudioIndex + 1] && state.currentPage === TOTAL_PAGES && repeatMode !== RepeatMode.All}>
                    <i className="fas fa-forward-step"></i>
                </button>

                <button onClick={toggleRepeatMode} className={`w-12 h-12 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary ${repeatMode !== RepeatMode.Off ? 'text-primary' : ''}`} title="تكرار">
                    <i className={`fas ${repeatIcon[repeatMode]} text-xl`}></i>
                </button>
            </div>
        </div>
    );
};

export default AudioControlBar;