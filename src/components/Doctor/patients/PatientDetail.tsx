import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePatients } from '../../../store/PatientContext';
import {
    calcIMC, calcPesoKg, TIPO_SHORT,
} from '../../../services/patientsService';
import {
    subscribePatientVisits, subscribeClinicalMetrics,
    updatePatientData,
    type PatientVisit, type ClinicalMetric,
} from '../../../services/patientServiceV2';
import {
    subscribePrescriptionsByPatient, deletePrescription,
    type Prescription,
} from '../../../services/prescriptionsService';
import {
    subscribeLicensesByPatient, deleteLicense,
    type MedicalLicense,
} from '../../../services/licensesService';
import { generateConsentPdf } from '../../../utils/generateConsentPdf';
import { generatePrescriptionPdf } from '../../../utils/generatePrescriptionPdf';
import { generateLicensePdf } from '../../../utils/generateLicensePdf';
import PrescriptionForm from './PrescriptionForm';
import MedicalLicenseForm from './MedicalLicenseForm';
import MetabolicEvolutionDashboard from './MetabolicEvolutionDashboard';
import ConsultaDetailView from './ConsultaDetailView';
import {
    Calendar, ChevronLeft, ChevronRight, ClipboardList,
    Download, FileText,
    Plus, Pill, Clock, Activity,
    User, Pencil, Save, X, Trash2,
    FileCheck, Mail, Phone, MapPin, Briefcase, Heart,
    Stethoscope,
} from 'lucide-react';


const TIPO_BADGE: Record<string, { bg: string; text: string }> = {
    'Primera vez':                    { bg: 'bg-medical-blue/10',  text: 'text-medical-blue' },
    'Seguimiento 1er mes quirúrgico': { bg: 'bg-purple-100 dark:bg-purple-950/40',  text: 'text-purple-700 dark:text-purple-400' },
    'Seguimiento 2do mes quirúrgico': { bg: 'bg-indigo-100 dark:bg-indigo-950/40',  text: 'text-indigo-700 dark:text-indigo-400' },
    'Seguimiento 4to mes quirúrgico': { bg: 'bg-violet-100 dark:bg-violet-950/40',  text: 'text-violet-700 dark:text-violet-400' },
    'Seguimiento 1 año quirúrgico':   { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400' },
    'Entrega de resultados':          { bg: 'bg-amber-100 dark:bg-amber-950/40',    text: 'text-amber-700 dark:text-amber-400' },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const parts   = name.trim().split(/\s+/);
    const letters = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    const sizes = {
        sm: 'w-9 h-9 text-xs rounded-xl',
        md: 'w-14 h-14 text-lg rounded-2xl',
        lg: 'w-20 h-20 text-2xl rounded-2xl',
    };
    return (
        <div className={`bg-gradient-to-br from-medical-blue to-brand-primary flex items-center justify-center flex-shrink-0 shadow-md ${sizes[size]}`}>
            <span className="text-white font-bold">{letters}</span>
        </div>
    );
}

// ─── InfoRow (info grid) ──────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }: {
    label: string;
    value?: string | null;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                {label}
            </span>
            <div className="flex items-center gap-1.5">
                {Icon && <Icon size={12} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />}
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">
                    {value || '—'}
                </span>
            </div>
        </div>
    );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent = false }: {
    label: string; value: string | number; accent?: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className={`text-2xl font-black leading-none ${accent ? 'text-medical-blue' : 'text-gray-900 dark:text-slate-100'}`}>
                {value}
            </span>
            <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">
                {label}
            </span>
        </div>
    );
}


// ─── EditField ────────────────────────────────────────────────────────────────
function EditField({ label, value, onChange, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">{label}</label>
            <input
                type={type} value={value}
                onChange={e => onChange(e.target.value)}
                className="field"
            />
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
type CenterView = 'cronologia' | 'consultas' | 'consulta-detail';
type SideTab = 'recetas' | 'licencias';

type EditableData = {
    nombre: string; telefono: string; celular: string; email: string;
    fechaNacimiento: string; sexo: string; direccion: string;
    nacionalidad: string; estadoCivil: string; ocupacion: string;
};

export default function PatientDetail() {
    const { id }         = useParams<{ id: string }>();
    const navigate       = useNavigate();
    const location       = useLocation();
    const { patientsV2 } = usePatients();
    const handledNavState = useRef(false);

    const [centerView,       setCenterView]       = useState<CenterView>('cronologia');
    const [activeVisit,      setActiveVisit]      = useState<PatientVisit | null>(null);
    const [sideTab,          setSideTab]          = useState<SideTab>('recetas');
    const [visits,           setVisits]           = useState<PatientVisit[]>([]);
    const [metrics,          setMetrics]          = useState<ClinicalMetric[]>([]);
    const [prescriptions,    setPrescriptions]    = useState<Prescription[]>([]);
    const [showPrescForm,    setShowPrescForm]    = useState(false);
    const [editPrescription, setEditPrescription] = useState<Prescription | null>(null);
    const [licenses,         setLicenses]         = useState<MedicalLicense[]>([]);
    const [showLicenseForm,  setShowLicenseForm]  = useState(false);
    const [editLicense,      setEditLicense]      = useState<MedicalLicense | null>(null);
    const [editMode,         setEditMode]         = useState(false);
    const [editData,         setEditData]         = useState<EditableData>({
        nombre: '', telefono: '', celular: '', email: '',
        fechaNacimiento: '', sexo: '', direccion: '',
        nacionalidad: '', estadoCivil: '', ocupacion: '',
    });
    const [editSaving, setEditSaving] = useState(false);

    const patientV2 = useMemo(() => patientsV2.find(p => p.id === id), [patientsV2, id]);
    const cedula    = patientV2?.cedula_pasaporte;

    useEffect(() => { if (!id) return; return subscribePatientVisits(id, setVisits); }, [id]);

    // Auto-open a specific visit when navigated from the interconsultas dashboard widget
    useEffect(() => {
        if (handledNavState.current || visits.length === 0) return;
        const state = location.state as { openVisitId?: string } | null;
        if (!state?.openVisitId) return;
        const visit = visits.find(v => v.id === state.openVisitId);
        if (visit) {
            setActiveVisit(visit);
            setCenterView('consulta-detail');
            handledNavState.current = true;
        }
    }, [visits]);

    useEffect(() => { if (!id) return; return subscribeClinicalMetrics(id, setMetrics); }, [id]);
    useEffect(() => { if (!id) return; return subscribePrescriptionsByPatient(id, setPrescriptions); }, [id]);
    useEffect(() => { if (!id) return; return subscribeLicensesByPatient(id, setLicenses); }, [id]);

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

    const handleDeleteLicense = async (lic: MedicalLicense) => {
        if (!confirm('¿Eliminar esta licencia? Esta acción no se puede deshacer.')) return;
        await deleteLicense(lic.id);
    };

    if (!patientV2) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 p-8">
                <User size={40} strokeWidth={1} />
                <p className="text-sm">Paciente no encontrado</p>
                <button onClick={() => navigate('/doctor/pacientes')} className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
                    <ChevronLeft size={13} /> Volver a la lista
                </button>
            </div>
        );
    }

    const imc      = latestVisit ? calcIMC(latestVisit.answers['peso'], latestVisit.answers['estatura']) : null;
    const kg       = latestVisit ? calcPesoKg(latestVisit.answers['peso']) : null;
    const lastTipo = patientV2.lastVisitType;
    const lastTipoBadge = lastTipo ? (TIPO_BADGE[lastTipo] ?? { bg: 'bg-gray-100 dark:bg-slate-800', text: 'text-gray-600 dark:text-slate-400' }) : null;

    const allFirmas = visits
        .filter(v => v.answers['autorizacion_firma'])
        .map(v => ({
            ...(v.answers['autorizacion_firma'] as { signature: string; nombre: string; cedula: string; fecha: string }),
            language: String(v.answers['_language'] || 'es'),
            visitDate: v.createdAt,
        }));

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-app-bg">

            {/* ── Breadcrumb + actions bar ── */}
            <div className="px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0 bg-card border-b border-bd gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/doctor/pacientes')}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-slate-500 hover:text-medical-blue transition-colors"
                    >
                        <ChevronLeft size={14} /> Pacientes
                    </button>
                    <span className="text-gray-300 dark:text-slate-600">/</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate max-w-[220px]">{patientV2.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                    {!editMode ? (
                        <button
                            onClick={startEdit}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-medical-blue border border-bd rounded-xl px-3 py-1.5 transition-colors"
                        >
                            <Pencil size={13} /> Editar paciente
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-1.5"
                            >
                                <X size={13} /> Cancelar
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={editSaving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-medical-blue text-white text-xs font-semibold rounded-xl hover:bg-medical-blue/90 disabled:opacity-50"
                            >
                                <Save size={12} /> {editSaving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── 3-column layout ── */}
            <div className="flex-1 overflow-hidden flex relative">

                {/* ════ LEFT: Profile card ════ */}
                <div className="hidden md:flex md:flex-col w-60 flex-shrink-0 border-r border-bd bg-card overflow-y-auto">
                    <div className="p-5 flex flex-col gap-5">

                        {/* Avatar + name */}
                        <div className="flex flex-col items-center gap-3 pt-3">
                            <Avatar name={patientV2.nombre} size="lg" />
                            <div className="text-center w-full">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-slate-50 leading-snug">{patientV2.nombre}</h2>
                                {cedula && (
                                    <span className="inline-block mt-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-bd px-2.5 py-0.5 rounded-full">{cedula}</span>
                                )}
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-bd">
                            <StatCard label="Consultas" value={visits.length} />
                            <StatCard label="IMC"       value={imc ? imc.toFixed(1) : '—'} accent />
                            <StatCard label="Peso"      value={kg ? `${kg.toFixed(0)}kg` : '—'} />
                        </div>

                        {/* Contact */}
                        {(patientV2.email || patientV2.telefono || patientV2.celular || patientV2.direccion) && (
                            <div className="space-y-2 border-t border-bd pt-4">
                                {patientV2.email && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                                        <Mail size={11} className="flex-shrink-0 text-gray-300 dark:text-slate-600" />
                                        <span className="truncate">{patientV2.email}</span>
                                    </div>
                                )}
                                {(patientV2.telefono || patientV2.celular) && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                                        <Phone size={11} className="flex-shrink-0 text-gray-300 dark:text-slate-600" />
                                        <span>{patientV2.telefono || patientV2.celular}</span>
                                    </div>
                                )}
                                {patientV2.direccion && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                                        <MapPin size={11} className="flex-shrink-0 text-gray-300 dark:text-slate-600" />
                                        <span className="truncate">{patientV2.direccion}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Last visit type badge */}
                        {lastTipoBadge && lastTipo && (
                            <div className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase border-t border-bd pt-4 mt-1 ${lastTipoBadge.bg} ${lastTipoBadge.text}`}>
                                <Stethoscope size={10} />
                                {TIPO_SHORT[lastTipo] ?? lastTipo}
                            </div>
                        )}
                    </div>
                </div>

                {/* ════ CENTER: Info grid + tabs ════ */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                    {/* Info grid (always visible) */}
                    <div className="flex-shrink-0 bg-card border-b border-bd px-4 md:px-6 py-5">
                        {editMode ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                <EditField label="Nombre completo"  value={editData.nombre}          onChange={v => setEditData(d => ({ ...d, nombre: v }))} />
                                <EditField label="Fecha nacimiento" type="date" value={editData.fechaNacimiento} onChange={v => setEditData(d => ({ ...d, fechaNacimiento: v }))} />
                                <EditField label="Sexo"             value={editData.sexo}            onChange={v => setEditData(d => ({ ...d, sexo: v }))} />
                                <EditField label="Teléfono"         value={editData.telefono}        onChange={v => setEditData(d => ({ ...d, telefono: v }))} />
                                <EditField label="Celular"          value={editData.celular}         onChange={v => setEditData(d => ({ ...d, celular: v }))} />
                                <EditField label="Correo" type="email" value={editData.email}        onChange={v => setEditData(d => ({ ...d, email: v }))} />
                                <EditField label="Dirección"        value={editData.direccion}       onChange={v => setEditData(d => ({ ...d, direccion: v }))} />
                                <EditField label="Nacionalidad"     value={editData.nacionalidad}    onChange={v => setEditData(d => ({ ...d, nacionalidad: v }))} />
                                <EditField label="Estado civil"     value={editData.estadoCivil}     onChange={v => setEditData(d => ({ ...d, estadoCivil: v }))} />
                                <EditField label="Ocupación"        value={editData.ocupacion}       onChange={v => setEditData(d => ({ ...d, ocupacion: v }))} />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                                    <InfoRow label="Género"          value={patientV2.sexo}          icon={User} />
                                    <InfoRow label="Nacimiento"      value={patientV2.fechaNacimiento || String(latestVisit?.answers['fecha_nacimiento'] || '') || null} icon={Calendar} />
                                    <InfoRow label="Teléfono"        value={patientV2.telefono || patientV2.celular} icon={Phone} />
                                    <InfoRow label="Correo"          value={patientV2.email}         icon={Mail} />
                                    <InfoRow label="Estado civil"    value={patientV2.estadoCivil || String(latestVisit?.answers['estado_civil'] || '') || null} icon={Heart} />
                                    <InfoRow label="Ocupación"       value={patientV2.ocupacion || String(latestVisit?.answers['ocupacion'] || '') || null} icon={Briefcase} />
                                    <InfoRow label="Nacionalidad"    value={patientV2.nacionalidad || String(latestVisit?.answers['nacionalidad'] || '') || null} icon={MapPin} />
                                    <InfoRow label="Última consulta" value={new Date(patientV2.lastVisitAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} icon={Clock} />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Cronología content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        <MetabolicEvolutionDashboard metrics={metrics} visits={visits} />

                        {visits.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-slate-500">
                                <Clock size={36} strokeWidth={1} />
                                <p className="text-sm">Sin consultas registradas</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Últimas consultas</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {visits.slice(0, 3).map((v, i) => {
                                        const vKg    = calcPesoKg(v.answers['peso']);
                                        const vImc   = calcIMC(v.answers['peso'], v.answers['estatura']);
                                        const vTipo  = v.visitType;
                                        const vBadge = vTipo ? (TIPO_BADGE[vTipo] ?? { bg: 'bg-gray-100 dark:bg-slate-800', text: 'text-gray-600 dark:text-slate-400' }) : null;
                                        const motivo = v.answers['motivo_visita'] as string | undefined;
                                        return (
                                            <div key={v.id} className={`bg-card rounded-2xl border shadow-sm p-4 flex flex-col gap-3 ${i === 0 ? 'border-medical-blue/30 dark:border-medical-blue/20' : 'border-bd'}`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug">
                                                            {new Date(v.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                                                            {new Date(v.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    {i === 0 && <span className="text-[9px] font-bold bg-medical-blue text-white px-1.5 py-0.5 rounded-full uppercase">Nueva</span>}
                                                </div>
                                                {vBadge && vTipo && (
                                                    <span className={`self-start text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${vBadge.bg} ${vBadge.text}`}>
                                                        {TIPO_SHORT[vTipo] ?? vTipo}
                                                    </span>
                                                )}
                                                {motivo && !vTipo && (
                                                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">
                                                        {motivo.replace('Cirugía ', '').replace('Metabolic Surgery', 'Metabólica')}
                                                    </span>
                                                )}
                                                {(vKg != null || vImc != null) && (
                                                    <div className="flex gap-4 pt-1 border-t border-bd">
                                                        {vKg  != null && <div className="flex flex-col"><span className="text-base font-black text-gray-900 dark:text-slate-100 leading-none">{vKg.toFixed(1)}</span><span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">kg</span></div>}
                                                        {vImc != null && <div className="flex flex-col"><span className="text-base font-black text-medical-blue leading-none">{vImc.toFixed(1)}</span><span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">IMC</span></div>}
                                                    </div>
                                                )}
                                                {v.clinicalNote && (
                                                    <div className="pt-2 border-t border-bd">
                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Nota</p>
                                                        <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{v.clinicalNote}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ════ RIGHT: Documents + Prescriptions/Licenses ════ */}
                <div className="hidden xl:flex xl:flex-col w-72 flex-shrink-0 border-l border-bd bg-card overflow-y-auto">
                    <div className="p-4 space-y-4">

                        {/* ── Documents card ── */}
                        <div className="bg-surface rounded-2xl border border-bd overflow-hidden">
                            <div className="px-4 py-3 border-b border-bd flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                                        <ClipboardList size={13} className="text-brand-primary" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200">Documentos</span>
                                </div>
                                {allFirmas.length > 0 && (
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-bd px-1.5 py-0.5 rounded-full">{allFirmas.length}</span>
                                )}
                            </div>
                            {allFirmas.length === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Sin documentos disponibles</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-bd">
                                    {allFirmas.map((firma, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                                <FileText size={13} className="text-brand-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">Autorización de Imagen</p>
                                                <p className="text-[10px] text-gray-400 dark:text-slate-500">
                                                    {firma.fecha || new Date(firma.visitDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => generateConsentPdf({ ...firma, language: firma.language })}
                                                className="w-7 h-7 rounded-lg bg-medical-blue/10 hover:bg-medical-blue/20 text-medical-blue flex items-center justify-center flex-shrink-0 transition-colors"
                                            >
                                                <Download size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Prescriptions + Licenses card ── */}
                        <div className="bg-surface rounded-2xl border border-bd overflow-hidden">

                            {/* Sub-tabs */}
                            <div className="flex border-b border-bd">
                                <button
                                    onClick={() => setSideTab('recetas')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${sideTab === 'recetas' ? 'text-medical-blue bg-medical-blue/5' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                                >
                                    <Pill size={11} /> Recetas
                                    {prescriptions.length > 0 && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sideTab === 'recetas' ? 'bg-medical-blue text-white' : 'bg-bd text-gray-500 dark:text-slate-400'}`}>{prescriptions.length}</span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setSideTab('licencias')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold border-l border-bd transition-colors ${sideTab === 'licencias' ? 'text-medical-blue bg-medical-blue/5' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                                >
                                    <FileCheck size={11} /> Licencias
                                    {licenses.length > 0 && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sideTab === 'licencias' ? 'bg-medical-blue text-white' : 'bg-bd text-gray-500 dark:text-slate-400'}`}>{licenses.length}</span>
                                    )}
                                </button>
                            </div>

                            {/* Add button */}
                            <div className="p-3 border-b border-bd">
                                {sideTab === 'recetas' ? (
                                    <button
                                        onClick={() => setShowPrescForm(true)}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-medical-blue/10 hover:bg-medical-blue/20 text-medical-blue text-xs font-semibold transition-colors"
                                    >
                                        <Plus size={13} /> Nueva receta
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setEditLicense(null); setShowLicenseForm(true); }}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-medical-blue/10 hover:bg-medical-blue/20 text-medical-blue text-xs font-semibold transition-colors"
                                    >
                                        <Plus size={13} /> Nueva licencia
                                    </button>
                                )}
                            </div>

                            {/* Recetas list */}
                            {sideTab === 'recetas' && (
                                prescriptions.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <Pill size={24} strokeWidth={1} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                                        <p className="text-xs text-gray-400 dark:text-slate-500">Sin recetas registradas</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-bd">
                                        {prescriptions.map(p => (
                                            <div key={p.id} className="px-4 py-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                                                            {new Date(p.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        {p.diagnostico && (
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">{p.diagnostico}</p>
                                                        )}
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500">{p.medications.length} medicamento{p.medications.length !== 1 ? 's' : ''}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={() => generatePrescriptionPdf({ patientName: p.patientName, patientCedula: p.patientCedula, date: p.date, diagnostico: p.diagnostico, medications: p.medications, indicaciones: p.indicaciones })}
                                                            className="w-6 h-6 rounded-lg bg-medical-blue/10 hover:bg-medical-blue/20 text-medical-blue flex items-center justify-center transition-colors"
                                                            title="Descargar PDF"
                                                        >
                                                            <Download size={11} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditPrescription(p); setShowPrescForm(true); }}
                                                            className="w-6 h-6 rounded-lg bg-bd hover:bg-bd2 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                                                            title="Modificar"
                                                        >
                                                            <Pencil size={11} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePrescription(p)}
                                                            className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 flex items-center justify-center transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Licencias list */}
                            {sideTab === 'licencias' && (
                                licenses.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <FileCheck size={24} strokeWidth={1} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                                        <p className="text-xs text-gray-400 dark:text-slate-500">Sin licencias registradas</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-bd">
                                        {licenses.map(lic => (
                                            <div key={lic.id} className="px-4 py-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                                                            {new Date(lic.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                                                            {lic.diasReposo} {lic.diasReposo === 1 ? 'día' : 'días'} de reposo
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{lic.diagnostico}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={() => generateLicensePdf({ patientName: lic.patientName, patientCedula: lic.patientCedula, date: lic.date, fechaInicio: lic.fechaInicio, diasReposo: lic.diasReposo, fechaFin: lic.fechaFin, diagnostico: lic.diagnostico, indicaciones: lic.indicaciones })}
                                                            className="w-6 h-6 rounded-lg bg-medical-blue/10 hover:bg-medical-blue/20 text-medical-blue flex items-center justify-center transition-colors"
                                                            title="Descargar PDF"
                                                        >
                                                            <Download size={11} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditLicense(lic); setShowLicenseForm(true); }}
                                                            className="w-6 h-6 rounded-lg bg-bd hover:bg-bd2 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                                                            title="Modificar"
                                                        >
                                                            <Pencil size={11} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLicense(lic)}
                                                            className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 flex items-center justify-center transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>

                        {/* ── Consultas button card ── */}
                        <button
                            onClick={() => setCenterView('consultas')}
                            className="w-full bg-surface rounded-2xl border border-bd hover:border-medical-blue/40 hover:bg-medical-blue/[0.02] transition-all overflow-hidden text-left group"
                        >
                            <div className="px-4 py-4 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-medical-blue/10 group-hover:bg-medical-blue/15 flex items-center justify-center flex-shrink-0 transition-colors">
                                    <Activity size={16} className="text-medical-blue" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Consultas</p>
                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                                        {visits.length === 0
                                            ? 'Sin consultas registradas'
                                            : `${visits.length} visita${visits.length !== 1 ? 's' : ''} registrada${visits.length !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                                <ChevronRight size={14} className="text-gray-300 dark:text-slate-600 group-hover:text-medical-blue/50 flex-shrink-0 transition-colors" />
                            </div>
                        </button>

                    </div>
                </div>

                {/* ════ Consultas overlay ════ */}
                {centerView !== 'cronologia' && (
                    <div className="absolute inset-0 z-10 bg-app-bg flex flex-col">

                        {/* ── Consultas list ── */}
                        {centerView === 'consultas' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-shrink-0 px-5 py-3.5 border-b border-bd bg-card flex items-center gap-3 flex-wrap">
                                    <button
                                        onClick={() => setCenterView('cronologia')}
                                        className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-slate-500 hover:text-medical-blue transition-colors"
                                    >
                                        <ChevronLeft size={14} /> Cronología
                                    </button>
                                    <span className="text-gray-300 dark:text-slate-600">/</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-800 dark:text-slate-200">Consultas</span>
                                        {visits.length > 0 && (
                                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-bd px-1.5 py-0.5 rounded-full">{visits.length}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {visits.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-slate-500">
                                            <Activity size={32} strokeWidth={1} />
                                            <p className="text-sm">Sin consultas registradas</p>
                                        </div>
                                    ) : visits.map((v, i) => {
                                        const vKg    = calcPesoKg(v.answers['peso']);
                                        const vImc   = calcIMC(v.answers['peso'], v.answers['estatura']);
                                        const vTipo  = v.visitType;
                                        const vBadge = vTipo ? (TIPO_BADGE[vTipo] ?? { bg: 'bg-gray-100 dark:bg-slate-800', text: 'text-gray-600 dark:text-slate-400' }) : null;
                                        const motivo = v.answers['motivo_visita'] as string | undefined;
                                        return (
                                            <button
                                                key={v.id}
                                                onClick={() => { setActiveVisit(v); setCenterView('consulta-detail'); }}
                                                className={`w-full text-left p-4 bg-card rounded-2xl border transition-all hover:border-medical-blue/30 hover:shadow-sm ${i === 0 ? 'border-medical-blue/20 dark:border-medical-blue/15' : 'border-bd'}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-medical-blue/10 flex items-center justify-center flex-shrink-0">
                                                        <FileText size={16} className="text-medical-blue" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                                                    {new Date(v.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                </span>
                                                                {i === 0 && <span className="text-[9px] font-bold bg-medical-blue text-white px-1.5 py-0.5 rounded-full uppercase">Más reciente</span>}
                                                            </div>
                                                            <ChevronRight size={14} className="text-gray-300 dark:text-slate-600 flex-shrink-0" />
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {vBadge && vTipo && (
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${vBadge.bg} ${vBadge.text}`}>
                                                                    {TIPO_SHORT[vTipo] ?? vTipo}
                                                                </span>
                                                            )}
                                                            {motivo && <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{motivo}</span>}
                                                            {vKg != null && <span className="text-[10px] text-gray-400 dark:text-slate-500">{vKg.toFixed(1)} kg</span>}
                                                            {vImc != null && <span className="text-[10px] text-gray-400 dark:text-slate-500">IMC {vImc.toFixed(1)}</span>}
                                                            {v.clinicalNote && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">Nota ✓</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Consulta detail ── */}
                        {centerView === 'consulta-detail' && activeVisit && id && (
                            <ConsultaDetailView
                                visit={visits.find(v => v.id === activeVisit.id) ?? activeVisit}
                                patientId={id}
                                onBack={() => setCenterView('consultas')}
                            />
                        )}
                    </div>
                )}

            </div>

            {/* ── Modals ── */}
            {showPrescForm && id && (
                <PrescriptionForm
                    patientId={id} patientName={patientV2.nombre} patientCedula={cedula || ''}
                    initialData={editPrescription ?? undefined}
                    onClose={() => { setShowPrescForm(false); setEditPrescription(null); }}
                    onSaved={() => { setShowPrescForm(false); setEditPrescription(null); }}
                />
            )}
            {showLicenseForm && id && (
                <MedicalLicenseForm
                    patientId={id} patientName={patientV2.nombre} patientCedula={cedula || ''}
                    initialData={editLicense ?? undefined}
                    onClose={() => { setShowLicenseForm(false); setEditLicense(null); }}
                    onSaved={() => { setShowLicenseForm(false); setEditLicense(null); }}
                />
            )}
        </div>
    );
}
