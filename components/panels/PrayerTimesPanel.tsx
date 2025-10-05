import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import { Panel as PanelType } from '../../types';
import { useApp } from '../../hooks/useApp';

const PrayerTimesPanel: React.FC = () => {
    const { state } = useApp();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const mockPrayerTimes = {
        Fajr: '04:30',
        Dhuhr: '12:15',
        Asr: '15:45',
        Maghrib: '18:30',
        Isha: '20:00',
    };

    const prayerNames = [
        { key: 'Fajr', name: 'الفجر', icon: 'fa-sun' },
        { key: 'Dhuhr', name: 'الظهر', icon: 'fa-cloud-sun' },
        { key: 'Asr', name: 'العصر', icon: 'fa-cloud' },
        { key: 'Maghrib', name: 'المغرب', icon: 'fa-cloud-moon' },
        { key: 'Isha', name: 'العشاء', icon: 'fa-moon' },
    ];

    return (
        <Panel id={PanelType.PrayerTimes} title="أوقات الصلاة">
            <div className="p-4 space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-6 rounded-xl shadow-lg text-center">
                    <h2 className="text-4xl font-bold">{currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</h2>
                    <p className="opacity-80 mt-1">{currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="mt-4 font-semibold"><i className="fas fa-map-marker-alt mr-2"></i>مكة المكرمة (بيانات تجريبية)</p>
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

                {/* Prayer Times List */}
                <div className="space-y-2">
                    {prayerNames.map((prayer, index) => (
                        <div key={prayer.key} 
                             className="bg-bg-secondary p-4 rounded-lg flex items-center justify-between animate-listItemEnter"
                             style={{ animationDelay: `${index * 60}ms` }}
                        >
                            <div className="flex items-center gap-4">
                                <i className={`fas ${prayer.icon} text-primary text-xl`}></i>
                                <span className="font-bold text-text-primary">{prayer.name}</span>
                            </div>
                            <span className="font-bold text-lg text-text-primary font-mono">{mockPrayerTimes[prayer.key as keyof typeof mockPrayerTimes]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Panel>
    );
};

export default PrayerTimesPanel;