import { useState, useEffect, useMemo } from 'react';
import { auth } from '../../../firebase';
import { questions } from '../../../config/questions';
import type { Language } from '../../../config/i18n';
import { calcPesoKg, calcIMC, MEDICAL_FIELDS, TIPO_SHORT } from '../../../services/patientsService';
import { saveClinicalNote, type PatientVisit } from '../../../services/patientServiceV2';
import {
    subscribeInterconsultasByVisit, addInterconsulta, deleteInterconsulta,
    updateInterconsulta, type Interconsulta,
} from '../../../services/interconsultasService';
import { subscribeActiveDoctors, type UserProfile } from '../../../services/usersService';
import {
    ChevronLeft, NotebookPen, Stethoscope, FileText,
    Plus, Save, CheckCircle2, Trash2, X, AlertCircle, Clock,
    User, ChevronDown, ChevronUp,
} from 'lucide-react';

const lang: Language = 'es';

const TIPO_BADGE: Record<string, { bg: string; text: string }> = {
    'Primera vez':                    { bg: 'bg-medical-blue/10',  text: 'text-medical-blue' },
    'Seguimiento 1er mes quirúrgico': { bg: 'bg-purple-100 dark:bg-purple-950/40',  text: 'text-purple-700 dark:text-purple-400' },
    'Seguimiento 2do mes quirúrgico': { bg: 'bg-indigo-100 dark:bg-indigo-950/40',  text: 'text-indigo-700 dark:text-indigo-400' },
    'Seguimiento 4to mes quirúrgico': { bg: 'bg-violet-100 dark:bg-violet-950/40',  text: 'text-violet-700 dark:text-violet-400' },
    'Seguimiento 1 año quirúrgico':   { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400' },
    'Entrega de resultados':          { bg: 'bg-amber-100 dark:bg-amber-950/40',    text: 'text-amber-700 dark:text-amber-400' },
};

const ESPECIALIDADES = [
    'Cardiología', 'Endocrinología', 'Gastroenterología', 'Neurología',
    'Dermatología', 'Ortopedia y Traumatología', 'Psicología', 'Psiquiatría',
    'Nutrición y Dietética', 'Fisioterapia', 'Oncología', 'Nefrología',
    'Neumología', 'Urología', 'Ginecología', 'Oftalmología',
    'Otorrinolaringología', 'Reumatología', 'Hematología', 'Infectología', 'Otro',
];

const ESTADO_STYLE: Record<Interconsulta['estado'], string> = {
    pendiente:  'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
    en_proceso: 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    completada: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    cancelada:  'bg-red-100 dark:bg-red-950/30 text-red-500 dark:text-red-400',
    rechazada:  'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400',
};

const PRIORITY_STYLE: Record<Interconsulta['priority'], string> = {
    normal: 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400',
    alta:   'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
    urgente:'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400',
};

const ESTADO_LABELS: Record<Interconsulta['estado'], string> = {
    pendiente:  'Pendiente',
    en_proceso: 'En proceso',
    completada: 'Completada',
    cancelada:  'Cancelada',
    rechazada:  'Rechazada',
};

interface Props {
    visit: PatientVisit;
    patientId: string;
    onBack: () => void;
}

function CardHeader({ icon: Icon, iconBg, iconColor, title, badge, action }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconBg: string; iconColor: string; title: string;
    badge?: number | null; action?: React.ReactNode;
}) {
    return (
        <div className="px-4 py-3 border-b border-bd flex items-center gap-2 flex-shrink-0">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon size={13} className={iconColor} />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-slate-200 flex-1">{title}</span>
            {badge != null && badge > 0 && (
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-bd px-1.5 py-0.5 rounded-full">{badge}</span>
            )}
            {action}
        </div>
    );
}

// ─── Interconsulta response form (inline) ────────────────────────────────────
function ResponseForm({ ic, onClose }: { ic: Interconsulta; onClose: () => void }) {
    const [form, setForm] = useState({
        responseEvaluation:      ic.responseEvaluation      ?? '',
        responseDiagnosis:       ic.responseDiagnosis       ?? '',
        responseRecommendations: ic.responseRecommendations ?? '',
        responseConduct:         ic.responseConduct         ?? '',
        responseObservations:    ic.responseObservations    ?? '',
    });
    const [saving, setSaving] = useState(false);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const saveAsDraft = async () => {
        setSaving(true);
        await updateInterconsulta(ic.id, {
            ...form,
            estado: 'en_proceso',
            startedAt: ic.startedAt ?? new Date().toISOString(),
        });
        setSaving(false);
        onClose();
    };

    const finalize = async () => {
        if (!form.responseEvaluation.trim()) return;
        setSaving(true);
        await updateInterconsulta(ic.id, {
            ...form,
            estado: 'completada',
            startedAt: ic.startedAt ?? new Date().toISOString(),
            completedAt: new Date().toISOString(),
        });
        setSaving(false);
        onClose();
    };

    const fields: { key: keyof typeof form; label: string; placeholder: string }[] = [
        { key: 'responseEvaluation',      label: 'Evaluación clínica *',     placeholder: 'Descripción de la evaluación realizada...' },
        { key: 'responseDiagnosis',       label: 'Impresión diagnóstica',     placeholder: 'Diagnóstico o impresión clínica...' },
        { key: 'responseRecommendations', label: 'Recomendaciones',           placeholder: 'Recomendaciones al médico solicitante...' },
        { key: 'responseConduct',         label: 'Conducta médica',           placeholder: 'Plan o conducta a seguir...' },
        { key: 'responseObservations',    label: 'Observaciones',             placeholder: 'Observaciones adicionales...' },
    ];

    return (
        <div className="mt-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Nota de interconsulta
                </span>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                    <X size={13} />
                </button>
            </div>
            {fields.map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">{label}</label>
                    <textarea
                        value={form[key]}
                        onChange={set(key)}
                        placeholder={placeholder}
                        rows={2}
                        className="field resize-none text-xs"
                    />
                </div>
            ))}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={saveAsDraft}
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border border-bd hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                >
                    Guardar borrador
                </button>
                <button
                    onClick={finalize}
                    disabled={saving || !form.responseEvaluation.trim()}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : 'Finalizar interconsulta'}
                </button>
            </div>
        </div>
    );
}

// ─── Response read-only view ──────────────────────────────────────────────────
function ResponseView({ ic }: { ic: Interconsulta }) {
    const [expanded, setExpanded] = useState(false);
    const fields: { key: keyof Interconsulta; label: string }[] = [
        { key: 'responseEvaluation',      label: 'Evaluación clínica' },
        { key: 'responseDiagnosis',       label: 'Impresión diagnóstica' },
        { key: 'responseRecommendations', label: 'Recomendaciones' },
        { key: 'responseConduct',         label: 'Conducta médica' },
        { key: 'responseObservations',    label: 'Observaciones' },
    ];
    const hasContent = fields.some(f => ic[f.key]);
    if (!hasContent) return null;
    return (
        <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl overflow-hidden">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 transition-colors"
            >
                <span>Respuesta del especialista</span>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {expanded && (
                <div className="px-3 pb-3 space-y-2">
                    {fields.filter(f => ic[f.key]).map(({ key, label }) => (
                        <div key={key}>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
                            <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">{String(ic[key])}</p>
                        </div>
                    ))}
                    {ic.completedAt && (
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 pt-1">
                            Respondida el {new Date(ic.completedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConsultaDetailView({ visit, patientId, onBack }: Props) {
    const currentUid  = auth.currentUser?.uid ?? '';
    const currentName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Doctor';

    const [note,        setNote]        = useState(visit.clinicalNote ?? '');
    const [noteSaving,  setNoteSaving]  = useState(false);
    const [noteSaved,   setNoteSaved]   = useState(false);
    const [interconsultas, setInterconsultas] = useState<Interconsulta[]>([]);
    const [doctors,      setDoctors]    = useState<UserProfile[]>([]);
    const [showForm,     setShowForm]   = useState(false);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [interForm, setInterForm] = useState({
        assignedDoctorId:   '',
        assignedDoctorName: '',
        especialidad:       ESPECIALIDADES[0],
        motivo:             '',
        clinicalSummary:    '',
        priority:           'normal' as Interconsulta['priority'],
    });
    const [interSaving, setInterSaving] = useState(false);
    const [sentOk,      setSentOk]      = useState(false);

    useEffect(() => { setNote(visit.clinicalNote ?? ''); }, [visit.id]);

    useEffect(
        () => subscribeInterconsultasByVisit(visit.id, setInterconsultas),
        [visit.id],
    );

    useEffect(() => subscribeActiveDoctors(setDoctors), []);

    const formAnswers = useMemo(() =>
        questions
            .filter(q => q.type !== 'welcome' && q.type !== 'outro' && q.type !== 'consent_signature')
            .map(q => ({
                id: q.id,
                title: q.title[lang] || q.title['es'],
                answer: visit.answers[q.id],
                spec: visit.answers[`${q.id}_spec`],
            }))
            .filter(d => d.answer !== undefined),
        [visit.id],
    );

    const kg        = calcPesoKg(visit.answers['peso']);
    const imc       = calcIMC(visit.answers['peso'], visit.answers['estatura']);
    const tipo      = visit.visitType;
    const tipoBadge = tipo ? (TIPO_BADGE[tipo] ?? { bg: 'bg-gray-100 dark:bg-slate-800', text: 'text-gray-500 dark:text-slate-400' }) : null;

    const saveNote = async () => {
        if (!auth.currentUser) return;
        setNoteSaving(true);
        try {
            await saveClinicalNote(visit.id, note, auth.currentUser.uid);
            setNoteSaved(true);
            setTimeout(() => setNoteSaved(false), 2500);
        } finally {
            setNoteSaving(false);
        }
    };

    const handleDoctorSelect = (uid: string) => {
        const doc = doctors.find(d => d.id === uid);
        setInterForm(f => ({
            ...f,
            assignedDoctorId:   uid,
            assignedDoctorName: doc?.nombre ?? '',
            especialidad:       doc?.especialidad || f.especialidad,
        }));
    };

    const addReferral = async () => {
        if (!interForm.assignedDoctorId || !interForm.motivo.trim()) return;
        setInterSaving(true);
        try {
            const now = new Date().toISOString();
            await addInterconsulta({
                patientId,
                visitId:             visit.id,
                requestingDoctorId:  currentUid,
                requestingDoctorName: currentName,
                assignedDoctorId:    interForm.assignedDoctorId,
                assignedDoctorName:  interForm.assignedDoctorName,
                especialidad:        interForm.especialidad,
                motivo:              interForm.motivo,
                clinicalSummary:     interForm.clinicalSummary,
                priority:            interForm.priority,
                estado:              'pendiente',
                responseEvaluation:      '',
                responseDiagnosis:       '',
                responseRecommendations: '',
                responseConduct:         '',
                responseObservations:    '',
                requestedAt: now,
                createdAt:   now,
                createdBy:   currentUid,
            });
            setInterForm({
                assignedDoctorId: '', assignedDoctorName: '',
                especialidad: ESPECIALIDADES[0],
                motivo: '', clinicalSummary: '',
                priority: 'normal',
            });
            setShowForm(false);
            setSentOk(true);
            setTimeout(() => setSentOk(false), 4000);
        } finally {
            setInterSaving(false);
        }
    };

    const pendingCount = interconsultas.filter(
        ic => ic.estado === 'pendiente' || ic.estado === 'en_proceso',
    ).length;

    return (
        <div className="flex-1 flex flex-col overflow-hidden">

            {/* Breadcrumb */}
            <div className="flex-shrink-0 px-4 md:px-5 py-3 border-b border-bd bg-card flex items-center gap-3 flex-wrap">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-slate-500 hover:text-medical-blue transition-colors"
                >
                    <ChevronLeft size={14} /> Consultas
                </button>
                <span className="text-gray-300 dark:text-slate-600">/</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                    {new Date(visit.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                {tipoBadge && tipo && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${tipoBadge.bg} ${tipoBadge.text}`}>
                        {TIPO_SHORT[tipo] ?? tipo}
                    </span>
                )}
            </div>

            {/* Layout: Formulario top, Notas + Interconsultas below */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">

                {/* ── Card 1: Formulario (full width) ── */}
                <div className="bg-card rounded-2xl border border-bd flex flex-col overflow-hidden">
                    <CardHeader
                        icon={FileText} iconBg="bg-brand-primary/10" iconColor="text-brand-primary"
                        title="Formulario del paciente"
                    />
                    <div className="p-4 space-y-3">
                        {(kg != null || imc != null) && (
                            <div className="flex gap-6 px-1">
                                {kg  != null && (
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-gray-900 dark:text-slate-100 leading-none">{kg.toFixed(1)}</span>
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">kg</span>
                                    </div>
                                )}
                                {imc != null && (
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-medical-blue leading-none">{imc.toFixed(1)}</span>
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">IMC</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {formAnswers.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">Sin respuestas disponibles</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                {formAnswers.map(({ id, title, answer, spec }) => {
                                    const raw = typeof answer === 'object' && answer !== null
                                        ? `${(answer as { value: string }).value} ${(answer as { unit: string }).unit}`
                                        : String(answer);
                                    const display = raw.replace('Cirugía Oncológica', 'Oncológica');
                                    const isMedical = MEDICAL_FIELDS.some(f => f.id === id);
                                    const isYes = isMedical && ['sí', 'si', 'yes'].includes(String(answer).toLowerCase());
                                    return (
                                        <div key={id} className={`p-3 rounded-xl flex flex-col gap-0.5 ${isYes ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30' : 'bg-surface'}`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isYes ? 'text-amber-600 dark:text-amber-500' : 'text-gray-400 dark:text-slate-500'}`}>{title}</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 capitalize">{display || '—'}</span>
                                            {spec && (
                                                <div className="mt-1 p-2 rounded-lg text-[11px] font-medium bg-bd text-gray-700 dark:text-slate-300">
                                                    <span className="block text-[9px] uppercase tracking-wider opacity-60 mb-0.5">Detalles:</span>
                                                    {spec as string}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Cards 2 & 3: Notas + Interconsultas side by side ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* ── Card 2: Notas clínicas ── */}
                    <div className="bg-card rounded-2xl border border-bd flex flex-col min-h-64 overflow-hidden">
                        <CardHeader
                            icon={NotebookPen} iconBg="bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400"
                            title="Notas clínicas"
                            badge={visit.clinicalNote ? 1 : null}
                        />
                        <div className="flex-1 p-4 flex flex-col gap-3">
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={10}
                                placeholder="Diagnóstico, indicaciones, plan de tratamiento..."
                                className="field resize-none flex-1 min-h-40"
                            />
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-gray-400 dark:text-slate-500 leading-snug">
                                    {visit.clinicalNoteUpdatedAt
                                        ? `Actualizado ${new Date(visit.clinicalNoteUpdatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                        : 'Sin nota guardada'}
                                </span>
                                <button
                                    onClick={saveNote}
                                    disabled={noteSaving}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
                                        noteSaved
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-medical-blue hover:bg-medical-blue/90 text-white disabled:opacity-50'
                                    }`}
                                >
                                    {noteSaved
                                        ? <><CheckCircle2 size={12} /> Guardado</>
                                        : noteSaving ? 'Guardando...'
                                        : <><Save size={12} /> Guardar</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Card 3: Interconsultas ── */}
                    <div className="bg-card rounded-2xl border border-bd flex flex-col min-h-64 overflow-hidden">
                        <CardHeader
                            icon={Stethoscope} iconBg="bg-purple-500/10" iconColor="text-purple-600 dark:text-purple-400"
                            title="Interconsultas"
                            badge={interconsultas.length || null}
                            action={
                                <button
                                    onClick={() => setShowForm(v => !v)}
                                    className="w-6 h-6 rounded-lg bg-medical-blue/10 hover:bg-medical-blue/20 text-medical-blue flex items-center justify-center transition-colors"
                                >
                                    {showForm ? <X size={12} /> : <Plus size={12} />}
                                </button>
                            }
                        />
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">

                            {/* ── Success banner ── */}
                            {sentOk && (
                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl px-3 py-2.5">
                                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                        Interconsulta enviada correctamente
                                    </p>
                                </div>
                            )}

                            {/* ── Add form ── */}
                            {showForm && (
                                <div className="bg-surface rounded-xl border border-bd p-3 space-y-2.5">

                                    {/* Doctor receptor */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Médico receptor *</label>
                                        <select
                                            value={interForm.assignedDoctorId}
                                            onChange={e => handleDoctorSelect(e.target.value)}
                                            className="field text-sm"
                                        >
                                            <option value="">Seleccionar médico...</option>
                                            {doctors.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.nombre}{d.especialidad ? ` — ${d.especialidad}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Especialidad */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Especialidad</label>
                                        <input
                                            type="text"
                                            list="ic-especialidades"
                                            value={interForm.especialidad}
                                            onChange={e => setInterForm(f => ({ ...f, especialidad: e.target.value }))}
                                            placeholder="Especialidad médica..."
                                            className="field text-sm"
                                        />
                                        <datalist id="ic-especialidades">
                                            {ESPECIALIDADES.map(s => <option key={s} value={s} />)}
                                        </datalist>
                                    </div>

                                    {/* Prioridad */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Prioridad</label>
                                        <select
                                            value={interForm.priority}
                                            onChange={e => setInterForm(f => ({ ...f, priority: e.target.value as Interconsulta['priority'] }))}
                                            className="field text-sm"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="alta">Alta</option>
                                            <option value="urgente">Urgente</option>
                                        </select>
                                    </div>

                                    {/* Motivo */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Motivo *</label>
                                        <textarea
                                            value={interForm.motivo}
                                            onChange={e => setInterForm(f => ({ ...f, motivo: e.target.value }))}
                                            placeholder="Motivo de la interconsulta"
                                            rows={2}
                                            className="field resize-none"
                                        />
                                    </div>

                                    {/* Resumen clínico */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Resumen clínico (opcional)</label>
                                        <textarea
                                            value={interForm.clinicalSummary}
                                            onChange={e => setInterForm(f => ({ ...f, clinicalSummary: e.target.value }))}
                                            placeholder="Contexto clínico relevante para el especialista..."
                                            rows={2}
                                            className="field resize-none"
                                        />
                                    </div>

                                    <button
                                        onClick={addReferral}
                                        disabled={interSaving || !interForm.assignedDoctorId || !interForm.motivo.trim()}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-medical-blue text-white text-xs font-semibold rounded-xl hover:bg-medical-blue/90 disabled:opacity-50 transition-colors"
                                    >
                                        {interSaving ? 'Enviando...' : <><Plus size={12} /> Enviar interconsulta</>}
                                    </button>
                                </div>
                            )}

                            {/* ── Empty state ── */}
                            {interconsultas.length === 0 && !showForm && (
                                <div className="text-center py-8">
                                    <Stethoscope size={28} strokeWidth={1} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Sin interconsultas registradas</p>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="mt-3 text-xs font-semibold text-medical-blue hover:underline"
                                    >
                                        + Solicitar interconsulta
                                    </button>
                                </div>
                            )}

                            {/* ── Summary row if any are pending ── */}
                            {pendingCount > 0 && (
                                <div className="flex items-center gap-2 px-1 pb-1">
                                    <Clock size={11} className="text-amber-500 flex-shrink-0" />
                                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                                        {pendingCount} en espera de respuesta
                                    </span>
                                </div>
                            )}

                            {/* ── List ── */}
                            {interconsultas.map(ic => {
                                const isAssigned   = ic.assignedDoctorId === currentUid;
                                const canRespond   = isAssigned && (ic.estado === 'pendiente' || ic.estado === 'en_proceso');
                                const isResponding = respondingTo === ic.id;

                                return (
                                    <div key={ic.id} className="bg-surface rounded-xl border border-bd p-3">
                                        {/* Header row */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200">{ic.especialidad}</span>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${ESTADO_STYLE[ic.estado]}`}>
                                                        {ESTADO_LABELS[ic.estado]}
                                                    </span>
                                                    {ic.priority && ic.priority !== 'normal' && (
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5 ${PRIORITY_STYLE[ic.priority]}`}>
                                                            {ic.priority === 'urgente' && <AlertCircle size={8} />}
                                                            {ic.priority}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Doctor info */}
                                                <div className="flex flex-col gap-0.5 mb-1.5">
                                                    {ic.assignedDoctorName && (
                                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                                            <User size={9} className="flex-shrink-0" />
                                                            <span>Para: <span className="font-semibold">{ic.assignedDoctorName}</span></span>
                                                        </p>
                                                    )}
                                                    {ic.requestingDoctorName && (
                                                        <p className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                                            <User size={9} className="flex-shrink-0 opacity-60" />
                                                            <span>Solicitante: {ic.requestingDoctorName}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                <p className="text-xs text-gray-600 dark:text-slate-300 leading-snug">{ic.motivo}</p>

                                                {ic.clinicalSummary && (
                                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 leading-snug italic">
                                                        {ic.clinicalSummary}
                                                    </p>
                                                )}

                                                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5">
                                                    {new Date(ic.requestedAt || ic.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                                {canRespond && (
                                                    <button
                                                        onClick={() => setRespondingTo(isResponding ? null : ic.id)}
                                                        className={`h-6 px-2 rounded-lg text-[10px] font-bold transition-colors ${
                                                            isResponding
                                                                ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                                                : 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                                        }`}
                                                    >
                                                        {isResponding ? 'Cerrar' : 'Responder'}
                                                    </button>
                                                )}
                                                {!canRespond && ic.estado === 'pendiente' && (
                                                    <button
                                                        onClick={() => updateInterconsulta(ic.id, { estado: 'completada' })}
                                                        className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-600 flex items-center justify-center transition-colors"
                                                        title="Marcar completada"
                                                    >
                                                        <CheckCircle2 size={11} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteInterconsulta(ic.id)}
                                                    className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 flex items-center justify-center transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline response form */}
                                        {isResponding && (
                                            <ResponseForm
                                                ic={ic}
                                                onClose={() => setRespondingTo(null)}
                                            />
                                        )}

                                        {/* Completed response view */}
                                        {ic.estado === 'completada' && !isResponding && (
                                            <ResponseView ic={ic} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>{/* end grid */}

            </div>
        </div>
    );
}
