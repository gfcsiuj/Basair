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
            <div
                style={{ fontFamily: 'quran-common', fontFeatureSettings: '"calt", "liga"' }}
                className="text-5xl md:text-6xl text-center text-primary leading-none"
                aria-hidden="true"
            >
                {headerLigature}
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