import React from 'react';
import { useApp } from '../hooks/useApp';
import Ayah from './Ayah';

const QuranPage: React.FC = () => {
    const { state } = useApp();
    const { pageData, isLoading, error, font, fontSize } = state;

    if (isLoading) {
        return (
            <div className="p-6 animate-pulse">
                <div className="h-8 bg-bg-tertiary rounded w-1/3 mx-auto mb-8"></div>
                <div className="space-y-4">
                    <div className="h-6 bg-bg-tertiary rounded"></div>
                    <div className="h-6 bg-bg-tertiary rounded w-5/6"></div>
                    <div className="h-6 bg-bg-tertiary rounded"></div>
                    <div className="h-6 bg-bg-tertiary rounded w-3/4"></div>
                    <div className="h-6 bg-bg-tertiary rounded w-4/6"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div 
          className={`page-content font-${font} text-right p-4 md:p-8 text-justify [text-align-last:right] animate-pageTransition`}
          style={{ fontSize: `${fontSize}px`, lineHeight: 2.5 }}
        >
            {pageData?.map(verse => {
                let surahHeader = null;
                // Show header only for the first verse of a surah
                if (verse.verse_number === 1) {
                    const surah = state.surahs.find(s => s.id === verse.chapter_id);
                    if (surah) {
                        surahHeader = (
                           <div className="w-full flex justify-center my-8">
                                <div className="border-2 border-primary rounded-xl p-4 bg-primary/5 shadow-lg max-w-md w-full flex flex-col justify-center items-center">
                                    <div className="w-full flex justify-between items-center text-xs text-text-secondary mb-2 font-ui">
                                        <div className="flex items-center gap-2">
                                            <span>{surah.revelation_place === 'makkah' ? 'مكية' : 'مدنية'}</span>
                                            <span className="opacity-50">·</span>
                                            <span>{`آياتها ${new Intl.NumberFormat('ar-EG').format(surah.verses_count)}`}</span>
                                        </div>
                                        <div>
                                            <span>{`ترتيبها ${new Intl.NumberFormat('ar-EG').format(surah.id)}`}</span>
                                        </div>
                                    </div>

                                    <h2 className={`font-arabic text-4xl font-bold text-primary`}>
                                        {surah.name_arabic}
                                    </h2>
                                    
                                    {surah.bismillah_pre && (
                                        <p className="font-arabic text-2xl mt-4 text-text-primary">
                                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    }
                }
                return (
                    <React.Fragment key={verse.verse_key}>
                        {surahHeader}
                        <Ayah verse={verse} />
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default QuranPage;