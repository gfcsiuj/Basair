import React, { useState, useEffect, useMemo, useRef } from 'react';
import Panel from './Panel';
import { Panel as PanelType, ReadingMode, TasbeehCounter } from '../../types';
import { useApp } from '../../hooks/useApp';
import { TOTAL_PAGES } from '../../constants';

// Main Menu Panel - This is the primary navigation hub now.
export const MenuPanel: React.FC = () => {
    const { actions } = useApp();
    
    const menuItems: {
        icon: string;
        title: string;
        subtitle: string;
        panel?: PanelType;
        action?: () => void;
    }[] = [
        { icon: 'fa-tachometer-alt', title: 'لوحة التحكم', subtitle: 'نظرة عامة على تقدمك', panel: PanelType.Dashboard },
        { icon: 'fa-sitemap', title: 'الفهرس الموضوعي', subtitle: 'تصفح الآيات حسب الموضوع', panel: PanelType.ThematicIndex },
        { icon: 'fa-mosque', title: 'أوقات الصلاة', subtitle: 'القبلة ومواقيت الصلاة', panel: PanelType.PrayerTimes },
        { icon: 'fa-download', title: 'المحتوى بدون انترنت', subtitle: 'تحميل السور والتلاوات', panel: PanelType.OfflineManager },
        { icon: 'fa-chart-line', title: 'الإحصائيات', subtitle: 'تابع تقدمك في القراءة', panel: PanelType.Statistics },
        { icon: 'fa-calendar-check', title: 'الختمات', subtitle: 'أنشئ وتابع ختماتك للقرآن', panel: PanelType.Khatmahs },
        { icon: 'fa-praying-hands', title: 'الأدعية', subtitle: 'أدعية من القرآن والسنة', panel: PanelType.Supplications },
        { icon: 'fa-stream', title: 'التسبيح', subtitle: 'عداد التسبيح الإلكتروني', panel: PanelType.Tasbeeh },
        { icon: 'fa-pen-alt', title: 'الملاحظات', subtitle: 'دون ملاحظاتك وتأملاتك', panel: PanelType.Notes },
        { icon: 'fa-cog', title: 'الإعدادات', subtitle: 'تخصيص مظهر التطبيق والصوت', panel: PanelType.Settings },
    ];

    return (
        <Panel id={PanelType.Menu} title="القائمة الرئيسية">
            <div className="py-2">
                {menuItems.map((item, index) => (
                    <div 
                        key={item.title} 
                        onClick={() => item.panel ? actions.openPanel(item.panel) : item.action?.()} 
                        className="menu-item flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-bg-secondary transition-colors animate-listItemEnter"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-lg">
                           <i className={`fas ${item.icon} text-xl w-6 text-center`}></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-text-primary">{item.title}</h4>
                            <p className="text-xs text-text-secondary">{item.subtitle}</p>
                        </div>
                         <i className="fas fa-chevron-left text-text-tertiary mr-auto"></i>
                    </div>
                ))}
            </div>
        </Panel>
    );
};

// --- In-file Panel Definitions ---
const EmptyState: React.FC<{icon: string; title: string; subtitle: string; cta?: React.ReactNode}> = ({icon, title, subtitle, cta}) => (
    <div className="text-center py-10 px-4 text-text-secondary flex flex-col items-center justify-center h-full">
        <i className={`fas ${icon} text-4xl mb-4`}></i>
        <p className="font-bold text-lg">{title}</p>
        <p className="text-sm">{subtitle}</p>
        {cta && <div className="mt-6">{cta}</div>}
    </div>
);

// --- Statistics Panel ---
export const StatisticsPanel: React.FC = () => {
    const { state } = useApp();
    const { readingLog, bookmarks, notes, khatmahs } = state;

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayPages = readingLog[today]?.length || 0;

        let weekPages = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            weekPages += readingLog[dateStr]?.length || 0;
        }

        const activeKhatmah = khatmahs.find(k => !k.completed);
        const khatmahProgress = activeKhatmah ? (activeKhatmah.pagesRead / TOTAL_PAGES) * 100 : 0;

        return { todayPages, weekPages, bookmarksCount: bookmarks.length, notesCount: notes.length, khatmahProgress };
    }, [readingLog, bookmarks, notes, khatmahs]);
    
    const StatCard: React.FC<{icon: string; value: string | number; label: string;}> = ({icon, value, label}) => (
        <div className="bg-bg-secondary p-4 rounded-lg flex items-center gap-4">
            <i className={`fas ${icon} text-primary text-2xl`}></i>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-text-secondary">{label}</p>
            </div>
        </div>
    );

    return (
        <Panel id={PanelType.Statistics} title="الإحصائيات">
            <div className="p-4 grid grid-cols-2 gap-4">
                <StatCard icon="fa-book-open" value={stats.todayPages} label="صفحات اليوم" />
                <StatCard icon="fa-calendar-week" value={stats.weekPages} label="صفحات الأسبوع" />
                <StatCard icon="fa-bookmark" value={stats.bookmarksCount} label="آية مفضلة" />
                <StatCard icon="fa-pen-alt" value={stats.notesCount} label="ملاحظة مدونة" />
                <div className="col-span-2 bg-bg-secondary p-4 rounded-lg">
                    <h4 className="font-bold mb-2">تقدم الختمة الحالية</h4>
                    <div className="w-full bg-bg-tertiary rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{width: `${stats.khatmahProgress.toFixed(1)}%`}}></div>
                    </div>
                     <p className="text-xs text-center mt-2 text-text-secondary">{stats.khatmahProgress.toFixed(1)}% مكتمل</p>
                </div>
            </div>
        </Panel>
    );
}

// --- Supplications Panel ---
export const SupplicationsPanel: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredDuas = duaData.filter(dua => dua.title.includes(searchTerm) || dua.arabic.includes(searchTerm));

    return (
        <Panel id={PanelType.Supplications} title="الأدعية">
            <div className="p-4 sticky top-0 bg-bg-primary z-10 border-b border-border">
                <input type="text" placeholder="ابحث عن دعاء..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-full bg-bg-secondary border-border" />
            </div>
            <div className="p-4 space-y-3">
                {filteredDuas.map((dua, index) => (
                    <div key={index} className="bg-bg-secondary p-4 rounded-lg">
                        <h4 className="font-bold mb-2 text-primary">{dua.title}</h4>
                        <p className="font-arabic text-lg mb-2">{dua.arabic}</p>
                        <p className="text-sm text-text-secondary mb-2" dir="ltr">{dua.translation}</p>
                        <p className="text-xs text-text-tertiary">{dua.reference}</p>
                    </div>
                ))}
            </div>
        </Panel>
    );
};


// --- Tasbeeh Panel ---
const TasbeehModal: React.FC<{
    counter?: TasbeehCounter | null;
    onClose: () => void;
}> = ({ counter, onClose }) => {
    const { actions } = useApp();
    const [name, setName] = useState(counter?.name || '');
    const [target, setTarget] = useState(counter?.target || 33);
    const mode = counter ? 'edit' : 'add';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (mode === 'add') {
            actions.addTasbeehCounter({ name, target });
        } else if (counter) {
            actions.updateTasbeehCounterDetails(counter.id, { name, target });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-bg-primary rounded-xl w-full max-w-sm shadow-xl p-6 animate-scaleIn" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4 text-text-primary">{mode === 'add' ? 'عداد جديد' : 'تعديل العداد'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-text-secondary">اسم الذكر</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="سبحان الله، الحمد لله..." className="input w-full bg-bg-secondary border-border" required />
                    </div>
                    <div>
                        <label className="text-sm text-text-secondary">الهدف</label>
                        <input type="number" value={target} onChange={e => setTarget(parseInt(e.target.value))} min="1" className="input w-full bg-bg-secondary border-border" required />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button type="submit" className="btn-primary flex-1">حفظ</button>
                    <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
                </div>
            </form>
        </div>
    );
};

export const TasbeehPanel: React.FC = () => {
    const { state, actions } = useApp();
    const { tasbeehCounters } = state;
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; counter?: TasbeehCounter | null }>({ isOpen: false });
    const isInitialLoad = useRef(true);
    const [activeCounterId, setActiveCounterId] = useState<string | null>(null);

    const sortedCounters = useMemo(() => [...tasbeehCounters].sort((a, b) => a.name.localeCompare(b.name, 'ar')), [tasbeehCounters]);
    
    useEffect(() => {
        const hasCounters = sortedCounters.length > 0;

        if (!hasCounters) {
            if (activeCounterId !== null) setActiveCounterId(null);
            return;
        }

        const activeCounterExists = sortedCounters.some(c => c.id === activeCounterId);
        
        if (!activeCounterExists) {
            const lastActiveId = localStorage.getItem('lastActiveTasbeehId');
            const lastActiveCounter = sortedCounters.find(c => c.id === lastActiveId);

            if (lastActiveCounter) {
                setActiveCounterId(lastActiveCounter.id);
            } else {
                setActiveCounterId(sortedCounters[0].id);
            }
        }
    }, [sortedCounters, activeCounterId]);

    useEffect(() => {
        if (activeCounterId) {
            localStorage.setItem('lastActiveTasbeehId', activeCounterId);
        } else if (tasbeehCounters.length === 0) {
            localStorage.removeItem('lastActiveTasbeehId');
        }
    }, [activeCounterId, tasbeehCounters.length]);
    
    useEffect(() => {
        if (isInitialLoad.current && tasbeehCounters.length === 0) {
            actions.addTasbeehCounter({ name: "سبحان الله", target: 33 });
            actions.addTasbeehCounter({ name: "الحمد لله", target: 33 });
            actions.addTasbeehCounter({ name: "الله أكبر", target: 33 });
        }
        isInitialLoad.current = false;
    }, [actions, tasbeehCounters.length]);
    
    const activeCounter = useMemo(() => tasbeehCounters.find(c => c.id === activeCounterId), [activeCounterId, tasbeehCounters]);

    const handleIncrement = () => {
        if (!activeCounter) return;
        try { window.navigator.vibrate(10); } catch(e) {}
        const newCount = activeCounter.count + 1;
        actions.updateTasbeehCounter(activeCounter.id, newCount);
        
        if (newCount >= activeCounter.target) {
             try { window.navigator.vibrate([100, 30, 100]); } catch(e) {}
             const currentIndex = sortedCounters.findIndex(c => c.id === activeCounter.id);
             if (currentIndex > -1 && sortedCounters.length > 1) {
                 const nextIndex = (currentIndex + 1) % sortedCounters.length;
                 setActiveCounterId(sortedCounters[nextIndex].id);
             }
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الذكر؟')) {
            if (activeCounterId === id) {
                setActiveCounterId(null);
            }
            actions.deleteTasbeehCounter(id);
        }
    };

    const handleResetAll = () => {
        if (window.confirm('هل أنت متأكد من إعادة تعيين جميع العدادات إلى الصفر؟')) {
            actions.resetAllTasbeehCounters();
        }
    };

    const progress = activeCounter ? (activeCounter.target > 0 ? (activeCounter.count / activeCounter.target) * 100 : 0) : 0;
    const circumference = 2 * Math.PI * 120; // Radius is 120
    const offset = circumference - (progress / 100) * circumference;
    
    const headerActions = (
        <button onClick={handleResetAll} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="إعادة تعيين الكل">
            <i className="fas fa-sync-alt text-lg"></i>
        </button>
    );

    return (
        <Panel id={PanelType.Tasbeeh} title="التسبيح" headerActions={headerActions}>
            <div className="flex flex-col h-full bg-bg-primary">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {sortedCounters.map(counter => {
                        const isActive = activeCounterId === counter.id;
                        return (
                            <div key={counter.id} onClick={() => setActiveCounterId(counter.id)} className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 flex items-center justify-between ${isActive ? 'bg-primary/10 border-primary shadow-sm' : 'bg-bg-secondary border-transparent hover:border-primary/50'}`}>
                                <div>
                                    <h4 className={`font-bold ${isActive ? 'text-primary' : 'text-text-primary'}`}>{counter.name}</h4>
                                    <p className="text-sm font-mono text-text-secondary">{counter.count} / {counter.target}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); setModalConfig({ isOpen: true, counter }); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary"><i className="fas fa-edit text-sm"></i></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(counter.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500/80 hover:bg-red-500/10"><i className="fas fa-trash text-sm"></i></button>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={() => setModalConfig({ isOpen: true })} className="w-full text-center p-3 mt-2 rounded-lg border-2 border-dashed border-border hover:border-primary hover:text-primary transition-colors text-text-secondary bg-bg-secondary">
                        <i className="fas fa-plus mr-2"></i>إضافة ذكر جديد
                    </button>
                </div>

                <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 relative bg-bg-secondary border-t-2 border-border">
                    {activeCounter ? (
                         <>
                            <p className="text-3xl font-bold text-text-primary transition-all duration-300 mb-4" key={`${activeCounter.id}-name`}>
                                {activeCounter.name}
                            </p>
                            <div className="relative w-72 h-72 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 260 260">
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{stopColor: 'var(--primary-light)', stopOpacity:1}} />
                                            <stop offset="100%" style={{stopColor: 'var(--primary)', stopOpacity:1}} />
                                        </linearGradient>
                                    </defs>
                                    <circle cx="130" cy="130" r="120" stroke="var(--border)" strokeWidth="18" fill="transparent" />
                                    <circle cx="130" cy="130" r="120" stroke="url(#progressGradient)" strokeWidth="18" fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-300" />
                                </svg>
        
                                <button 
                                    onClick={handleIncrement} 
                                    className="relative z-10 w-48 h-48 bg-bg-primary rounded-full flex items-center justify-center text-primary shadow-lg active:scale-95 transition-transform duration-150 focus:outline-none focus:ring-4 focus:ring-primary/30"
                                    aria-label={`زيادة عداد ${activeCounter.name}`}
                                >
                                    <span className="text-7xl font-bold tabular-nums transition-all duration-300" key={`${activeCounter.id}-count`}>
                                        {activeCounter.count}
                                    </span>
                                </button>
                            </div>
                            <div className="flex flex-col items-center mt-4">
                                <p className="text-lg text-text-tertiary">الهدف: {activeCounter.target}</p>
                                <button onClick={() => actions.resetTasbeehCounter(activeCounter.id)} className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mt-1">
                                    <i className="fas fa-undo"></i>
                                    <span>إعادة</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full py-20">
                            <EmptyState 
                                icon="fa-stream" 
                                title="لا توجد عدادات" 
                                subtitle="ابدأ بإضافة عداد جديد لتتبع أذكارك." 
                            />
                        </div>
                    )}
                </div>
            </div>
            {modalConfig.isOpen && <TasbeehModal counter={modalConfig.counter} onClose={() => setModalConfig({ isOpen: false })} />}
        </Panel>
    );
};


// --- Notes Panel ---
export const NotesPanel: React.FC = () => {
    const { state, actions } = useApp();
    const { notes, noteVerseTarget } = state;
    const [editingNote, setEditingNote] = useState<any>(null); // Use a more specific type if needed
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        if (noteVerseTarget) {
            const surah = state.surahs.find(s => s.id === noteVerseTarget.chapter_id);
            setEditingNote({
                verseKey: noteVerseTarget.verse_key,
                verseText: noteVerseTarget.text_uthmani,
                surahName: surah?.name_arabic || '',
            });
            setNoteText('');
            actions.setState(s => ({ ...s, noteVerseTarget: null }));
        }
    }, [noteVerseTarget, state.surahs, actions]);

    const handleSave = () => {
        if (!noteText.trim() || !editingNote) return;
        if (editingNote.id) { // Editing existing note
            actions.updateNote({ ...editingNote, text: noteText });
        } else { // Creating new note
            actions.addNote({ ...editingNote, text: noteText });
        }
        setEditingNote(null);
        setNoteText('');
    };
    
    const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);

    if (editingNote) {
        return (
            <Panel id={PanelType.Notes} title={editingNote.id ? 'تعديل ملاحظة' : 'ملاحظة جديدة'}>
                <div className="p-4 space-y-4">
                    <div className="bg-bg-secondary p-3 rounded-lg">
                        <p className="font-arabic text-lg">{editingNote.verseText}</p>
                        <p className="text-sm text-text-secondary mt-1">{editingNote.surahName} - الآية {editingNote.verseKey.split(':')[1]}</p>
                    </div>
                    <textarea 
                        value={noteText} 
                        onChange={e => setNoteText(e.target.value)}
                        rows={10} 
                        className="input w-full bg-bg-secondary border-border"
                        placeholder="اكتب تأملاتك هنا..."
                    ></textarea>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="btn-primary flex-1">حفظ</button>
                        <button onClick={() => setEditingNote(null)} className="btn-secondary flex-1">إلغاء</button>
                    </div>
                </div>
            </Panel>
        )
    }

    return (
        <Panel id={PanelType.Notes} title="الملاحظات">
            {sortedNotes.length > 0 ? (
                <div className="p-4 space-y-3">
                    {sortedNotes.map(note => (
                        <div key={note.id} className="bg-bg-secondary p-4 rounded-lg">
                            <p className="font-bold text-sm text-primary mb-2">{note.surahName} - الآية {note.verseKey.split(':')[1]}</p>
                            <p className="text-text-primary mb-3">{note.text}</p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setEditingNote(note); setNoteText(note.text); }} className="text-sm text-primary">تعديل</button>
                                <button onClick={() => actions.deleteNote(note.id)} className="text-sm text-red-500">حذف</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon="fa-pen-alt" title="لا توجد ملاحظات" subtitle="اضغط على أي آية ثم اختر 'ملاحظة' للبدء."/>
            )}
        </Panel>
    );
};

// Dummy data file for supplications (duaData.ts) - included here for simplicity
export const duaData = [
    {
        title: "دعاء ختم القرآن",
        arabic: "اللَّهُمَّ ارْحَمْنِي بالقُرْءَانِ وَاجْعَلهُ لِي إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً...",
        translation: "O Allah, have mercy on me with the Qur'an and make it for me a guide, a light, a guidance, and a mercy...",
        reference: "دعاء مأثور"
    },
    {
        title: "ربنا آتنا في الدنيا حسنة",
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        translation: "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.",
        reference: "سورة البقرة: 201"
    },
];

const DefaultExport = MenuPanel;
export default DefaultExport;