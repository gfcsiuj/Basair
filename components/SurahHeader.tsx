import React from 'react';
import { Surah } from '../types';
import Bismillah from './Bismillah';

interface SurahHeaderProps {
    surah: Surah;
}

const SurahHeader: React.FC<SurahHeaderProps> = ({ surah }) => {
    return (
        <div className="surah-header-container mb-4 w-full flex flex-col items-center">
            <div
                style={{ fontFamily: 'quran-common', fontFeatureSettings: '"ss01", "ss02"' }}
                className="text-5xl md:text-6xl text-center text-primary leading-tight -mt-4 mb-2"
                aria-label={`سورة ${surah.name_arabic}`}
            >
                {`سورة ${surah.name_arabic}`}
            </div>
            {surah.bismillah_pre && <Bismillah />}
        </div>
    );
};

export default SurahHeader;