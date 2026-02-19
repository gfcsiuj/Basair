import React from 'react';
import { Surah } from '../types';

interface SurahHeaderProps {
    surah: Surah;
}

const SurahHeader: React.FC<SurahHeaderProps> = ({ surah }) => {
    const paddedSurahId = String(surah.id).padStart(3, '0');
    const headerLigature = `header${paddedSurahId}`;
    const isMakki = surah.revelation_place === 'makkah';

    return (
        <div className="surah-header-container mb-2 w-full relative">
            {/* Decorative frame from quran-common font */}
            {/* Decorative frame image */}
            <div className="w-full relative flex justify-center items-center">
                <img
                    src="/surah_hedar.svg"
                    alt="Surah Header Frame"
                    className="w-full h-auto object-contain select-none pointer-events-none"
                />
            </div>

            {/* Surah name centered */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span
                    className="text-primary font-bold"
                    style={{ fontSize: '1.1rem', fontFamily: 'Rubik, sans-serif' }}
                >
                    سورة {surah.name_arabic}
                </span>
            </div>

            {/* عدد الآيات - في الدائرة اليسرى */}
            <div
                className="absolute inset-y-0 flex items-center justify-center"
                style={{ left: '19%', width: '9%' }}
            >
                <span
                    className="text-primary font-extrabold text-center leading-tight"
                    style={{ fontSize: '7px', fontFamily: 'Rubik, sans-serif' }}
                >
                    {surah.verses_count}<br />آية
                </span>
            </div>

            {/* مكية/مدنية - في الدائرة اليمنى */}
            <div
                className="absolute inset-y-0 flex items-center justify-center"
                style={{ right: '19%', width: '9%' }}
            >
                <span
                    className="text-primary font-extrabold text-center leading-tight"
                    style={{ fontSize: '7px', fontFamily: 'Rubik, sans-serif' }}
                >
                    {isMakki ? 'مكية' : 'مدنية'}
                </span>
            </div>
        </div>
    );
};

export default SurahHeader;