import React from 'react';
import Panel from './Panel';
import { Panel as PanelType, DownloadStatus, DownloadableItem, Reciter } from '../../types';
import { useApp } from '../../hooks/useApp';

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
                <div className="w-full bg-bg-tertiary rounded-full h-2.5 relative">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                    <span className="absolute inset-0 text-center text-white text-[8px] font-bold">{Math.round(percentage)}%</span>
                </div>
            );
        }
        if (progress?.status === 'deleting') {
             return <span className="text-xs text-red-500">جاري الحذف...</span>;
        }
        if (isDownloaded) {
            return <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><i className="fas fa-check-circle"></i> مكتمل</span>;
        }
        return <span className="text-xs text-text-tertiary">غير مُحمّل</span>;
    };

    const handleDownload = () => {
        actions.startDownload(type, item);
    };

    const handleDelete = () => {
        if(window.confirm(`هل أنت متأكد من حذف ${item.name}؟`)) {
            actions.deleteDownloadedContent(type, item.id);
        }
    };
    
    return (
        <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
            <div>
                <p className="font-bold text-text-primary">{item.name}</p>
                <div className="mt-1 w-32">
                    {renderStatus()}
                </div>
            </div>
            <div className="flex gap-2">
                {!isDownloaded && (
                    <button onClick={handleDownload} disabled={progress?.status === 'downloading'} className="btn-icon bg-primary/10 text-primary disabled:opacity-50">
                        <i className={`fas ${progress?.status === 'downloading' ? 'fa-pause' : 'fa-download'}`}></i>
                    </button>
                )}
                {isDownloaded && (
                     <button onClick={handleDelete} disabled={progress?.status === 'deleting'} className="btn-icon bg-red-500/10 text-red-500 disabled:opacity-50">
                        <i className="fas fa-trash"></i>
                    </button>
                )}
            </div>
        </div>
    );
};


const OfflineManagerPanel: React.FC = () => {
    const { state } = useApp();

    return (
        <Panel id={PanelType.OfflineManager} title="المحتوى بدون انترنت">
            <div className="p-4 space-y-6">
                <div>
                    <h3 className="font-bold text-text-secondary text-sm px-1 mb-2">النص القرآني</h3>
                    <DownloadableRow 
                        item={{ id: 'full', name: 'النص الكامل للمصحف' }} 
                        type="quranText" 
                    />
                </div>

                <div>
                    <h3 className="font-bold text-text-secondary text-sm px-1 mb-2">التلاوات الصوتية</h3>
                    <div className="space-y-2">
                        {state.reciters.map(reciter => (
                            <DownloadableRow 
                                key={reciter.id}
                                item={{ id: reciter.id, name: reciter.reciter_name }} 
                                type="reciter" 
                            />
                        ))}
                    </div>
                </div>
                
                {/* Add translations section here if needed in the future */}
            </div>
        </Panel>
    );
};

export default OfflineManagerPanel;
