import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';

const PrayerTimesPanel: React.FC = () => {
    const { state, actions } = useApp();
    const { prayerTimes, prayerTimesStatus, locationName, areNotificationsEnabled } = state;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (state.activePanel === PanelType.PrayerTimes && prayerTimesStatus === 'idle') {
            actions.loadPrayerTimes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.activePanel, prayerTimesStatus]);

    const formatTo12Hour = (time24: string): string => {
        if (!time24) return '';
        const [hour, minute] = time24.split(':');
        const date = new Date(2000, 0, 1, parseInt(hour, 10), parseInt(minute, 10));
        return date.toLocaleTimeString('ar', { hour: 'numeric', minute: 'numeric', hour12: true, numberingSystem: 'arab' });
    };


    const prayerNames = [
        { key: 'Fajr', name: 'الفجر', icon: 'fa-star-and-crescent' },
        { key: 'Sunrise', name: 'الشروق', icon: 'fa-sun' },
        { key: 'Dhuhr', name: 'الظهر', icon: 'fa-cloud-sun' },
        { key: 'Asr', name: 'العصر', icon: 'fa-cloud' },
        { key: 'Maghrib', name: 'المغرب', icon: 'fa-cloud-moon' },
        { key: 'Isha', name: 'العشاء', icon: 'fa-moon' },
    ];

    const renderContent = () => {
        if (prayerTimesStatus === 'loading' || prayerTimesStatus === 'idle') {
            return (
                <div className="text-center py-10 text-text-secondary">
                    <i className="fas fa-spinner fa-spin text-3xl mb-4"></i>
                    <p>جاري تحديد موقعك وجلب مواقيت الصلاة...</p>
                </div>
            );
        }

        if (prayerTimesStatus === 'error') {
            return (
                <div className="text-center py-10 text-text-secondary">
                    <i className="fas fa-exclamation-triangle text-3xl mb-4 text-red-500"></i>
                    <p>فشل تحديد الموقع.</p>
                    <p className="text-sm">يرجى التأكد من تفعيل خدمة تحديد الموقع في متصفحك والمحاولة مرة أخرى.</p>
                </div>
            );
        }

        if (prayerTimesStatus === 'success' && prayerTimes) {
            return (
                <div className="space-y-2">
                    {prayerNames.map((prayer, index) => {
                        const time = prayerTimes[prayer.key as keyof typeof prayerTimes];
                        if (!time) return null;
                        return (
                            <div key={prayer.key}
                                className="bg-bg-secondary p-4 rounded-lg flex items-center justify-between animate-listItemEnter"
                                style={{ animationDelay: `${index * 60}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <i className={`fas ${prayer.icon} text-primary text-xl w-6 text-center`}></i>
                                    <span className="font-bold text-text-primary">{prayer.name}</span>
                                </div>
                                <span className="font-digital text-lg font-bold text-text-primary tracking-wider">{formatTo12Hour(time)}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return null;
    };

    const timeString = currentTime.toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit', hour12: true, numberingSystem: 'arab' });
    const timeParts = timeString.split(' ');
    const mainTime = timeParts[0];
    const mainPeriod = timeParts.length > 1 ? timeParts[1] : '';


    return (
        <Panel id={PanelType.PrayerTimes} title="أوقات الصلاة">
            <div className="p-4 space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-6 rounded-xl shadow-lg text-center">
                    <div className="flex items-center justify-center gap-2 font-digital text-white" dir="rtl">
                        <h2 className="text-7xl font-extrabold tracking-wider leading-none">{mainTime}</h2>
                        {mainPeriod && <span className="text-4xl font-bold self-end pb-2">{mainPeriod}</span>}
                    </div>
                    <p className="opacity-80 mt-2 font-display">{currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="mt-4 font-semibold font-display">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        {locationName || 'جاري تحديد الموقع...'}
                    </p>
                </div>

                {/* Qibla Direction Card */}
                <div className="bg-bg-secondary p-4 rounded-xl flex items-center justify-center space-x-4">
                    <div className="text-center">
                        <h3 className="font-bold text-lg text-text-primary">اتجاه القبلة</h3>
                        <p className="text-sm text-text-secondary">20° جنوب شرق</p>
                    </div>
                    <div className="w-20 h-20 bg-bg-tertiary rounded-full flex items-center justify-center relative">
                        <div className="absolute w-full h-full border-4 border-border rounded-full"></div>
                        <i className="fas fa-location-arrow text-primary text-4xl" style={{ transform: 'rotate(110deg)' }}></i>
                    </div>
                </div>

                {/* Notification Toggle */}
                <div className="bg-bg-secondary p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-text-primary">إشعارات الصلاة</h3>
                        <p className="text-xs text-text-secondary">تنبيه عند دخول وقت كل صلاة.</p>
                    </div>
                    <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={areNotificationsEnabled}
                        onChange={actions.toggleNotifications}
                        aria-label="تفعيل إشعارات الصلاة"
                    />
                </div>

                {/* Prayer Times List */}
                {renderContent()}
            </div>
        </Panel>
    );
};

export default PrayerTimesPanel;