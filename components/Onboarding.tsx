import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';

interface Step {
    icon: string;
    title: string;
    description: string;
}

const steps: Step[] = [
    {
        icon: 'fa-quran',
        title: 'أهلاً بك في بصائر',
        description: 'رفيقك الرقمي لتدبر وفهم القرآن الكريم. دعنا نأخذك في جولة سريعة لاكتشاف أهم الميزات.'
    },
    {
        icon: 'fa-hand-pointer',
        title: 'تفاعل مع كل كلمة',
        description: 'اضغط على أي كلمة في الآية للاستماع إليها بشكل منفصل ورؤية ترجمتها الفورية. اضغط على رقم الآية لفتح قائمة خيارات متكاملة.'
    },
    {
        icon: 'fa-brain',
        title: 'وضع التحفيظ الذكي',
        description: 'اختبر حفظك بالصوت! التطبيق يستمع لتلاوتك ويظهر الكلمات التي تتلوها بشكل تفاعلي لمساعدتك على المراجعة والتثبيت.'
    },
    {
        icon: 'fa-robot',
        title: 'المساعد الذكي "عبد الحكيم"',
        description: 'اسأله عن تفسير آية، سبب نزول سورة، أو حتى اطلب منه الانتقال لصفحة معينة. مساعدك الشخصي في رحلتك القرآنية.'
    },
    {
        icon: 'fa-tachometer-alt',
        title: 'لوحة التحكم والقائمة',
        description: 'ابدأ يومك من "الرئيسية" لمتابعة تقدمك، واستكشف "القائمة" للوصول إلى جميع أدوات التطبيق مثل الختمات، الأدعية، والإحصائيات.'
    }
];

const Onboarding: React.FC = () => {
    const { actions } = useApp();
    const [currentStep, setCurrentStep] = useState(0);

    const finishOnboarding = () => {
        actions.setState(s => ({ ...s, isFirstLaunch: false, activePanel: null }));
        localStorage.setItem('hasLaunched', 'true');
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            finishOnboarding();
        }
    };
    
    const { icon, title, description } = steps[currentStep];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-bg-primary rounded-2xl w-full max-w-sm shadow-xl text-center p-8 flex flex-col items-center animate-scaleIn">
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <i className={`fas ${icon} text-primary text-4xl`}></i>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-text-primary">{title}</h2>
                <p className="text-text-secondary mb-8">{description}</p>
                
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((_, index) => (
                        <div key={index} className={`w-2 h-2 rounded-full transition-colors ${index === currentStep ? 'bg-primary' : 'bg-bg-tertiary'}`}></div>
                    ))}
                </div>

                <button onClick={nextStep} className="btn-primary w-full mb-2">
                    {currentStep === steps.length - 1 ? 'ابدأ الآن!' : 'التالي'}
                </button>
                <button onClick={finishOnboarding} className="text-sm text-text-secondary hover:text-primary">
                    تخطي
                </button>
            </div>
        </div>
    );
};

export default Onboarding;