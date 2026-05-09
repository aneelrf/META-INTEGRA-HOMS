import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { questions } from '../../config/questions';
import { usePatients } from '../../store/PatientContext';
import { i18n } from '../../config/i18n';
import type { Language } from '../../config/i18n';
import {
    ScreenWrapper, TextScreen, NumberScreen, DateScreen,
    NumberWithUnitScreen, SelectScreen, YesNoScreen, SpecifyScreen, OutroScreen,
    ConsentSignatureScreen
} from './QuestionScreens';

const isYesStr = (ans: any): boolean =>
    typeof ans === 'string' && ['sí', 'si', 'yes', 'oui', 'ja'].includes(ans.toLowerCase());

/** Map any language answer to its Spanish equivalent using the options index. */
const toEsOption = (questionId: string, ans: string | undefined): string | null => {
    if (!ans) return null;
    const q = questions.find(q => q.id === questionId);
    if (!q?.options) return null;
    for (const opts of Object.values(q.options)) {
        const idx = (opts as string[]).indexOf(ans);
        if (idx !== -1) return ((q.options as Record<string, string[]>)['es'])?.[idx] ?? null;
    }
    return null;
};

const shouldSkip = (questionId: string, currentAnswers: Record<string, any>): boolean => {
    if (questionId === 'fumador_tipo' || questionId === 'fumador_frecuencia') {
        return !isYesStr(currentAnswers['fumador']);
    }
    if (questionId === 'alcohol_frecuencia') {
        return !isYesStr(currentAnswers['alcohol']);
    }
    if (questionId === 'autorizacion_firma') {
        return !isYesStr(currentAnswers['autorizacion_imagenes']);
    }
    if (questionId === 'motivacion_bariatrica') {
        return toEsOption('motivo_visita', currentAnswers['motivo_visita']) === 'Cirugía General';
    }
    if (questionId === 'motivacion_general') {
        return toEsOption('motivo_visita', currentAnswers['motivo_visita']) !== 'Cirugía General';
    }
    return false;
};

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export default function PatientFlow() {
    const { savePatient } = usePatients();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [language, setLanguage] = useState<Language>('es');
    const [answers, setAnswers] = useState<Record<string, any>>({ _language: 'es' });
    const [isSpecifying, setIsSpecifying] = useState(false);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const currentQuestion = questions[currentIndex];
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setIsLangMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const t = i18n[language];

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        setAnswers(prev => ({ ...prev, _language: lang }));
        setIsLangMenuOpen(false);
    };

    const handleNext = (overrideAns?: any) => {
        if (currentQuestion.type === 'welcome') {
            setDirection(1);
            const today = new Date().toISOString().split('T')[0];
            setAnswers(prev => ({ ...prev, fecha_evaluacion: today }));
            setCurrentIndex(prev => prev + 1);
            return;
        }

        if (currentQuestion.type === 'outro') {
            // Save data and reset
            savePatient(answers);
            setAnswers({ _language: language });
            setCurrentIndex(0);
            return;
        }

        const ans = overrideAns !== undefined && (typeof overrideAns === 'string' || typeof overrideAns === 'number' || typeof overrideAns === 'boolean') ? overrideAns : answers[currentQuestion.id];

        const isYesAnswer = (ans: any) => typeof ans === 'string' && ['sí', 'si', 'yes', 'oui', 'ja'].includes(ans.toLowerCase());
        const isSelectTrigger = (question: any, ans: any) => {
            if (question.type !== 'select' || !question.triggerSpecificationOn || !ans) return false;
            const idx = question.options?.[language]?.indexOf(ans);
            return idx !== undefined && idx !== -1 && question.options?.['es']?.[idx] === question.triggerSpecificationOn;
        };

        if (!isSpecifying) {
            if (currentQuestion.type === 'yes_no' && currentQuestion.requiresSpecification && isYesAnswer(ans)) {
                setDirection(1);
                setIsSpecifying(true);
                return;
            }
            if (isSelectTrigger(currentQuestion, ans)) {
                setDirection(1);
                setIsSpecifying(true);
                return;
            }
        }

        if (currentIndex < questions.length - 1) {
            setDirection(1);
            setIsSpecifying(false);
            const effectiveAnswers = { ...answers, [currentQuestion.id]: ans };
            let nextIndex = currentIndex + 1;
            while (nextIndex < questions.length - 1 && shouldSkip(questions[nextIndex].id, effectiveAnswers)) {
                nextIndex++;
            }
            setCurrentIndex(nextIndex);
        }
    };

    const handleBack = () => {
        if (currentIndex === 0) return;

        if (isSpecifying) {
            setDirection(-1);
            setIsSpecifying(false);
            return;
        }

        let newIndex = currentIndex - 1;
        while (newIndex > 0 && shouldSkip(questions[newIndex].id, answers)) {
            newIndex--;
        }
        const prevQ = questions[newIndex];
        if (!prevQ) return;

        const prevAns = answers[prevQ.id];
        setDirection(-1);
        setCurrentIndex(newIndex);

        const isYesAnswer = (ans: any) => typeof ans === 'string' && ['sí', 'si', 'yes', 'oui', 'ja'].includes(ans.toLowerCase());
        const isSelectTrigger = (question: any, ans: any) => {
            if (question.type !== 'select' || !question.triggerSpecificationOn || !ans) return false;
            const idx = question.options?.[language]?.indexOf(ans);
            return idx !== undefined && idx !== -1 && question.options?.['es']?.[idx] === question.triggerSpecificationOn;
        };

        if ((prevQ.type === 'yes_no' && prevQ.requiresSpecification && isYesAnswer(prevAns)) ||
            isSelectTrigger(prevQ, prevAns)) {
            setIsSpecifying(true);
        } else {
            setIsSpecifying(false);
        }
    };

    const handleAnswer = (val: any) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
    };

    const handleSpecifyAnswer = (val: string) => {
        setAnswers(prev => ({ ...prev, [`${currentQuestion.id}_spec`]: val }));
    };

    const renderScreen = () => {
        if (currentQuestion.type === 'welcome') {
            return (
                <ScreenWrapper key="welcome" direction={direction} showBack={false}>
                    <div className="text-center flex flex-col items-center gap-6 max-w-xl mx-auto py-4">
                        <div className="flex flex-col items-center select-none mb-6">
                            <img src="/META-INTEGRA-HOMS/logo-homs.svg" alt="Dr. Héctor Sánchez N." className="w-full max-w-[280px] md:max-w-[340px] h-auto object-contain drop-shadow-sm" />
                            <p className="text-brand-primary font-semibold tracking-wide mt-2 text-base">Cirugía de Precisión</p>
                        </div>

                        <h2 className="text-2xl md:text-3xl text-gray-900 font-bold mb-4 leading-snug">
                            {language === 'es' ? 'Bienvenido(a) a META Integra' : language === 'en' ? 'Welcome to META Integra' : language === 'fr' ? 'Bienvenue à META Integra' : 'Willkommen bei META Integra'}<br />
                            <span className="font-extrabold">{currentQuestion.subtitle?.[language]}</span>
                        </h2>

                        <p className="text-gray-600 md:text-lg leading-relaxed px-4">
                            {language === 'es' 
                                ? 'Por favor, complete todos los campos de manera precisa siguiendo el profesionalismo que nos caracteriza. Su información será tratada confidencialmente.'
                                : language === 'en'
                                ? 'Please complete all fields accurately following our trademark professionalism. Your information will be treated confidentially.'
                                : language === 'fr'
                                ? 'Veuillez remplir tous les champs avec précision en suivant le professionnalisme qui nous caractérise. Vos informations seront traitées en toute confidentialité.'
                                : 'Bitte füllen Sie alle Felder genau aus und folgen Sie dabei der Professionalität, die uns auszeichnet. Ihre Informationen werden vertraulich behandelt.'}
                        </p>

                        <p className="text-gray-600 md:text-lg mt-4 mb-8">
                            {language === 'es' ? 'Gracias por su colaboración.' : language === 'en' ? 'Thank you for your collaboration.' : language === 'fr' ? 'Merci pour votre collaboration.' : 'Vielen Dank für Ihre Mitarbeit.'}
                        </p>

                        <button
                            onClick={() => handleNext()}
                            className="w-full mt-8 bg-[#0A1C40] hover:bg-[#050F26] text-white py-4 rounded-xl text-xl font-bold transition-all shadow-md active:scale-[0.98]"
                        >
                            {language === 'es' ? 'Comenzar' : language === 'en' ? 'Start' : language === 'fr' ? 'Commencer' : 'Starten'}
                        </button>
                    </div>
                </ScreenWrapper>
            );
        }

        if (currentQuestion.type === 'outro') {
            return (
                <OutroScreen lang={language} onRestart={() => handleNext()} />
            );
        }

        if (isSpecifying) {
            const specVal = answers[`${currentQuestion.id}_spec`] || '';
            const specTitle = currentQuestion.title[language as keyof typeof currentQuestion.title] || currentQuestion.title['es' as keyof typeof currentQuestion.title];
            return (
                <ScreenWrapper key={`${currentQuestion.id}-spec`} direction={direction} onBack={handleBack}>
                    <SpecifyScreen
                        lang={language}
                        title={typeof specTitle === 'string' ? specTitle : (specTitle as any)}
                        value={specVal}
                        onChange={handleSpecifyAnswer}
                        onNext={() => handleNext()}
                    />
                </ScreenWrapper>
            );
        }
        if (currentQuestion.type === 'consent_signature') {
            const catStr = currentQuestion.category as keyof typeof t.categories;
            return (
                <ScreenWrapper key={currentQuestion.id} direction={direction} onBack={handleBack} showBack={currentIndex > 0}>
                    <div className="mb-4 text-sm font-bold text-brand-primary/60 tracking-widest uppercase">
                        {t.categories[catStr] || currentQuestion.category}
                    </div>
                    <ConsentSignatureScreen
                        lang={language}
                        answers={answers}
                        value={answers[currentQuestion.id]}
                        onChange={handleAnswer}
                        onNext={() => handleNext()}
                    />
                </ScreenWrapper>
            );
        }

        const screenMap = {
            text: TextScreen,
            number: NumberScreen,
            date: DateScreen,
            number_with_unit: NumberWithUnitScreen,
            select: SelectScreen,
            yes_no: YesNoScreen,
        };
        const ScreenComponent = screenMap[currentQuestion.type as keyof typeof screenMap];

        if (!ScreenComponent) return null;

        const catStr = currentQuestion.category as keyof typeof t.categories;
        const categoryLabel = t.categories[catStr] || currentQuestion.category;

        return (
            <ScreenWrapper key={currentQuestion.id} direction={direction} onBack={handleBack} showBack={currentIndex > 0}>
                <div className="mb-4 text-sm font-bold text-brand-primary/60 tracking-widest uppercase">
                    {categoryLabel as string}
                </div>
                <ScreenComponent
                    lang={language}
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={handleAnswer}
                    onNext={(val) => handleNext(val)}
                    onBack={handleBack}
                />
            </ScreenWrapper>
        );
    };

    const currentLang = LANGUAGES.find(l => l.code === language)!;

    return (
        <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center overflow-hidden relative">
            {/* Language Switcher */}
            <div className="absolute top-4 right-4 z-50 text-brand-primary" ref={langMenuRef}>
                <button 
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-brand-primary/20 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all"
                >
                    <Globe size={18} />
                    <span className="font-medium text-sm hidden sm:block">{currentLang.label}</span>
                    <span className="sm:hidden">{currentLang.flag}</span>
                    <ChevronDown size={16} className={`transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {isLangMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-[140px]"
                        >
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-brand-primary/5 transition-colors ${
                                        language === lang.code ? 'bg-brand-primary/5 font-bold text-brand-primary' : 'text-gray-600'
                                    }`}
                                    type="button"
                                >
                                    <span className="text-xl">{lang.flag}</span>
                                    <span className="text-sm">{lang.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ProgressBar */}
            {currentIndex > 0 && currentIndex < questions.length - 1 && (
                <div className="absolute top-0 left-0 w-full h-2 bg-gray-200">
                    <div
                        className="h-full bg-brand-primary transition-all duration-500 ease-out"
                        style={{ width: `${(currentIndex / (questions.length - 2)) * 100}%` }}
                    />
                </div>
            )}
            <AnimatePresence mode="wait" custom={direction}>
                {renderScreen()}
            </AnimatePresence>
        </div>
    );
}
