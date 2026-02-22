import React from 'react';
import { Surah } from '../types';

interface SurahHeaderProps {
    surah: Surah;
}

// Unicode codepoints for surah names from the surah_names.ttf font
// Extracted from font cmap table. Surahs 22-114 → FB51-FBEB, Surahs 1-21 → FC45-FC64
const SURAH_CODEPOINTS_22_TO_114: number[] = [
    0xFB51, 0xFB52, 0xFB54, 0xFB55, 0xFB57, 0xFB58, 0xFB5A, 0xFB5B,
    0xFB5D, 0xFB5E, 0xFB60, 0xFB61, 0xFB63, 0xFB64, 0xFB66, 0xFB67,
    0xFB69, 0xFB6A, 0xFB6C, 0xFB6D, 0xFB6F, 0xFB70, 0xFB72, 0xFB73,
    0xFB75, 0xFB76, 0xFB78, 0xFB79, 0xFB7B, 0xFB7C, 0xFB7E, 0xFB7F,
    0xFB81, 0xFB82, 0xFB84, 0xFB85, 0xFB87, 0xFB88, 0xFB8A, 0xFB8B,
    0xFB8D, 0xFB8E, 0xFB90, 0xFB91, 0xFB93, 0xFB94, 0xFB96, 0xFB97,
    0xFB99, 0xFB9A, 0xFB9C, 0xFB9D, 0xFB9F, 0xFBA0, 0xFBA2, 0xFBA3,
    0xFBA5, 0xFBA6, 0xFBA8, 0xFBA9, 0xFBAB, 0xFBAC, 0xFBAE, 0xFBAF,
    0xFBB1, 0xFBB2, 0xFBB4, 0xFBB5, 0xFBB7, 0xFBB8, 0xFBBA, 0xFBBB,
    0xFBBD, 0xFBBE, 0xFBC0, 0xFBC1, 0xFBD3, 0xFBD4, 0xFBD6, 0xFBD7,
    0xFBD9, 0xFBDA, 0xFBDC, 0xFBDD, 0xFBDF, 0xFBE0, 0xFBE2, 0xFBE3,
    0xFBE5, 0xFBE6, 0xFBE8, 0xFBE9, 0xFBEB,
];

const SURAH_CODEPOINTS_1_TO_21: number[] = [
    0xFC45, 0xFC46, 0xFC47, 0xFC4A, 0xFC4B, 0xFC4E, 0xFC4F, 0xFC51,
    0xFC52, 0xFC53, 0xFC55, 0xFC56, 0xFC58, 0xFC5A, 0xFC5B, 0xFC5C,
    0xFC5D, 0xFC5E, 0xFC61, 0xFC62, 0xFC64,
];

const getSurahNameChar = (surahId: number): string => {
    if (surahId >= 1 && surahId <= 21) {
        return String.fromCharCode(SURAH_CODEPOINTS_1_TO_21[surahId - 1]);
    }
    if (surahId >= 22 && surahId <= 114) {
        return String.fromCharCode(SURAH_CODEPOINTS_22_TO_114[surahId - 22]);
    }
    return '';
};

const SurahHeader: React.FC<SurahHeaderProps> = ({ surah }) => {
    const isMakki = surah.revelation_place === 'makkah';
    const surahNameChar = getSurahNameChar(surah.id);

    return (
        <div className="surah-header-container mb-2 w-full relative">
            {/* Decorative frame image */}
            <div className="w-full relative flex justify-center items-center">
                <img
                    src="/surah_hedar.svg"
                    alt="Surah Header Frame"
                    className="w-full h-auto object-contain select-none pointer-events-none"
                />
            </div>

            {/* Surah name centered - positioned to look like part of the frame */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ marginTop: '-3px' }}
            >
                <span
                    style={{
                        fontSize: 'clamp(1rem, 4.5vw, 1.6rem)',
                        fontFamily: "'surah-names'",
                        lineHeight: 1,
                        display: 'inline-block',
                    }}
                >
                    {surahNameChar}
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