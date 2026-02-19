import React from 'react';

// ========== Makki / Madani SVG Icons ==========
export const MakkiIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L14.5 8H9.5L12 2Z" fill="currentColor" opacity="0.8" />
        <rect x="10" y="8" width="4" height="10" rx="0.5" fill="currentColor" opacity="0.6" />
        <path d="M4 22H20V20C20 18.9 19.1 18 18 18H6C4.9 18 4 18.9 4 20V22Z" fill="currentColor" opacity="0.4" />
        <rect x="6" y="12" width="2" height="6" rx="0.3" fill="currentColor" opacity="0.3" />
        <rect x="16" y="12" width="2" height="6" rx="0.3" fill="currentColor" opacity="0.3" />
    </svg>
);

export const MadaniIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 4C12 4 8 7 8 10C8 12.2 9.8 14 12 14C14.2 14 16 12.2 16 10C16 7 12 4 12 4Z" fill="currentColor" opacity="0.6" />
        <rect x="11" y="2" width="2" height="4" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="4" y="14" width="16" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
        <rect x="6" y="16" width="3" height="6" rx="0.3" fill="currentColor" opacity="0.3" />
        <rect x="15" y="16" width="3" height="6" rx="0.3" fill="currentColor" opacity="0.3" />
        <rect x="10.5" y="16" width="3" height="6" rx="0.3" fill="currentColor" opacity="0.4" />
        <rect x="4" y="22" width="16" height="1" rx="0.3" fill="currentColor" opacity="0.3" />
    </svg>
);

// ========== Ornamental Divider ==========
export const OrnamentalDivider: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
    <svg viewBox="0 0 200 20" className={`w-full h-5 ${className}`} fill="none" preserveAspectRatio="xMidYMid meet">
        <line x1="0" y1="10" x2="70" y2="10" stroke={color || 'currentColor'} strokeWidth="0.5" opacity="0.3" />
        <line x1="130" y1="10" x2="200" y2="10" stroke={color || 'currentColor'} strokeWidth="0.5" opacity="0.3" />
        <g transform="translate(100, 10)">
            <path d="M-15 0L0 -8L15 0L0 8Z" fill={color || 'currentColor'} opacity="0.2" />
            <path d="M-10 0L0 -5L10 0L0 5Z" fill={color || 'currentColor'} opacity="0.3" />
            <circle r="2" fill={color || 'currentColor'} opacity="0.5" />
        </g>
        <circle cx="75" cy="10" r="1.5" fill={color || 'currentColor'} opacity="0.3" />
        <circle cx="125" cy="10" r="1.5" fill={color || 'currentColor'} opacity="0.3" />
    </svg>
);

// ========== Verse Number Badge (Octagonal) ==========
export const VerseNumberBadge: React.FC<{ number: number | string; size?: number; className?: string }> = ({ number, size = 28, className = '' }) => (
    <span className={`inline-flex items-center justify-center align-middle mx-0.5 select-none ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <path
                d="M16 1L22.5 4.5L28 10L28 22L22.5 27.5L16 31L9.5 27.5L4 22L4 10L9.5 4.5Z"
                fill="var(--primary)"
                stroke="var(--primary)"
                strokeWidth="1"
                fillOpacity="0.15"
                strokeOpacity="0.5"
            />
            <text
                x="16" y="17"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--primary)"
                fontFamily="'Rubik', sans-serif"
                fontSize="10"
                fontWeight="600"
            >
                {number}
            </text>
        </svg>
    </span>
);

// ========== Surah Frame Decoration for Share Image ==========
export const SurahFrameTop: React.FC<{ color?: string; width?: number }> = ({ color = '#D4AF37', width = 400 }) => (
    <svg width={width} height="40" viewBox="0 0 400 40" fill="none" preserveAspectRatio="xMidYMid meet">
        <rect x="10" y="5" width="380" height="30" rx="4" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
        <rect x="15" y="8" width="370" height="24" rx="2" stroke={color} strokeWidth="0.5" fill="none" opacity="0.3" />
        {/* Corner ornaments */}
        <circle cx="10" cy="5" r="3" fill={color} opacity="0.6" />
        <circle cx="390" cy="5" r="3" fill={color} opacity="0.6" />
        <circle cx="10" cy="35" r="3" fill={color} opacity="0.6" />
        <circle cx="390" cy="35" r="3" fill={color} opacity="0.6" />
        {/* Center diamond */}
        <path d="M195 5L200 0L205 5" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M195 35L200 40L205 35" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
);

export const SurahFrameBottom: React.FC<{ color?: string; width?: number }> = ({ color = '#D4AF37', width = 400 }) => (
    <svg width={width} height="24" viewBox="0 0 400 24" fill="none" preserveAspectRatio="xMidYMid meet">
        <line x1="20" y1="12" x2="160" y2="12" stroke={color} strokeWidth="0.5" opacity="0.4" />
        <line x1="240" y1="12" x2="380" y2="12" stroke={color} strokeWidth="0.5" opacity="0.4" />
        <g transform="translate(200, 12)">
            <path d="M-12 0L0 -6L12 0L0 6Z" fill={color} opacity="0.3" />
            <path d="M-7 0L0 -3.5L7 0L0 3.5Z" fill={color} opacity="0.5" />
            <circle r="1.5" fill={color} opacity="0.7" />
        </g>
    </svg>
);

// ========== Juz Header Decoration ==========
export const JuzHeaderDecoration: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg viewBox="0 0 300 30" className={`w-full h-6 ${className}`} fill="none" preserveAspectRatio="xMidYMid meet">
        <line x1="0" y1="15" x2="100" y2="15" stroke="var(--primary)" strokeWidth="1" opacity="0.2" />
        <line x1="200" y1="15" x2="300" y2="15" stroke="var(--primary)" strokeWidth="1" opacity="0.2" />
        <g transform="translate(150, 15)">
            <path d="M-20 0L-10 -8L0 -4L10 -8L20 0L10 8L0 4L-10 8Z" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle r="3" fill="var(--primary)" opacity="0.3" />
        </g>
    </svg>
);

// ========== Islamic Star Pattern ==========
export const IslamicStar: React.FC<{ size?: number; className?: string; color?: string }> = ({ size = 24, className = '', color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path
            d="M12 0L14.4 8.4L24 9.6L16.8 15.6L18 24L12 19.2L6 24L7.2 15.6L0 9.6L9.6 8.4Z"
            fill={color || 'var(--primary)'}
            opacity="0.15"
        />
        <path
            d="M12 4L13.6 9.2L19.2 10L15.2 13.6L16 19.2L12 16.4L8 19.2L8.8 13.6L4.8 10L10.4 9.2Z"
            fill={color || 'var(--primary)'}
            opacity="0.25"
        />
    </svg>
);

// ========== Surah Name Plate (for Share Image) ==========
export const SurahNamePlate: React.FC<{
    surahName: string;
    bgColor?: string;
    textColor?: string;
    width?: number;
}> = ({ surahName, bgColor = 'rgba(255,255,255,0.15)', textColor = 'inherit', width = 200 }) => (
    <div
        className="flex items-center justify-center mx-auto"
        style={{
            width,
            padding: '8px 24px',
            background: bgColor,
            borderRadius: '20px',
            border: `1px solid ${textColor === 'inherit' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'}`,
        }}
    >
        <span style={{ color: textColor, fontFamily: 'Rubik, sans-serif', fontWeight: 700, fontSize: '16px' }}>
            {surahName}
        </span>
    </div>
);

// ========== Auto-Scroll Icon ==========
export const AutoScrollIcon: React.FC<{ size?: number; className?: string; isActive?: boolean }> = ({ size = 20, className = '', isActive = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path
            d="M12 4V20M12 20L6 14M12 20L18 14"
            stroke="currentColor"
            strokeWidth={isActive ? "2.5" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {isActive && (
            <>
                <path d="M6 4H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                <path d="M8 7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            </>
        )}
    </svg>
);
