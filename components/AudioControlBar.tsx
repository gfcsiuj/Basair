import React from 'react';
import { useApp } from '../hooks/useApp';
import { RepeatMode, Panel } from '../types';
import { TOTAL_PAGES } from '../constants';

const AudioControlBar: React.FC = () => {
    const { state, actions } = useApp();
    const progress = state.audioDuration > 0 ? (state.audioCurrentTime / state.audioDuration) * 100 : 0;
    const { isPlaying, audioQueue, currentAudioIndex, surahs, audioCurrentTime, audioDuration, repeatMode, playbackRate, selectedReciterId } = state;
    const audioElRef = React.useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        audioElRef.current = document.getElementById('page-audio') as HTMLAudioElement;
    }, []);

    const currentVerseKey = audioQueue[currentAudioIndex]?.verseKey;
    const [surahId, verseNum] = currentVerseKey?.split(':').map(Number) || [null, null];
    const currentSurah = surahs.find(s => s.id === surahId);
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
        try { window.navigator.vibrate(10); } catch (e) { }
        actions.togglePlayPause();
    };

    const handleClose = () => {
        actions.setState(s => ({ ...s, isPlaying: false, audioQueue: [], currentAudioIndex: 0 }));
        actions.openPanel(null);
    };

    const handleOpenRange = () => {
        actions.setState(s => ({ ...s, isRangeModalOpen: true }));
    };

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
        <div className="audio-player-bar flex flex-col w-full" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0rem)' }}>
            {/* Top row: Close + Info + Reciter + Range */}
            <div className="flex items-center justify-between px-4 pt-3">
                <button
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="إغلاق المشغل"
                >
                    <i className="fas fa-times text-sm"></i>
                </button>
                <div className="text-center flex-1 mx-2">
                    <p className="text-sm font-bold text-text-primary truncate">{currentSurah?.name_arabic || "القرآن الكريم"}</p>
                    <p className="text-[10px] text-text-tertiary">الآية {verseNum || '...'} • <span className="text-primary cursor-pointer hover:underline" onClick={() => actions.setState(s => ({ ...s, isReciterModalOpen: true }))}>{currentReciterName}</span></p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => actions.setState(s => ({ ...s, isReciterModalOpen: true }))}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-primary bg-primary/10 hover:bg-primary/20 transition-all"
                        title="تغيير القارئ"
                    >
                        <i className="fas fa-microphone text-sm"></i>
                    </button>
                    <button
                        onClick={handleOpenRange}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-primary bg-primary/10 hover:bg-primary/20 transition-all"
                        title="تحديد النطاق"
                    >
                        <i className="fas fa-arrows-alt-h text-sm"></i>
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full px-4 pt-2">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="audio-slider w-full"
                    aria-label="Seek audio"
                />
                <div className="flex justify-between text-[10px] text-text-tertiary -mt-0.5">
                    <span>{formatTime(audioCurrentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                </div>
            </div>

            {/* Controls row */}
            <div className="flex justify-between items-center w-full px-6 pb-3 pt-1">
                <button
                    onClick={() => {
                        const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
                        actions.setPlaybackRate(rates[(rates.indexOf(playbackRate) + 1) % rates.length]);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary transition-colors"
                    title={`سرعة ${playbackRate}x`}
                >
                    <span className="font-bold text-xs">{playbackRate}x</span>
                </button>

                <button
                    onClick={actions.playPrev}
                    className="text-text-secondary hover:text-primary text-2xl p-2 rounded-full transition-colors disabled:opacity-30"
                    disabled={currentAudioIndex === 0}
                >
                    <i className="fas fa-backward-step"></i>
                </button>

                <button
                    onClick={handlePlayPause}
                    className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                    style={{ boxShadow: '0 4px 14px rgba(var(--highlight-color), 0.4)' }}
                >
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} ${!isPlaying ? 'ml-0.5' : ''}`}></i>
                </button>

                <button
                    onClick={actions.playNext}
                    className="text-text-secondary hover:text-primary text-2xl p-2 rounded-full transition-colors disabled:opacity-30"
                    disabled={!audioQueue[currentAudioIndex + 1] && state.currentPage === TOTAL_PAGES && repeatMode !== RepeatMode.All}
                >
                    <i className="fas fa-forward-step"></i>
                </button>

                <button
                    onClick={toggleRepeatMode}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary transition-colors ${repeatMode !== RepeatMode.Off ? 'text-primary bg-primary/10' : ''}`}
                    title="تكرار"
                >
                    <i className={`fas ${repeatIcon[repeatMode]} text-base`}></i>
                </button>
            </div>
        </div>
    );
};

export default AudioControlBar;