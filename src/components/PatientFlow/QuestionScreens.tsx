import React from 'react';
import { motion } from 'framer-motion';
import type { QuestionConfig } from '../../config/questions';
import type { Language } from '../../config/i18n';
import { i18n } from '../../config/i18n';
import { Check, ArrowLeft } from 'lucide-react';

interface QuestionProps {
    lang: Language;
    question: QuestionConfig;
    value: any;
    onChange: (val: any) => void;
    onNext: (val?: any) => void;
    onBack: () => void;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0,
    }),
};

export const ScreenWrapper = ({ children, direction = 1, onBack, showBack = true }: { children: React.ReactNode, direction?: number, onBack?: () => void, showBack?: boolean }) => {
    return (
        <div className="w-full flex-1 flex flex-col justify-center max-w-2xl mx-auto px-6 py-12">
            {showBack && onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-8 left-8 p-3 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                >
                    <ArrowLeft size={24} />
                </button>
            )}
            <motion.div
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full"
            >
                {children}
            </motion.div>
        </div>
    );
};

export const TextScreen = ({ lang, question, value, onChange, onNext }: QuestionProps) => {
    const t = i18n[lang];
    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-5xl font-medium text-brand-primary-dark">{question.title[lang]}</h2>
            <input
                type="text"
                autoFocus
                value={value || ''}
                placeholder="..."
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && value && onNext()}
                className="text-2xl border-b-2 border-gray-300 focus:border-brand-primary bg-transparent outline-none py-4 transition-colors"
            />
            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={onNext}
                    disabled={!value}
                    className="bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-xl font-medium transition-colors flex items-center gap-2"
                >
                    {t.next} <Check size={24} />
                </button>
                <span className="text-gray-400 text-sm hidden md:inline-block">Enter ↵</span>
            </div>
        </div>
    );
};

export const NumberScreen = ({ lang, question, value, onChange, onNext }: QuestionProps) => {
    const t = i18n[lang];
    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-5xl font-medium text-brand-primary-dark">{question.title[lang]}</h2>
            <input
                type="number"
                autoFocus
                value={value || ''}
                placeholder="0"
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && value && onNext()}
                className="text-3xl border-b-2 border-gray-300 focus:border-brand-primary bg-transparent outline-none py-4 transition-colors"
            />
            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={onNext}
                    disabled={!value}
                    className="bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-xl font-medium transition-colors flex items-center gap-2"
                >
                    {t.next} <Check size={24} />
                </button>
            </div>
        </div>
    );
};

export const NumberWithUnitScreen = ({ lang, question, value, onChange, onNext }: QuestionProps) => {
    const t = i18n[lang];
    const numValue = value?.value || '';
    const unitValue = value?.unit || question.unitOptions?.[0];

    const handleNumChange = (val: string) => {
        onChange({ value: val, unit: unitValue });
    };
    const handleUnitChange = (u: string) => {
        onChange({ value: numValue, unit: u });
    };

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-5xl font-medium text-brand-primary-dark">{question.title[lang]}</h2>
            <div className="flex items-center gap-4 mt-4">
                <input
                    type="number"
                    autoFocus
                    value={numValue}
                    placeholder="0"
                    onChange={(e) => handleNumChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && numValue && onNext()}
                    className="flex-1 text-3xl border-b-2 border-gray-300 focus:border-brand-primary bg-transparent outline-none py-4 transition-colors"
                />
                <div className="flex bg-gray-100 rounded-lg p-1">
                    {question.unitOptions?.map((u) => (
                        <button
                            key={u}
                            onClick={() => handleUnitChange(u)}
                            className={`px-4 py-2 rounded-md text-xl font-medium transition-colors ${unitValue === u ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500'
                                }`}
                        >
                            {u}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={onNext}
                    disabled={!numValue}
                    className="bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-xl font-medium transition-colors flex items-center gap-2"
                >
                    {t.next} <Check size={24} />
                </button>
            </div>
        </div>
    );
};

export const DateScreen = ({ lang, question, value, onChange, onNext }: QuestionProps) => {
    const t = i18n[lang];
    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-5xl font-medium text-brand-primary-dark">{question.title[lang]}</h2>
            <input
                type="date"
                autoFocus
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && value && onNext()}
                className="text-2xl border-b-2 border-gray-300 focus:border-brand-primary bg-transparent outline-none py-4 transition-colors font-sans w-full max-w-sm"
            />
            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={onNext}
                    disabled={!value}
                    className="bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-xl font-medium transition-colors flex items-center gap-2"
                >
                    {t.next} <Check size={24} />
                </button>
            </div>
        </div>
    );
};

export const SelectScreen = ({ lang, question, value, onChange, onNext }: QuestionProps) => {
    const options = question.options?.[lang] || [];
    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-5xl font-medium text-brand-primary-dark">{question.title[lang]}</h2>
            <div className="grid gap-3 mt-4">
                {options.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => {
                            onChange(opt);
                            setTimeout(() => onNext(opt), 300); // Pequeño efecto delay para feedback visual
                        }}
                        className={`flex items-center justify-between text-left w-full p-5 rounded-xl border-2 transition-all ${value === opt
                            ? 'border-brand-primary bg-blue-50 text-brand-primary'
                            : 'border-gray-200 hover:border-brand-accent hover:bg-gray-50'
                            }`}
                    >
                        <span className="text-xl">{opt}</span>
                        {value === opt && <Check className="text-brand-primary" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const YesNoScreen = ({ lang, question, value, onChange, onNext }: QuestionProps) => {
    const isYes = (v: string) => v?.toLowerCase() === 'sí' || v?.toLowerCase() === 'si' || v?.toLowerCase() === 'yes' || v?.toLowerCase() === 'oui' || v?.toLowerCase() === 'ja';
    const isNo = (v: string) => v?.toLowerCase() === 'no' || v?.toLowerCase() === 'nein' || v?.toLowerCase() === 'non';

    const yesLabel = lang === 'es' ? 'Sí' : lang === 'en' ? 'Yes' : lang === 'fr' ? 'Oui' : 'Ja';
    const noLabel = lang === 'es' ? 'No' : lang === 'en' ? 'No' : lang === 'fr' ? 'Non' : 'Nein';

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-5xl font-medium text-brand-primary-dark leading-tight">{question.title[lang]}</h2>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                    onClick={() => {
                        onChange(yesLabel); 
                        setTimeout(() => onNext(yesLabel), 200);
                    }}
                    className={`flex-1 py-6 rounded-2xl border-2 text-2xl font-medium transition-all ${isYes(value)
                        ? 'border-brand-primary bg-blue-50 text-brand-primary'
                        : 'border-gray-200 hover:border-brand-accent hover:bg-gray-50 text-gray-700'
                        }`}
                >
                    {yesLabel}
                </button>
                <button
                    onClick={() => {
                        onChange(noLabel);
                        setTimeout(() => onNext(noLabel), 200);
                    }}
                    className={`flex-1 py-6 rounded-2xl border-2 text-2xl font-medium transition-all ${isNo(value)
                        ? 'border-gray-800 bg-gray-100 text-gray-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                >
                    {noLabel}
                </button>
            </div>
        </div>
    );
};

export const SpecifyScreen = ({ lang, title, value, onChange, onNext }: { lang: Language, title: string, value: string, onChange: (v: string) => void, onNext: (v?: any) => void }) => {
    const t = i18n[lang];
    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-5xl font-medium text-brand-primary-dark mb-4">{t.specify}</h2>
            <p className="text-xl text-gray-500">{title}</p>
            <input
                type="text"
                autoFocus
                value={value || ''}
                placeholder="..."
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && value && onNext()}
                className="text-2xl border-b-2 border-gray-300 focus:border-brand-primary bg-transparent outline-none py-4 transition-colors"
            />
            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={onNext}
                    disabled={!value}
                    className="bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-xl font-medium transition-colors flex items-center gap-2"
                >
                    OK <Check size={24} />
                </button>
            </div>
        </div>
    );
};

import { useEffect, useState as useLocalState } from 'react';

export const OutroScreen = ({ lang, onRestart }: { lang: Language, onRestart: () => void }) => {
    const [countdown, setCountdown] = useLocalState(5);
    const t = i18n[lang];

    useEffect(() => {
        if (countdown <= 0) {
            onRestart();
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, onRestart]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="min-h-screen w-full bg-brand-secondary flex flex-col items-center justify-center text-center px-6 gap-8"
        >
            {/* Logo */}
            <div className="flex flex-col items-center select-none mb-2">
                <img src="/META-INTEGRA-HOMS/dr-logo.png" alt="Dr. Héctor Sánchez N." className="w-full max-w-[240px] md:max-w-[280px] h-auto object-contain drop-shadow-sm" />
            </div>

            {/* Divider */}
            <div className="w-16 h-1 rounded-full bg-brand-primary opacity-30" />

            {/* Message */}
            <div className="flex flex-col gap-4 max-w-md">
                <h1 className="text-3xl md:text-5xl font-semibold text-brand-primary-dark leading-snug">
                    {t.thank_you}
                </h1>
            </div>

            {/* Countdown badge */}
            <div className="flex flex-col items-center gap-2 mt-4">
                <div className="w-16 h-16 rounded-full border-4 border-brand-primary flex items-center justify-center">
                    <span className="text-brand-primary text-2xl font-bold">{countdown}</span>
                </div>
                <p className="text-gray-400 text-sm">{t.restart_in.replace('{{seconds}}', countdown.toString())}</p>
            </div>

            <button
                onClick={onRestart}
                className="text-gray-400 hover:text-brand-primary text-sm transition-colors underline"
            >
                {lang === 'es' ? 'Reiniciar ahora' : lang === 'en' ? 'Restart now' : lang === 'fr' ? 'Redémarrer maintenant' : 'Jetzt neu starten'}
            </button>
        </motion.div>
    );
};
