import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

export interface SurveyFormData {
    motivoVisitaEncuesta: string;
    facilidadCita: number;
    amabilidadPersonal: number;
    tratoMedico: number;
    comodidadEspera: number;
    informacionOrientacion: number;
    puntualidad: number;
    publicidadInstitucional: number;
    experienciaGeneral: number;
    recomendaria: string;
    calificacionGeneral: string;
}

interface SurveyScreenProps {
    onSubmit: (data: SurveyFormData) => Promise<void>;
    onSkip: () => void;
}

const SCALE_LABELS: Record<number, string> = {
    1: 'Muy insatisfecho',
    2: 'Insatisfecho',
    3: 'Neutral',
    4: 'Satisfecho',
    5: 'Muy satisfecho',
};

function ScaleSelector({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
    return (
        <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    title={SCALE_LABELS[n]}
                    className={`w-11 h-11 rounded-full font-bold text-sm border-2 transition-all active:scale-95 ${
                        value === n
                            ? 'bg-brand-primary border-brand-primary text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-brand-primary/50'
                    }`}
                >
                    {n}
                </button>
            ))}
            {value && (
                <span className="self-center text-xs text-gray-400 ml-1">{SCALE_LABELS[value]}</span>
            )}
        </div>
    );
}

function PillSelector({ options, value, onChange }: { options: string[]; value: string | null; onChange: (v: string) => void }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all active:scale-95 ${
                        value === opt
                            ? 'bg-brand-primary border-brand-primary text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-brand-primary/50'
                    }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

const SCALE_QUESTIONS: { key: keyof SurveyFormData; label: string }[] = [
    { key: 'facilidadCita',            label: '¿Con qué facilidad pudo obtener una cita?' },
    { key: 'amabilidadPersonal',       label: '¿Cómo califica la amabilidad del personal al recibirlo?' },
    { key: 'tratoMedico',              label: '¿Cómo califica el trato recibido por el personal médico?' },
    { key: 'comodidadEspera',          label: '¿Cómo califica la comodidad de nuestras áreas de espera?' },
    { key: 'informacionOrientacion',   label: '¿Cómo califica la información y orientación recibida durante su visita?' },
    { key: 'puntualidad',              label: '¿Cómo califica la puntualidad en la atención recibida?' },
    { key: 'publicidadInstitucional',  label: '¿Cómo califica la publicidad e información institucional de Meta Integra?' },
    { key: 'experienciaGeneral',       label: '¿Cómo califica su experiencia general en Meta Integra?' },
];

export default function SurveyScreen({ onSubmit, onSkip }: SurveyScreenProps) {
    const [form, setForm] = useState<Partial<SurveyFormData>>({});
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempted, setAttempted] = useState(false);

    const setField = <K extends keyof SurveyFormData>(key: K, val: SurveyFormData[K]) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const canSubmit =
        form.motivoVisitaEncuesta &&
        SCALE_QUESTIONS.every(q => form[q.key] != null) &&
        form.recomendaria &&
        form.calificacionGeneral;

    const isMissing = (key: keyof SurveyFormData) => attempted && form[key] == null;
    const isMissingPill = (key: keyof SurveyFormData) => attempted && !form[key];

    const handleSubmit = async () => {
        setAttempted(true);
        if (!canSubmit) return;
        setSaving(true);
        setError(null);
        try {
            await onSubmit(form as SurveyFormData);
            setSubmitted(true);
        } catch (err) {
            console.error('[SurveyScreen] Error al enviar encuesta:', err);
            setError('Ocurrió un error al enviar la encuesta. Por favor intente de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
        >
            <AnimatePresence mode="wait">
                {submitted ? (
                    <motion.div
                        key="thanks"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center flex flex-col items-center gap-6 m-4"
                    >
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Check size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">¡Gracias por su opinión!</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Sus respuestas nos ayudan a mejorar continuamente nuestros servicios.
                        </p>
                        <button
                            onClick={onSkip}
                            className="mt-2 bg-brand-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-primary-dark transition-all"
                        >
                            Finalizar
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="bg-[#f4f7fb] w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-white px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4 flex-shrink-0">
                            <div>
                                <img src="/META-INTEGRA-HOMS/logo-homs.svg" alt="META Integra" className="h-7 object-contain mb-2" />
                                <h2 className="text-lg font-bold text-gray-900">Encuesta de Satisfacción</h2>
                            </div>
                            <button
                                onClick={onSkip}
                                className="text-gray-400 hover:text-gray-600 transition-colors mt-1 flex-shrink-0 p-1"
                                aria-label="Omitir encuesta"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6 space-y-5">
                            {/* Intro */}
                            <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-5">
                                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                    Su opinión es muy importante para nosotros. Esta encuesta es confidencial y nos ayudará a mejorar continuamente nuestros servicios. Por favor, marque la opción que mejor represente su nivel de satisfacción.
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                    Escala del 1 al 5 &nbsp;·&nbsp; <strong>1</strong> = Muy insatisfecho &nbsp;·&nbsp; <strong>5</strong> = Muy satisfecho
                                </p>
                            </div>

                            {/* Motivo de visita */}
                            <div className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-colors ${isMissingPill('motivoVisitaEncuesta') ? 'border-red-300' : 'border-gray-100'}`}>
                                <p className="text-sm font-semibold text-gray-800 mb-3">
                                    Motivo de visita
                                    {isMissingPill('motivoVisitaEncuesta') && <span className="text-red-500 text-xs font-normal ml-2">— requerido</span>}
                                </p>
                                <PillSelector
                                    options={['Cirugía general', 'Cirugía bariátrica', 'Servicios Meta Integra', 'Otros']}
                                    value={form.motivoVisitaEncuesta ?? null}
                                    onChange={v => setField('motivoVisitaEncuesta', v)}
                                />
                            </div>

                            {/* Scale questions */}
                            {SCALE_QUESTIONS.map(({ key, label }) => (
                                <div key={key} className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-colors ${isMissing(key) ? 'border-red-300' : 'border-gray-100'}`}>
                                    <p className="text-sm font-semibold text-gray-800 mb-3">
                                        {label}
                                        {isMissing(key) && <span className="text-red-500 text-xs font-normal ml-2">— requerido</span>}
                                    </p>
                                    <ScaleSelector
                                        value={(form[key] as number) ?? null}
                                        onChange={v => setField(key, v as any)}
                                    />
                                </div>
                            ))}

                            {/* Recommendation */}
                            <div className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-colors ${isMissingPill('recomendaria') ? 'border-red-300' : 'border-gray-100'}`}>
                                <p className="text-sm font-semibold text-gray-800 mb-3">
                                    ¿Recomendaría asistir a Meta Integra a familiares o amigos?
                                    {isMissingPill('recomendaria') && <span className="text-red-500 text-xs font-normal ml-2">— requerido</span>}
                                </p>
                                <PillSelector
                                    options={['Sí', 'No', 'Tal vez']}
                                    value={form.recomendaria ?? null}
                                    onChange={v => setField('recomendaria', v)}
                                />
                            </div>

                            {/* General rating */}
                            <div className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-colors ${isMissingPill('calificacionGeneral') ? 'border-red-300' : 'border-gray-100'}`}>
                                <p className="text-sm font-semibold text-gray-800 mb-3">
                                    ¿Cómo calificaría su experiencia general?
                                    {isMissingPill('calificacionGeneral') && <span className="text-red-500 text-xs font-normal ml-2">— requerido</span>}
                                </p>
                                <PillSelector
                                    options={['Excelente', 'Buena', 'Regular', 'Mala']}
                                    value={form.calificacionGeneral ?? null}
                                    onChange={v => setField('calificacionGeneral', v)}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 pt-2 pb-4">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                                        {error}
                                    </div>
                                )}
                                {attempted && !canSubmit && !error && (
                                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
                                        Por favor complete todos los campos marcados en rojo antes de enviar.
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="flex-1 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <><Check size={18} /> Enviar encuesta</>
                                        )}
                                    </button>
                                    <button
                                        onClick={onSkip}
                                        className="sm:flex-none bg-white hover:bg-gray-50 text-gray-500 py-3.5 px-6 rounded-xl font-medium border border-gray-200 transition-all"
                                    >
                                        Omitir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
