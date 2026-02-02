import React from 'react';
import { Surah } from '../types';
import Bismillah from './Bismillah';

interface SurahHeaderProps {
    surah: Surah;
}

const SurahHeader: React.FC<SurahHeaderProps> = ({ surah }) => {
    const paddedSurahId = String(surah.id).padStart(3, '0');
    // The font uses ligatures like 'header001', 'header002' to display decorative headers.
    const headerLigature = `header${paddedSurahId}`;
    
    return (
        <div className="surah-header-container mb-4 w-full flex flex-col items-center">
            <div
                style={{ fontFamily: 'quran-common', fontFeatureSettings: '"calt", "liga"' }}
                className="text-5xl md:text-6xl text-center text-primary leading-tight -mt-4 mb-2"
                aria-label={`سورة ${surah.name_arabic}`}
            >
                {headerLigature}
            </div>
            {surah.id !== 1 && surah.bismillah_pre && <Bismillah />}
        </div>
    );
};

export default SurahHeader;