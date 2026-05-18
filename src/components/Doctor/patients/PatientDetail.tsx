import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatients } from '../../../store/PatientContext';
import { questions } from '../../../config/questions';
import type { Language } from '../../../config/i18n';
import {
    calcIMC, calcPesoKg, hasAlert, MEDICAL_FIELDS, TIPO_SHORT,
} from '../../../services/patientsService';
import {
    subscribePatientVisits, subscribeClinicalMetrics,
    saveClinicalNote, updatePatientData,
    type PatientVisit, type ClinicalMetric,
} from '../../../services/patientServiceV2';
import {
    subscribePrescriptionsByPatient, deletePrescription,
    type Prescription,
} from '../../../services/prescriptionsService';
import { generateConsentPdf } from '../../../utils/generateConsentPdf';
import { generatePrescriptionPdf } from '../../../utils/generatePrescriptionPdf';
import PrescriptionForm from './PrescriptionForm';
import MetabolicEvolutionDashboard from './MetabolicEvolutionDashboard';
import { auth } from '../../../firebase';
import {
    AlertTriangle, Calendar, ChevronLeft, ClipboardList,
    CheckCircle2, Download, FileText, HeartPulse,
    NotebookPen, Plus, Pill, Clock, Activity,
    ChevronDown, ChevronUp, User, Pencil, Save, X, Trash2,
} from 'lucide-react';

const lang: Language = 'es';

const TIPO_BADGE: Record<string, string> = {
    'Primera vez':                    'bg-medical-blue/10 text-medical-blue',
    'Seguimiento 1er mes quirúrgico': 'bg-purple-100 text-purple-700',
    'Seguimiento 2do mes quirúrgico': 'bg-indigo-100 text-indigo-700',
    'Seguimiento 4to mes quirúrgico': 'bg-violet-100 text-violet-700',
    'Seguimiento 1 año quirúrgico':   'bg-green-100 text-green-700',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
    const parts   = name.trim().split(/\s+/);
    const letters = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return (
        <div className="w-14 h-14 rounded-2xl bg-medical-blue flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{letters}</span>
        </div>
    );
}

// ─── InfoField ────────────────────────────────────────────────────────────────

function InfoField({ label, value, alert }: { label: string; value?: string | number; alert?: boolean }) {
    const display = value != null && value !== '' ? String(value) : '—';
    return (
        <div className={`p-3.5 rounded-xl flex flex-col gap-1 ${alert ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${alert ? 'text-red-600' : 'text-gray-400'}`}>{label}</span>
            <span className={`text-sm font-semibold ${alert ? 'text-red-900' : 'text-gray-900'}`}>{display}</span>
        </div>
    );
}

// ─── EditField ────────────────────────────────────────────────────────────────

function EditField({ label, value, onChange, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-medical-blue/20"
            />
        </div>
    );
}

// ─── VisitSummaryCard (cronología) ────────────────────────────────────────────

function VisitSummaryCard({ visit, index }: { visit: PatientVisit; index: number }) {
    const tipo  = visit.visitType;
    const kg    = calcPesoKg(visit.answers['peso']);
    const imc   = calcIMC(visit.answers['peso'], visit.answers['estatura']);
    const alert = hasAlert(visit.answers);

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-4 ${alert ? 'border-red-100' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                {index === 0 && (
                    <span className="text-[9px] font-bold bg-medical-blue text-white px-2 py-0.5 rounded-full uppercase">
                        Más reciente
                    </span>
                )}
                {tipo && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${TIPO_BADGE[tipo] || 'bg-gray-100 text-gray-600'}`}>
                        {TIPO_SHORT[tipo] ?? tipo}
                    </span>
                )}
                {alert && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
            </div>
            <p className="text-sm font-semibold text-gray-900">
                {new Date(visit.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                {kg  != null && <span className="text-xs text-gray-500">{kg.toFixed(1)} kg</span>}
                {imc != null && <span className="text-xs text-gray-500">IMC {imc.toFixed(1)}</span>}
                {visit.answers['motivo_visita'] && (
                    <span className="text-xs text-gray-400">{String(visit.answers['motivo_visita'])}</span>
                )}
            </div>
        </div>
    );
}

// ─── VisitCardWithNote (consultas) ────────────────────────────────────────────

function VisitCardWithNote({
    visit, isCurrent, defaultOpen,
}: {
    visit: PatientVisit;
    isCurrent: boolean;
    defaultOpen?: boolean;
}) {
    const [open,       setOpen]       = useState(defaultOpen ?? false);
    const [showForm,   setShowForm]   = useState(false);
    const [note,       setNote]       = useState(visit.clinicalNote ?? '');
    const [noteSaving, setNoteSaving] = useState(false);
    const [noteSaved,  setNoteSaved]  = useState(false);

    const tipo   = visit.visitType;
    const motivo = visit.answers['motivo_visita'] as string | undefined;
    const kg     = calcPesoKg(visit.answers['peso']);
    const imc    = calcIMC(visit.answers['peso'], visit.answers['estatura']);
    const alert  = hasAlert(visit.answers);

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

    const formAnswers = questions
        .filter(q => q.type !== 'welcome' && q.type !== 'outro' && q.type !== 'consent_signature')
        .map(q => ({
            id:      q.id,
            title:   q.title[lang] || q.title['es'],
            answer:  visit.answers[q.id],
            spec:    visit.answers[`${q.id}_spec`],
            isAlert: q.category === 'medical' &&
                ['sí', 'si', 'yes', 'oui', 'ja'].includes(String(visit.answers[q.id] ?? '').toLowerCase()),
        }))
        .filter(d => d.answer !== undefined);

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
            isCurrent ? 'border-medical-blue/30' : 'border-gray-100'
        }`}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
            >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    alert ? 'bg-red-50' : 'bg-medical-blue/10'
                }`}>
                    {alert
                        ? <AlertTriangle size={16} className="text-red-500" />
                        : <FileText size={16} className="text-medical-blue" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">
                            {new Date(visit.createdAt).toLocaleDateString('es-ES', {
                                day: '2-digit', month: 'long', year: 'numeric',
                            })}
                        </span>
                        {isCurrent && (
                            <span className="text-[9px] font-bold bg-medical-blue text-white px-2 py-0.5 rounded-full uppercase">
                                Más reciente
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {tipo && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${TIPO_BADGE[tipo] || 'bg-gray-100 text-gray-600'}`}>
                                {TIPO_SHORT[tipo] ?? tipo}
                            </span>
                        )}
                        {motivo && (
                            <span className="text-[10px] text-gray-500 font-medium">
                                {motivo.replace('Cirugía ', '').replace('Metabolic Surgery', 'Metabólica')}
                            </span>
                        )}
                        {kg != null && (
                            <span className="text-[10px] text-gray-400">
                                {kg.toFixed(1)} kg{imc != null ? ` · IMC ${imc.toFixed(1)}` : ''}
                            </span>
                        )}
                        {visit.clinicalNote && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                Nota ✓
                            </span>
                        )}
                    </div>
                </div>
                {open
                    ? <ChevronUp   size={14} className="text-gray-400 flex-shrink-0" />
                    : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                }
            </button>

            {open && (
                <div className="border-t border-gray-50">
                    {/* Quick metrics */}
                    {(kg != null || imc != null || visit.answers['edad'] != null) && (
                        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {kg  != null && <InfoField label="Peso" value={`${kg.toFixed(1)} kg`} />}
                            {imc != null && <InfoField label="IMC"  value={imc.toFixed(1)} />}
                            {visit.answers['edad'] != null && (
                                <InfoField label="Edad" value={`${visit.answers['edad']} años`} />
                            )}
                            {MEDICAL_FIELDS.map(f => {
                                const val = visit.answers[f.id];
                                if (!val) return null;
                                const isYes = ['sí', 'si', 'yes', 'oui', 'ja'].includes(String(val).toLowerCase());
                                return <InfoField key={f.id} label={f.label} value={String(val)} alert={isYes} />;
                            })}
                        </div>
                    )}

                    {/* Form answers toggle */}
                    <div className="px-5 pb-3">
                        <button
                            onClick={() => setShowForm(v => !v)}
                            className="text-xs font-semibold text-medical-blue hover:underline flex items-center gap-1"
                        >
                            {showForm
                                ? <><ChevronUp size={12} /> Ocultar respuestas del formulario</>
                                : <><ChevronDown size={12} /> Ver respuestas del formulario</>
                            }
                        </button>
                    </div>

                    {showForm && formAnswers.length > 0 && (
                        <div className="px-5 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-gray-50">
                            {formAnswers.map(({ id, title, answer, spec, isAlert }) => {
                                const rawDisplay = typeof answer === 'object' && answer !== null
                                    ? `${answer.value} ${answer.unit}`
                                    : String(answer);
                                const displayValue = rawDisplay.replace('Cirugía Oncológica', 'Oncológica');
                                return (
                                    <div key={id} className={`p-3.5 rounded-xl flex flex-col gap-1 ${
                                        isAlert ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-transparent'
                                    }`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={`text-xs font-medium ${isAlert ? 'text-red-700' : 'text-gray-500'}`}>
                                                {title}
                                            </span>
                                            {isAlert && <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />}
                                        </div>
                                        <span className={`text-sm font-semibold capitalize ${isAlert ? 'text-red-900' : 'text-gray-900'}`}>
                                            {displayValue || '—'}
                                        </span>
                                        {spec && (
                                            <div className={`mt-1.5 p-2.5 rounded-lg text-xs font-medium ${
                                                isAlert ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                                <span className="opacity-60 uppercase tracking-wider block mb-0.5 text-[10px]">Detalles:</span>
                                                {spec}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Clinical note */}
                    <div className="px-5 pb-5 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <NotebookPen size={14} className="text-medical-blue" />
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Nota clínica del médico
                            </span>
                        </div>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={4}
                            placeholder="Escriba su nota clínica, diagnóstico o indicaciones para esta visita..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-medical-blue/20 resize-none"
                        />
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-gray-400">
                                {visit.clinicalNoteUpdatedAt
                                    ? `Actualizado: ${new Date(visit.clinicalNoteUpdatedAt).toLocaleString('es-ES', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}`
                                    : 'Sin nota guardada'
                                }
                            </span>
                            <button
                                onClick={saveNote}
                                disabled={noteSaving}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                    noteSaved
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-medical-blue hover:bg-medical-blue/90 text-white disabled:opacity-50'
                                }`}
                            >
                                {noteSaved
                                    ? <><CheckCircle2 size={12} /> Guardado</>
                                    : noteSaving
                                        ? 'Guardando...'
                                        : <><Save size={12} /> Guardar nota</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'cronologia' | 'informacion' | 'consultas' | 'documentos' | 'prescripciones';

type EditableData = {
    nombre: string; telefono: string; celular: string; email: string;
    fechaNacimiento: string; sexo: string; direccion: string;
    nacionalidad: string; estadoCivil: string; ocupacion: string;
};

export default function PatientDetail() {
    const { id }         = useParams<{ id: string }>();
    const navigate       = useNavigate();
    const { patientsV2 } = usePatients();

    const [tab,             setTab]             = useState<Tab>('cronologia');
    const [visits,          setVisits]          = useState<PatientVisit[]>([]);
    const [metrics,         setMetrics]         = useState<ClinicalMetric[]>([]);
    const [prescriptions,   setPrescriptions]   = useState<Prescription[]>([]);
    const [showPrescForm,   setShowPrescForm]   = useState(false);
    const [editPrescription, setEditPrescription] = useState<Prescription | null>(null);

    const [editMode,  setEditMode]  = useState(false);
    const [editData,  setEditData]  = useState<EditableData>({
        nombre: '', telefono: '', celular: '', email: '',
        fechaNacimiento: '', sexo: '', direccion: '',
        nacionalidad: '', estadoCivil: '', ocupacion: '',
    });
    const [editSaving, setEditSaving] = useState(false);

    const patientV2 = useMemo(
        () => patientsV2.find(p => p.id === id),
        [patientsV2, id],
    );

    const cedula = patientV2?.cedula_pasaporte;

    useEffect(() => { if (!id) return; return subscribePatientVisits(id, setVisits); }, [id]);
    useEffect(() => { if (!id) return; return subscribeClinicalMetrics(id, setMetrics); }, [id]);
    useEffect(() => { if (!id) return; return subscribePrescriptionsByPatient(id, setPrescriptions); }, [id]);

    const latestVisit = visits[0] ?? null;

    const startEdit = () => {
        if (!patientV2) return;
        setEditData({
            nombre:          patientV2.nombre,
            telefono:        patientV2.telefono,
            celular:         patientV2.celular,
            email:           patientV2.email,
            fechaNacimiento: patientV2.fechaNacimiento || String(latestVisit?.answers['fecha_nacimiento'] || ''),
            sexo:            patientV2.sexo,
            direccion:       patientV2.direccion || String(latestVisit?.answers['direccion'] || ''),
            nacionalidad:    patientV2.nacionalidad || String(latestVisit?.answers['nacionalidad'] || ''),
            estadoCivil:     patientV2.estadoCivil || String(latestVisit?.answers['estado_civil'] || ''),
            ocupacion:       patientV2.ocupacion || String(latestVisit?.answers['ocupacion'] || ''),
        });
        setEditMode(true);
    };

    const saveEdit = async () => {
        if (!id) return;
        setEditSaving(true);
        await updatePatientData(id, editData);
        setEditSaving(false);
        setEditMode(false);
    };

    const handleDeletePrescription = async (presc: Prescription) => {
        if (!confirm('¿Eliminar esta receta? Esta acción no se puede deshacer.')) return;
        await deletePrescription(presc.id);
    };

    if (!patientV2) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 p-8">
                <User size={40} strokeWidth={1} />
                <p className="text-sm">Paciente no encontrado</p>
                <button onClick={() => navigate('/doctor/pacientes')}
                    className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
                    <ChevronLeft size={13} /> Volver a la lista
                </button>
            </div>
        );
    }

    const imc      = latestVisit ? calcIMC(latestVisit.answers['peso'], latestVisit.answers['estatura']) : null;
    const kg       = latestVisit ? calcPesoKg(latestVisit.answers['peso']) : null;
    const alert    = patientV2.hasAlertFlag;
    const lastTipo = patientV2.lastVisitType;
    const fd       = latestVisit?.answers['autorizacion_firma'];

    return (
        <div className="flex-1 flex flex-col overflow-hidden">

            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-100 px-6 pt-5 pb-0 flex-shrink-0">
                <div className="flex items-start gap-4 mb-4">
                    <Avatar name={patientV2.nombre} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <button onClick={() => navigate('/doctor/pacientes')}
                                className="text-gray-400 hover:text-gray-600 transition-colors md:hidden">
                                <ChevronLeft size={18} />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 truncate">{patientV2.nombre}</h2>
                            {alert && <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {cedula && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{cedula}</span>
                            )}
                            {patientV2.sexo && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{patientV2.sexo}</span>
                            )}
                            {imc && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                    IMC {imc.toFixed(1)}{kg ? ` · ${kg.toFixed(1)} kg` : ''}
                                </span>
                            )}
                            {lastTipo && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${TIPO_BADGE[lastTipo] || 'bg-gray-100 text-gray-600'}`}>
                                    {TIPO_SHORT[lastTipo] ?? lastTipo}
                                </span>
                            )}
                            {visits.length > 1 && (
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                    {visits.length} consultas
                                </span>
                            )}
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Calendar size={9} />
                                Última: {new Date(patientV2.lastVisitAt).toLocaleDateString('es-ES', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="flex-shrink-0" />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 -mb-px overflow-x-auto">
                    {([
                        { key: 'cronologia',     label: 'Cronología',     icon: Clock,         badge: null },
                        { key: 'informacion',    label: 'Información',    icon: User,          badge: null },
                        { key: 'consultas',      label: 'Consultas',      icon: Activity,      badge: visits.length },
                        { key: 'documentos',     label: 'Documentos',     icon: ClipboardList, badge: null },
                        { key: 'prescripciones', label: 'Prescripciones', icon: Pill,          badge: prescriptions.length || null },
                    ] as const).map(({ key, label, icon: Icon, badge }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 whitespace-nowrap ${
                                tab === key
                                    ? 'border-medical-blue text-medical-blue'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                            }`}>
                            <Icon size={12} />
                            {label}
                            {badge != null && badge > 0 && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    tab === key ? 'bg-medical-blue text-white' : 'bg-gray-100 text-gray-500'
                                }`}>{badge}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tab content ── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* ─── CRONOLOGÍA ─── */}
                {tab === 'cronologia' && (
                    <>
                        <MetabolicEvolutionDashboard metrics={metrics} visits={visits} />

                        {visits.length > 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Clock size={15} className="text-medical-blue" />
                                    Últimas visitas
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {visits.slice(0, 3).map((v, i) => (
                                        <VisitSummaryCard key={v.id} visit={v} index={i} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                                <Clock size={32} strokeWidth={1} />
                                <p className="text-sm">Sin visitas registradas</p>
                            </div>
                        )}
                    </>
                )}

                {/* ─── INFORMACIÓN ─── */}
                {tab === 'informacion' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Personal data */}
                            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <User size={16} className="text-medical-blue" />
                                        <h3 className="font-semibold text-gray-800">Datos personales</h3>
                                    </div>
                                    {!editMode ? (
                                        <button onClick={startEdit}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-medical-blue transition-colors">
                                            <Pencil size={12} /> Editar
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditMode(false)}
                                                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600">
                                                <X size={13} /> Cancelar
                                            </button>
                                            <button onClick={saveEdit} disabled={editSaving}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-medical-blue text-white text-xs font-semibold rounded-lg hover:bg-medical-blue/90 disabled:opacity-50">
                                                <Save size={12} /> {editSaving ? 'Guardando...' : 'Guardar'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {editMode ? (
                                        <>
                                            <EditField label="Nombre completo" value={editData.nombre} onChange={v => setEditData(d => ({ ...d, nombre: v }))} />
                                            <InfoField label="Cédula / Pasaporte" value={cedula} />
                                            <EditField label="Fecha de nacimiento" type="date" value={editData.fechaNacimiento} onChange={v => setEditData(d => ({ ...d, fechaNacimiento: v }))} />
                                            <InfoField label="Edad" value={latestVisit?.answers['edad'] ? `${latestVisit.answers['edad']} años` : undefined} />
                                            <EditField label="Sexo" value={editData.sexo} onChange={v => setEditData(d => ({ ...d, sexo: v }))} />
                                            <EditField label="Nacionalidad" value={editData.nacionalidad} onChange={v => setEditData(d => ({ ...d, nacionalidad: v }))} />
                                            <EditField label="Estado civil" value={editData.estadoCivil} onChange={v => setEditData(d => ({ ...d, estadoCivil: v }))} />
                                            <EditField label="Ocupación" value={editData.ocupacion} onChange={v => setEditData(d => ({ ...d, ocupacion: v }))} />
                                        </>
                                    ) : (
                                        <>
                                            <InfoField label="Nombre completo" value={patientV2.nombre} />
                                            <InfoField label="Cédula / Pasaporte" value={cedula} />
                                            <InfoField label="Fecha de nacimiento" value={patientV2.fechaNacimiento || latestVisit?.answers['fecha_nacimiento']} />
                                            <InfoField label="Edad" value={latestVisit?.answers['edad'] ? `${latestVisit.answers['edad']} años` : undefined} />
                                            <InfoField label="Sexo" value={patientV2.sexo} />
                                            <InfoField label="Nacionalidad" value={patientV2.nacionalidad || latestVisit?.answers['nacionalidad']} />
                                            <InfoField label="Estado civil" value={patientV2.estadoCivil || latestVisit?.answers['estado_civil']} />
                                            <InfoField label="Ocupación" value={patientV2.ocupacion || latestVisit?.answers['ocupacion']} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
                                    <Activity size={16} className="text-medical-blue" />
                                    <h3 className="font-semibold text-gray-800">Contacto</h3>
                                </div>
                                <div className="p-5 space-y-3">
                                    {editMode ? (
                                        <>
                                            <EditField label="Teléfono" value={editData.telefono} onChange={v => setEditData(d => ({ ...d, telefono: v }))} />
                                            <EditField label="Celular" value={editData.celular} onChange={v => setEditData(d => ({ ...d, celular: v }))} />
                                            <EditField label="Correo electrónico" type="email" value={editData.email} onChange={v => setEditData(d => ({ ...d, email: v }))} />
                                            <EditField label="Dirección" value={editData.direccion} onChange={v => setEditData(d => ({ ...d, direccion: v }))} />
                                        </>
                                    ) : (
                                        <>
                                            <InfoField label="Teléfono" value={patientV2.telefono} />
                                            <InfoField label="Celular" value={patientV2.celular} />
                                            <InfoField label="Correo electrónico" value={patientV2.email} />
                                            <InfoField label="Dirección" value={patientV2.direccion || latestVisit?.answers['direccion']} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Resumen clínico */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
                                <HeartPulse size={16} className="text-red-500" />
                                <h3 className="font-semibold text-gray-800">Resumen clínico</h3>
                                <span className="text-[10px] text-gray-400 ml-1">— datos de la última consulta</span>
                            </div>
                            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {kg   != null && <InfoField label="Peso" value={`${kg.toFixed(1)} kg`} />}
                                {imc  != null && <InfoField label="IMC"  value={imc.toFixed(1)} />}
                                {latestVisit && MEDICAL_FIELDS.map(f => {
                                    const val  = latestVisit.answers[f.id];
                                    const spec = f.specId ? latestVisit.answers[f.specId] : undefined;
                                    const isYes = ['sí', 'si', 'yes', 'oui', 'ja'].includes(String(val || '').toLowerCase());
                                    return (
                                        <div key={f.id} className={`p-3.5 rounded-xl flex flex-col gap-1 ${isYes ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isYes ? 'text-red-600' : 'text-gray-400'}`}>{f.label}</span>
                                            <span className={`text-sm font-semibold capitalize ${isYes ? 'text-red-900' : 'text-gray-900'}`}>
                                                {val != null ? String(val) : '—'}
                                            </span>
                                            {spec && <span className="text-xs text-gray-500 mt-0.5">{spec}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* ─── CONSULTAS ─── */}
                {tab === 'consultas' && (
                    <>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">
                                {visits.length} visita{visits.length !== 1 ? 's' : ''} registrada{visits.length !== 1 ? 's' : ''}
                            </h3>
                        </div>

                        {visits.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                <Activity size={36} strokeWidth={1} />
                                <p className="text-sm">Sin consultas registradas</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {visits.map((v, i) => (
                                    <VisitCardWithNote
                                        key={v.id}
                                        visit={v}
                                        isCurrent={i === 0}
                                        defaultOpen={i === 0 && visits.length === 1}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ─── DOCUMENTOS ─── */}
                {tab === 'documentos' && (
                    fd ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50/50 px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <FileText size={18} className="text-brand-primary" />
                                    <h3 className="font-semibold text-gray-800">Firma de Autorización de Imagen</h3>
                                </div>
                                <button
                                    onClick={() => generateConsentPdf({ ...fd, language: latestVisit?.answers['_language'] || 'es' })}
                                    className="flex items-center gap-1.5 bg-medical-blue hover:bg-medical-blue/90 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all">
                                    <Download size={14} /> Descargar PDF
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InfoField label="Nombre" value={fd.nombre} />
                                    <InfoField label="Cédula / Pasaporte" value={fd.cedula} />
                                    <InfoField label="Fecha de firma" value={fd.fecha} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Firma</p>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden inline-block bg-white p-2">
                                        <img src={fd.signature} alt="Firma del paciente" style={{ maxHeight: '120px', maxWidth: '100%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                            <ClipboardList size={36} strokeWidth={1} />
                            <p className="text-sm">Sin documentos disponibles</p>
                        </div>
                    )
                )}

                {/* ─── PRESCRIPCIONES ─── */}
                {tab === 'prescripciones' && (
                    <>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">Recetas médicas</h3>
                            <button onClick={() => setShowPrescForm(true)}
                                className="flex items-center gap-1.5 bg-medical-blue hover:bg-medical-blue/90 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all">
                                <Plus size={14} /> Nueva receta
                            </button>
                        </div>

                        {prescriptions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                <Pill size={36} strokeWidth={1} />
                                <p className="text-sm">Sin recetas registradas</p>
                                <button onClick={() => setShowPrescForm(true)}
                                    className="text-xs text-medical-blue font-semibold hover:underline">
                                    Generar primera receta
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {prescriptions.map(p => (
                                    <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {new Date(p.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                                        day: '2-digit', month: 'long', year: 'numeric',
                                                    })}
                                                </p>
                                                {p.diagnostico && (
                                                    <p className="text-xs text-gray-500 mt-0.5">{p.diagnostico}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                    {p.medications.length} med.
                                                </span>
                                                <button
                                                    onClick={() => generatePrescriptionPdf({
                                                        patientName:   p.patientName,
                                                        patientCedula: p.patientCedula,
                                                        date:          p.date,
                                                        diagnostico:   p.diagnostico,
                                                        medications:   p.medications,
                                                        indicaciones:  p.indicaciones,
                                                    })}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-medical-blue hover:bg-medical-blue/90 text-white text-xs font-semibold rounded-lg transition-all"
                                                >
                                                    <Download size={13} /> PDF
                                                </button>
                                                <button
                                                    onClick={() => { setEditPrescription(p); setShowPrescForm(true); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-all"
                                                >
                                                    <Pencil size={13} /> Modificar
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePrescription(p)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-all"
                                                >
                                                    <Trash2 size={13} /> Eliminar
                                                </button>
                                            </div>
                                        </div>
                                        {(p.medications.length > 0 || p.indicaciones) && (
                                            <div className="p-5 space-y-3">
                                                {p.medications.map((m, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className="w-5 h-5 rounded-full bg-medical-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-[9px] font-bold text-medical-blue">{i + 1}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{m.nombre}</p>
                                                            {(m.dosis || m.frecuencia || m.duracion) && (
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    {[m.dosis, m.frecuencia, m.duracion].filter(Boolean).join(' · ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {p.indicaciones && (
                                                    <div className="pt-3 border-t border-gray-50">
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Indicaciones</p>
                                                        <p className="text-xs text-gray-700 leading-relaxed">{p.indicaciones}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {showPrescForm && id && (
                <PrescriptionForm
                    patientId={id}
                    patientName={patientV2.nombre}
                    patientCedula={cedula || ''}
                    initialData={editPrescription ?? undefined}
                    onClose={() => { setShowPrescForm(false); setEditPrescription(null); }}
                    onSaved={() => { setShowPrescForm(false); setEditPrescription(null); }}
                />
            )}
        </div>
    );
}
