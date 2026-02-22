import React, { useState, useEffect } from 'react';

interface ToastMessage {
    id: string;
    text: string;
    type: 'success' | 'info' | 'warning' | 'error';
}

let toastListeners: ((msg: ToastMessage) => void)[] = [];

// Global function to show toasts from anywhere
export const showToast = (text: string, type: ToastMessage['type'] = 'success') => {
    const msg: ToastMessage = { id: Date.now().toString(), text, type };
    toastListeners.forEach(fn => fn(msg));
};

const ICONS: Record<string, string> = {
    success: 'fa-check-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle',
};

const COLORS: Record<string, string> = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
};

const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handler = (msg: ToastMessage) => {
            setToasts(prev => [...prev, msg]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== msg.id));
            }, 2500);
        };
        toastListeners.push(handler);
        return () => {
            toastListeners = toastListeners.filter(fn => fn !== handler);
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium animate-slideInUp"
                    style={{
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                >
                    <div className={`w-7 h-7 rounded-full ${COLORS[toast.type]} flex items-center justify-center shrink-0`}>
                        <i className={`fas ${ICONS[toast.type]} text-xs`}></i>
                    </div>
                    <span className="flex-1 text-right" dir="rtl">{toast.text}</span>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
