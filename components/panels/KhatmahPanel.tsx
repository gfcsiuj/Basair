import React, { useState, useMemo } from 'react';
import Panel from './Panel';
import { Panel as PanelType, Khatmah } from '../../types';
import { useApp } from '../../hooks/useApp';
import { TOTAL_PAGES } from '../../constants';

// Helper to calculate date differences
const daysBetween = (date1Str: string, date2Str: string): number => {
    const date1 = new Date(date1Str);
    const date2 = new Date(date2Str);
    const difference = date1.getTime() - date2.getTime();
    return Math.max(0, Math.floor(difference / (1000 * 3600 * 24)));
};

// --- Modal for Adding/Updating Khatmah ---
const KhatmahModal: React.FC<{
    mode: 'add' | 'update';
    khatmah?: Khatmah | null;
    onClose: () => void;
}> = ({ mode, khatmah, onClose }) => {
    const { actions } = useApp();
    const [name, setName] = useState(mode === 'add' ? '' : khatmah?.name || '');
    const [duration, setDuration] = useState(mode === 'add' ? 30 : khatmah?.duration || 30);
    const [pagesRead, setPagesRead] = useState(khatmah?.pagesRead || 0);
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (mode === 'add') {
            if (!name.trim()) {
                setError('الرجاء إدخال اسم للختمة.');
                return;
            }
            if (duration < 1) {
                setError('يجب أن تكون المدة يومًا واحدًا على الأقل.');
                return;
            }
            actions.addKhatmah({
                name,
                duration,
                startDate: new Date().toISOString()
            });
        } else if (khatmah) {
            if (pagesRead < 0 || pagesRead > TOTAL_PAGES) {
                setError(`يجب أن يكون عدد الصفحات بين 0 و ${TOTAL_PAGES}.`);
                return;
            }
            actions.updateKhatmahProgress(khatmah.id, pagesRead);
        }
        onClose();
    };

    const title = mode === 'add' ? 'ختمة جديدة' : 'تحديث التقدم';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-bg-primary rounded-xl w-full max-w-sm shadow-xl p-6 animate-scaleIn" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4 text-text-primary">{title}</h3>
                <div className="space-y-4">
                    {mode === 'add' ? (
                        <>
                            <div>
                                <label className="text-sm text-text-secondary">اسم الختمة</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: ختمة رمضان" className="input w-full bg-bg-secondary border-border" />
                            </div>
                            <div>
                                <label className="text-sm text-text-secondary">المدة (بالأيام)</label>
                                <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} min="1" className="input w-full bg-bg-secondary border-border" />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="text-sm text-text-secondary">وصلت إلى الصفحة رقم</label>
                            <input type="number" value={pagesRead} onChange={e => setPagesRead(parseInt(e.target.value))} min="0" max={TOTAL_PAGES} className="input w-full bg-bg-secondary border-border" />
                        </div>
                    )}
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={handleSubmit} className="btn-primary flex-1">حفظ</button>
                    <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
                </div>
            </div>
        </div>
    );
};


// --- Individual Khatmah Card ---
const KhatmahCard: React.FC<{
    khatmah: Khatmah;
    onUpdate: (k: Khatmah) => void;
}> = ({ khatmah, onUpdate }) => {
    const { actions } = useApp();
    
    const stats = useMemo(() => {
        const today = new Date().toISOString();
        const daysElapsed = daysBetween(today, khatmah.startDate);
        const remainingDays = Math.max(0, khatmah.duration - daysElapsed);
        const progress = (khatmah.pagesRead / TOTAL_PAGES) * 100;
        const pagesPerDay = Math.ceil(TOTAL_PAGES / khatmah.duration);
        const remainingPages = TOTAL_PAGES - khatmah.pagesRead;
        const dailyTargetToday = remainingDays > 0 ? Math.ceil(remainingPages / remainingDays) : remainingPages;

        return { remainingDays, progress, pagesPerDay, dailyTargetToday };
    }, [khatmah]);

    return (
        <div className="bg-bg-secondary p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-text-primary">{khatmah.name}</h4>
                <button onClick={() => actions.deleteKhatmah(khatmah.id)} className="text-red-500/70 hover:text-red-500 text-sm">
                    <i className="fas fa-trash"></i>
                </button>
            </div>

            <div>
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>التقدم</span>
                    <span>{khatmah.pagesRead} / {TOTAL_PAGES}</span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${stats.progress}%` }}></div>
                </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border text-center">
                <div className="px-2">
                    <p className="font-bold text-primary">{stats.pagesPerDay}</p>
                    <p className="text-xs text-text-secondary">صفحة/يوم</p>
                </div>
                <div className="px-2">
                    <p className="font-bold text-primary">{stats.remainingDays}</p>
                    <p className="text-xs text-text-secondary">يوم متبقي</p>
                </div>
                <div className="px-2">
                    <p className="font-bold text-primary">{stats.dailyTargetToday}</p>
                    <p className="text-xs text-text-secondary">ورد اليوم</p>
                </div>
            </div>
            
            <button onClick={() => onUpdate(khatmah)} className="w-full bg-primary/10 text-primary font-bold py-2 px-4 rounded-lg text-sm hover:bg-primary/20 transition-colors">
                تحديث التقدم
            </button>
        </div>
    );
};


// --- Main Panel Component ---
const KhatmahPanel: React.FC = () => {
    const { state } = useApp();
    const [modalState, setModalState] = useState<'hidden' | 'add' | 'update'>('hidden');
    const [selectedKhatmah, setSelectedKhatmah] = useState<Khatmah | null>(null);

    const { activeKhatmahs, completedKhatmahs } = useMemo(() => {
        const active = state.khatmahs.filter(k => !k.completed);
        const completed = state.khatmahs.filter(k => k.completed);
        return { activeKhatmahs: active, completedKhatmahs: completed };
    }, [state.khatmahs]);

    const handleOpenUpdateModal = (khatmah: Khatmah) => {
        setSelectedKhatmah(khatmah);
        setModalState('update');
    };

    return (
        <Panel id={PanelType.Khatmahs} title="الختمات">
            <div className="p-4 space-y-4">
                {activeKhatmahs.length === 0 && completedKhatmahs.length === 0 && (
                     <div className="text-center py-10 px-4 text-text-secondary">
                        <i className="fas fa-calendar-check text-4xl mb-4"></i>
                        <p className="font-bold text-lg">لا يوجد ختمات بعد</p>
                        <p className="text-sm">ابدأ ختمة جديدة لتتبع تقدمك في قراءة القرآن الكريم.</p>
                     </div>
                )}

                {activeKhatmahs.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-text-secondary text-sm px-1">الختمات الحالية</h3>
                        {activeKhatmahs.map(k => <KhatmahCard key={k.id} khatmah={k} onUpdate={handleOpenUpdateModal} />)}
                    </div>
                )}
                
                {completedKhatmahs.length > 0 && (
                    <div className="space-y-3">
                         <h3 className="font-bold text-text-secondary text-sm px-1 mt-6">الختمات المكتملة</h3>
                         {completedKhatmahs.map(k => (
                             <div key={k.id} className="bg-bg-secondary p-4 rounded-lg opacity-70">
                                <p className="text-text-primary"><i className="fas fa-check-circle text-green-500 mr-2"></i>{k.name} - <span className="text-text-secondary text-sm">أكملت في {k.duration} يوم</span></p>
                             </div>
                         ))}
                    </div>
                )}

                <button onClick={() => setModalState('add')} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors mt-4">
                    <i className="fas fa-plus"></i>
                    <span>إنشاء ختمة جديدة</span>
                </button>
            </div>
            
            {modalState !== 'hidden' && (
                <KhatmahModal 
                    mode={modalState}
                    khatmah={selectedKhatmah}
                    onClose={() => {
                        setModalState('hidden');
                        setSelectedKhatmah(null);
                    }}
                />
            )}
        </Panel>
    );
};

export default KhatmahPanel;
