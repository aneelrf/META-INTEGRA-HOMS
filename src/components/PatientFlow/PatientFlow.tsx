import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { questions } from '../../config/questions';
import { usePatients } from '../../store/PatientContext';
import {
    ScreenWrapper, TextScreen, NumberScreen, DateScreen,
    NumberWithUnitScreen, SelectScreen, YesNoScreen, SpecifyScreen, OutroScreen
} from './QuestionScreens';

export default function PatientFlow() {
    const { savePatient } = usePatients();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSpecifying, setIsSpecifying] = useState(false);
    const currentQuestion = questions[currentIndex];

    const handleNext = (overrideAns?: any) => {
        if (currentQuestion.type === 'welcome') {
            setDirection(1);
            setCurrentIndex(prev => prev + 1);
            return;
        }

        if (currentQuestion.type === 'outro') {
            // Save data and reset
            savePatient(answers);
            setAnswers({});
            setCurrentIndex(0);
            return;
        }

        const ans = overrideAns !== undefined && (typeof overrideAns === 'string' || typeof overrideAns === 'number' || typeof overrideAns === 'boolean') ? overrideAns : answers[currentQuestion.id];

        if (!isSpecifying) {
            if (currentQuestion.type === 'yes_no' && currentQuestion.requiresSpecification && ans?.toLowerCase() === 'sí') {
                setDirection(1);
                setIsSpecifying(true);
                return;
            }
            if (currentQuestion.type === 'select' && currentQuestion.triggerSpecificationOn && ans === currentQuestion.triggerSpecificationOn) {
                setDirection(1);
                setIsSpecifying(true);
                return;
            }
        }

        if (currentIndex < questions.length - 1) {
            setDirection(1);
            setIsSpecifying(false);
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentIndex === 0) return;

        if (isSpecifying) {
            setDirection(-1);
            setIsSpecifying(false);
            return;
        }

        const newIndex = currentIndex - 1;
        const prevQ = questions[newIndex];
        if (!prevQ) return;

        const prevAns = answers[prevQ.id];
        setDirection(-1);
        setCurrentIndex(newIndex);

        if ((prevQ.type === 'yes_no' && prevQ.requiresSpecification && prevAns?.toLowerCase() === 'sí') ||
            (prevQ.type === 'select' && prevQ.triggerSpecificationOn && prevAns === prevQ.triggerSpecificationOn)) {
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
                        <div className="flex flex-col items-start select-none mb-6">
                            <span className="text-brand-primary font-bold text-2xl md:text-4xl tracking-widest uppercase -mb-4 md:-mb-5 z-10 bg-brand-secondary px-1">META</span>
                            <span className="text-brand-primary font-serif font-bold text-7xl md:text-9xl tracking-tight leading-none">Integra</span>
                            <span className="text-brand-primary font-bold text-sm md:text-lg tracking-[0.2em] uppercase mt-2">INSTITUTO BARIÁTRICO</span>
                        </div>

                        <h2 className="text-2xl md:text-3xl text-gray-800 font-medium mb-4 leading-snug">
                            Bienvenido(a) a META Integra<br />INSTITUTO BARIÁTRICO
                        </h2>

                        <p className="text-gray-600 md:text-lg leading-relaxed px-4">
                            Por favor, complete todos los campos de manera precisa siguiendo el profesionalismo que nos caracteriza. Su información será tratada confidencialmente.
                        </p>

                        <p className="text-gray-600 md:text-lg mt-4 mb-8">
                            Gracias por su colaboración.
                        </p>

                        <button
                            onClick={() => handleNext()}
                            className="w-full mt-auto bg-[#0b38a8] hover:bg-[#082a80] text-white py-4 rounded-lg text-xl font-bold transition-all"
                        >
                            Comenzar
                        </button>
                    </div>
                </ScreenWrapper>
            );
        }

        if (currentQuestion.type === 'outro') {
            return (
                <OutroScreen onRestart={() => handleNext()} />
            );
        }

        if (isSpecifying) {
            const specVal = answers[`${currentQuestion.id}_spec`] || '';
            return (
                <ScreenWrapper key={`${currentQuestion.id}-spec`} direction={direction} onBack={handleBack}>
                    <SpecifyScreen
                        title={currentQuestion.title}
                        value={specVal}
                        onChange={handleSpecifyAnswer}
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

        return (
            <ScreenWrapper key={currentQuestion.id} direction={direction} onBack={handleBack} showBack={currentIndex > 0}>
                <div className="mb-4 text-sm font-semibold text-brand-accent tracking-wider uppercase">
                    {currentQuestion.category}
                </div>
                <ScreenComponent
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={handleAnswer}
                    onNext={(val) => handleNext(val)}
                    onBack={handleBack}
                />
            </ScreenWrapper>
        );
    };

    return (
        <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center overflow-hidden relative">
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
