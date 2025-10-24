import React from 'react';
import { useApp } from '../hooks/useApp';
import QuranPage from './QuranPage';

const DesktopBookLayout: React.FC = () => {
    const { state } = useApp();
    const { pageData } = state;

    return (
        <div className="desktop-book-container" data-main-bg>
            <div className="book-spread">
                {/* Right-hand page of the book (EVEN page number) */}
                <div className="page page-on-right">
                    {pageData?.right ? <QuranPage pageVerses={pageData.right} /> : <div className="page-cover" />}
                </div>
                
                {/* Left-hand page of the book (ODD page number) */}
                <div className="page page-on-left">
                    {pageData?.left ? <QuranPage pageVerses={pageData.left} /> : <div className="page-cover" />}
                </div>
            </div>
        </div>
    );
};

export default DesktopBookLayout;
