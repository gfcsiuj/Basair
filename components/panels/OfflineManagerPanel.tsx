import React from 'react';
import Panel from './Panel';
import { Panel as PanelType, DownloadableItem } from '../../types';
import { useApp } from '../../hooks/useApp';

const SVG = {
    checkCircle: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    pause: 'M15.75 5.25v13.5m-7.5-13.5v13.5',
    download: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
    trash: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
    database: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
    audio: 'M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z'
};

interface DownloadableRowProps {
    item: DownloadableItem;
    type: 'quranText' | 'reciter' | 'translation';
}

const DownloadableRow: React.FC<DownloadableRowProps> = ({ item, type }) => {
    const { state, actions } = useApp();
    const { offlineStatus, downloadProgress } = state;

    const key = `${type}-${item.id}`;
    const progress = downloadProgress[key];
    const isDownloaded = type === 'quranText' ? offlineStatus.quranText : offlineStatus.reciters.includes(item.id as number);
    const percentage = progress && progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;

    const renderStatus = () => {
        if (progress?.status === 'downloading') {
            return (
                <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden mt-1 shadow-inner">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out relative"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            );
        }
        if (progress?.status === 'deleting') {
            return <span className="text-[11px] text-red-500 font-bold animate-pulse">{'\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0630\u0641...'}</span>;
        }
        if (isDownloaded) {
            return (
                <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full w-max mt-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={SVG.checkCircle} />
                    </svg>
                    {'\u0645\u0643\u062a\u0645\u0644'}
                </span>
            );
        }
        return <span className="text-[11px] font-medium text-text-tertiary mt-1 block">{'\u063a\u064a\u0631 \u0645\u064f\u062d\u0645\u0651\u0644'}</span>;
    };

    const handleDownload = () => {
        actions.startDownload(type, item);
    };

    const handleDelete = () => {
        if (window.confirm(`\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 ${item.name}\u061f`)) {
            actions.deleteDownloadedContent(type, item.id);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-bg-secondary hover:bg-bg-tertiary/50 transition-colors rounded-2xl border border-border/40 shadow-sm animate-listItemEnter group">
            <div className="flex items-center gap-4 flex-1 min-w-0 pr-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isDownloaded ? 'bg-emerald-500/10 text-emerald-500' : progress?.status === 'downloading' ? 'bg-primary/20 text-primary animate-pulse' : 'bg-bg-tertiary text-text-tertiary'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={type === 'quranText' ? SVG.database : SVG.audio} />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                        <p className="font-bold text-text-primary text-[15px] truncate">{item.name}</p>
                        {progress?.status === 'downloading' && percentage > 0 && (
                            <span className="text-[10px] font-bold text-primary tabular-nums shrink-0">{Math.round(percentage)}%</span>
                        )}
                    </div>
                    <div className="w-full max-w-[150px]">
                        {renderStatus()}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-border/50 shrink-0">
                {!isDownloaded && (
                    <button
                        onClick={handleDownload}
                        disabled={progress?.status === 'downloading'}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${progress?.status === 'downloading' ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95'}`}
                        title={progress?.status === 'downloading' ? '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644' : '\u062a\u062d\u0645\u064a\u0644'}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={progress?.status === 'downloading' ? SVG.pause : SVG.download} />
                        </svg>
                    </button>
                )}
                {isDownloaded && (
                    <button
                        onClick={handleDelete}
                        disabled={progress?.status === 'deleting'}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${progress?.status === 'deleting' ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white active:scale-95'}`}
                        title={'\u062d\u0630\u0641 \u0627\u0644\u0645\u0644\u0641'}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={SVG.trash} />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

const OfflineManagerPanel: React.FC = () => {
    const { state } = useApp();

    return (
        <Panel id={PanelType.OfflineManager} title={'\u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0628\u062f\u0648\u0646 \u0627\u0646\u062a\u0631\u0646\u062a'}>
            <div className="p-4 space-y-6 custom-scrollbar h-full overflow-y-auto pb-10">
                {/* Information Callout */}
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-primary mb-1">{'\u0645\u0644\u0627\u062d\u0638\u0629 \u0647\u0627\u0645\u0629'}</h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                            {'\u0642\u0645 \u0628\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0644\u0644\u0627\u0633\u062a\u0645\u0627\u0639 \u0648\u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0628\u062f\u0648\u0646 \u0627\u0644\u062d\u0627\u062c\u0629 \u0644\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a. \u0642\u062f \u062a\u0633\u062a\u063a\u0631\u0642 \u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u062a\u062d\u0645\u064a\u0644 \u0628\u0639\u0636 \u0627\u0644\u0648\u0642\u062a \u062d\u0633\u0628 \u0633\u0631\u0639\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644.'}
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-text-secondary text-[13px] px-2 mb-3 tracking-wide">{'\u0627\u0644\u0646\u0635 \u0627\u0644\u0642\u0631\u0622\u0646\u064a'}</h3>
                    <DownloadableRow
                        item={{ id: 'full', name: '\u0627\u0644\u0646\u0635 \u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0644\u0645\u0635\u062d\u0641' }}
                        type="quranText"
                    />
                </div>

                <div>
                    <h3 className="font-bold text-text-secondary text-[13px] px-2 mb-3 tracking-wide mt-2">{'\u0627\u0644\u062a\u0644\u0627\u0648\u0627\u062a \u0627\u0644\u0635\u0648\u062a\u064a\u0629'}</h3>
                    <div className="space-y-3">
                        {state.reciters.map(reciter => (
                            <DownloadableRow
                                key={reciter.id}
                                item={{ id: reciter.id, name: reciter.reciter_name }}
                                type="reciter"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </Panel>
    );
};

export default OfflineManagerPanel;
