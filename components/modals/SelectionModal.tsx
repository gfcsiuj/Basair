import React, { useState, useMemo } from 'react';

interface SelectionModalProps {
    title: string;
    items: { id: number; name: string; subtext?: string }[];
    selectedId: number;
    favorites: number[];
    onSelect: (id: number) => void;
    onToggleFavorite: (id: number) => void;
    onClose: () => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
    title,
    items,
    selectedId,
    favorites,
    onSelect,
    onToggleFavorite,
    onClose,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const sortedItems = useMemo(() => {
        const favoritesSet = new Set(favorites);
        return [...items].sort((a, b) => {
            const aIsFav = favoritesSet.has(a.id);
            const bIsFav = favoritesSet.has(b.id);
            if (aIsFav && !bIsFav) return -1;
            if (!aIsFav && bIsFav) return 1;
            return a.name.localeCompare(b.name, 'ar');
        });
    }, [items, favorites]);

    const filteredItems = useMemo(() =>
        sortedItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [sortedItems, searchTerm]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] grid place-items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-bg-primary rounded-xl w-full max-w-sm max-h-[70vh] shadow-xl flex flex-col animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-bold text-lg text-text-primary">{title}</h3>
                    <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg-secondary rounded-full">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div className="p-2 border-b border-border">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="ابحث..."
                        className="input w-full bg-bg-secondary border-border"
                        autoFocus
                    />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div key={item.id} onClick={() => { onSelect(item.id); onClose(); }} className="flex items-center w-full px-4 py-3 hover:bg-bg-secondary transition-colors group cursor-pointer border-b border-border/50 last:border-0">
                                <div className="flex-1 text-right">
                                    <p className={`${selectedId === item.id ? 'font-bold text-primary' : 'text-text-primary'}`}>
                                        {item.name}
                                    </p>
                                    {item.subtext && <p className="text-xs text-text-tertiary mt-0.5">{item.subtext}</p>}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(item.id);
                                    }}
                                    className="p-2 rounded-full hover:bg-bg-tertiary transition-colors"
                                    aria-label={`Mark ${item.name} as favorite`}
                                >
                                    <i className={`${favorites.includes(item.id) ? 'fas fa-star text-yellow-500' : 'far fa-star text-text-tertiary group-hover:text-yellow-500'}`}></i>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-text-tertiary">
                            <i className="fas fa-search mb-2 text-2xl opacity-50"></i>
                            <p>لا توجد نتائج</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelectionModal;
