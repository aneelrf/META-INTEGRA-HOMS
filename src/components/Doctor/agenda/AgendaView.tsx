import { useState, useEffect, useMemo } from 'react';
import { auth } from '../../../firebase';
import { usePatients } from '../../../store/PatientContext';
import {
    subscribeAppointmentsRange, addAppointment, updateAppointment, deleteAppointment,
    APPOINTMENT_TYPES, STATUS_LABELS, STATUS_COLORS, STATUS_CYCLE,
    type Appointment, type AppointmentStatus,
} from '../../../services/appointmentsService';
import {
    ChevronLeft, ChevronRight, Plus, X, Save, Loader2,
    Trash2, Clock, CheckCircle2, CalendarDays,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'dia' | 'semana' | 'mes';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_HEX: Record<string, string> = {
    'Primera vez':                    '#4888C8',
    'Seguimiento 1er mes quirúrgico': '#14b8a6',
    'Seguimiento 2do mes quirúrgico': '#0d9488',
    'Seguimiento 4to mes quirúrgico': '#0f766e',
    'Seguimiento 1 año quirúrgico':   '#065f46',
    'Entrega de resultados':          '#ECC350',
    'Otro':                           '#94a3b8',
};

const HOUR_START = 7;
const HOUR_END   = 20;
const ROW_H      = 56; // px per hour
const HOURS      = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const DAY_SHORT  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function localIso(d: Date): string { return d.toLocaleDateString('en-CA'); }

function getMondayOfWeek(d: Date): Date {
    const c = new Date(d);
    const day = c.getDay();
    c.setDate(c.getDate() - (day === 0 ? 6 : day - 1));
    c.setHours(0, 0, 0, 0);
    return c;
}

function addDays(d: Date, n: number): Date {
    const c = new Date(d);
    c.setDate(c.getDate() + n);
    return c;
}

function parseMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
}

function timeToY(t: string): number {
    const mins = Math.max(HOUR_START * 60, Math.min(HOUR_END * 60 - 1, parseMinutes(t)));
    return ((mins - HOUR_START * 60) / 60) * ROW_H;
}

function getMonthGrid(year: number, month: number): Date[] {
    const first  = new Date(year, month, 1);
    const last   = new Date(year, month + 1, 0);
    const pad    = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const days: Date[] = [];
    for (let i = pad; i > 0; i--)       days.push(new Date(year, month, 1 - i));
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    let ext = 1;
    while (days.length % 7 !== 0)        days.push(new Date(year, month + 1, ext++));
    return days;
}

// ─── Appointment form modal ───────────────────────────────────────────────────

function AppointmentFormModal({
    initialDate, initialTime = '08:00', onClose, onSaved, patients,
}: {
    initialDate: string;
    initialTime?: string;
    onClose:     () => void;
    onSaved:     () => void;
    patients:    { name: string; cedula: string }[];
}) {
    const [form, setForm] = useState({
        patientName: '', patientCedula: '',
        date: initialDate, time: initialTime,
        type: APPOINTMENT_TYPES[0], notes: '',
    });
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<typeof patients>([]);

    const field = (key: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(p => ({ ...p, [key]: e.target.value }));

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setForm(p => ({ ...p, patientName: val }));
        setSuggestions(val.length >= 2
            ? patients.filter(p =>
                p.name.toLowerCase().includes(val.toLowerCase()) || p.cedula.includes(val)
            ).slice(0, 5)
            : []);
    };

    const submit = async () => {
        if (!form.patientName.trim() || !form.date || !form.time) {
            setError('Nombre, fecha y hora son obligatorios.'); return;
        }
        setSaving(true); setError(null);
        try {
            await addAppointment({
                patientId:     '',
                patientName:   form.patientName.trim(),
                patientCedula: form.patientCedula.trim(),
                date:          form.date,
                time:          form.time,
                type:          form.type,
                status:        'pendiente',
                notes:         form.notes.trim(),
                doctorUid:     auth.currentUser?.uid || '',
                createdAt:     new Date().toISOString(),
            });
            onSaved();
        } catch {
            setError('Error al guardar. Intente de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-bd flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-slate-50">Nueva cita</h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    {/* Patient autocomplete */}
                    <div className="relative">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Paciente *</label>
                        <input type="text" value={form.patientName} onChange={handleNameChange}
                            placeholder="Buscar por nombre o cédula..."
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                        {suggestions.length > 0 && (
                            <div className="absolute z-10 w-full bg-card border border-bd2 rounded-xl shadow-lg mt-1 overflow-hidden">
                                {suggestions.map(s => (
                                    <button key={s.cedula || s.name}
                                        onClick={() => { setForm(f => ({ ...f, patientName: s.name, patientCedula: s.cedula })); setSuggestions([]); }}
                                        className="w-full px-4 py-2.5 text-left hover:bg-brand-primary/5">
                                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{s.name}</p>
                                        {s.cedula && <p className="text-xs text-gray-400 dark:text-slate-500">{s.cedula}</p>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Cédula / Pasaporte</label>
                        <input type="text" value={form.patientCedula} onChange={field('patientCedula')} placeholder="Opcional"
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Fecha *</label>
                            <input type="date" value={form.date} onChange={field('date')}
                                className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Hora *</label>
                            <input type="time" value={form.time} onChange={field('time')}
                                className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Tipo</label>
                        <select value={form.type} onChange={field('type')}
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
                            {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Notas</label>
                        <textarea value={form.notes} onChange={field('notes')}
                            placeholder="Motivo de la cita, indicaciones previas..." rows={3}
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" />
                    </div>

                    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                </div>

                <div className="px-6 py-4 border-t border-bd flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl">Cancelar</button>
                    <button onClick={submit} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-60 text-white text-sm font-semibold rounded-xl">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        Guardar cita
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Appointment detail popover ───────────────────────────────────────────────

function ApptPopover({ appt, cedulaWithForm, onClose, onStatusCycle, onDelete }: {
    appt:           Appointment;
    cedulaWithForm: Set<string>;
    onClose:        () => void;
    onStatusCycle:  () => void;
    onDelete:       () => void;
}) {
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/20" />
            <div
                className="relative bg-card rounded-2xl shadow-xl w-80 p-5 flex flex-col gap-3"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-slate-50">{appt.patientName}</p>
                        {appt.patientCedula && <p className="text-xs text-gray-400 dark:text-slate-500">{appt.patientCedula}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 flex-shrink-0"><X size={16} /></button>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                    <Clock size={13} className="flex-shrink-0" />
                    <span>{new Date(appt.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} · {appt.time}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: (TYPE_HEX[appt.type] || '#94a3b8') + '20', color: TYPE_HEX[appt.type] || '#94a3b8' }}
                    >
                        {appt.type}
                    </span>
                    {appt.patientCedula && cedulaWithForm.has(appt.patientCedula) && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 size={12} /> Formulario completado
                        </span>
                    )}
                </div>

                {appt.notes && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 bg-surface rounded-xl p-2.5 leading-relaxed">{appt.notes}</p>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-bd">
                    <button
                        onClick={onStatusCycle}
                        className={`flex-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all hover:opacity-80 ${STATUS_COLORS[appt.status]}`}
                    >
                        {STATUS_LABELS[appt.status]} →
                    </button>
                    <button onClick={onDelete} className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Time grid (shared by Day and Week views) ─────────────────────────────────

function TimeGrid({ days, appointments, today, cedulaWithForm, onSlotClick, onApptClick }: {
    days:           Date[];
    appointments:   Appointment[];
    today:          string;
    cedulaWithForm: Set<string>;
    onSlotClick:    (date: string, time: string) => void;
    onApptClick:    (appt: Appointment) => void;
}) {
    const now    = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const nowY   = (nowMin >= HOUR_START * 60 && nowMin <= HOUR_END * 60)
        ? ((nowMin - HOUR_START * 60) / 60) * ROW_H
        : null;

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Column headers — sticky */}
            <div className="flex flex-shrink-0 border-b border-bd2 bg-card">
                <div className="w-14 flex-shrink-0" />
                {days.map((day, i) => {
                    const ds  = localIso(day);
                    const isT = ds === today;
                    return (
                        <div
                            key={ds}
                            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 ${i > 0 ? 'border-l border-bd' : ''}`}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isT ? 'text-medical-blue' : 'text-gray-400 dark:text-slate-500'}`}>
                                {DAY_SHORT[(day.getDay() + 6) % 7]}
                            </span>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isT ? 'bg-medical-blue text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                                <span className="text-sm font-bold leading-none">{day.getDate()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex" style={{ height: HOURS.length * ROW_H }}>

                    {/* Time labels */}
                    <div className="w-14 flex-shrink-0 relative border-r border-bd" style={{ height: HOURS.length * ROW_H }}>
                        {HOURS.map((h, i) => (
                            <div
                                key={h}
                                className="absolute right-2 flex items-center"
                                style={{ top: i * ROW_H - 7, height: 14 }}
                            >
                                <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">{h}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {days.map((day, di) => {
                        const ds       = localIso(day);
                        const isT      = ds === today;
                        const dayAppts = appointments.filter(a => a.date === ds);

                        return (
                            <div
                                key={ds}
                                className={`flex-1 relative ${di > 0 ? 'border-l border-bd' : ''} ${isT ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}
                                style={{ height: HOURS.length * ROW_H }}
                            >
                                {/* Hour slot lines (clickable) */}
                                {HOURS.map((h, i) => (
                                    <div
                                        key={h}
                                        className="absolute w-full border-b border-bd hover:bg-medical-blue/5 cursor-pointer transition-colors"
                                        style={{ top: i * ROW_H, height: ROW_H }}
                                        onClick={() => onSlotClick(ds, `${h.toString().padStart(2, '0')}:00`)}
                                    />
                                ))}

                                {/* Appointments */}
                                {dayAppts.map(a => {
                                    const top     = timeToY(a.time);
                                    const hasForm = !!a.patientCedula && cedulaWithForm.has(a.patientCedula);
                                    return (
                                        <div
                                            key={a.id}
                                            className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-0.5 text-white text-[11px] font-semibold cursor-pointer overflow-hidden shadow-sm hover:brightness-110 transition-all"
                                            style={{
                                                top:             top + 1,
                                                minHeight:       26,
                                                backgroundColor: TYPE_HEX[a.type] || '#4888C8',
                                                zIndex:          10,
                                            }}
                                            onClick={e => { e.stopPropagation(); onApptClick(a); }}
                                        >
                                            <span className="truncate leading-tight flex items-center gap-1">
                                                {a.time} {a.patientName.split(' ')[0]}
                                                {hasForm && <CheckCircle2 size={9} className="opacity-70 flex-shrink-0" />}
                                            </span>
                                        </div>
                                    );
                                })}

                                {/* Current-time indicator */}
                                {isT && nowY !== null && (
                                    <div
                                        className="absolute left-0 right-0 flex items-center pointer-events-none"
                                        style={{ top: nowY, zIndex: 20 }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 -ml-1" />
                                        <div className="flex-1 h-px bg-red-400" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView({ year, month, appointments, today, onDayClick }: {
    year:         number;
    month:        number;
    appointments: Appointment[];
    today:        string;
    onDayClick:   (date: string) => void;
}) {
    const days  = getMonthGrid(year, month);
    const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, (i + 1) * 7));

    return (
        <div className="flex-1 flex flex-col overflow-auto p-3">
            {/* Day-name header row */}
            <div className="grid grid-cols-7 mb-1 flex-shrink-0">
                {DAY_SHORT.map(d => (
                    <div key={d} className="text-center py-2">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{d}</span>
                    </div>
                ))}
            </div>

            {/* Weeks */}
            <div className="flex-1 flex flex-col gap-0.5">
                {weeks.map((week, wi) => (
                    <div key={wi} className="flex-1 grid grid-cols-7 gap-0.5 min-h-[80px]">
                        {week.map(day => {
                            const ds             = localIso(day);
                            const isT            = ds === today;
                            const isCurMonth     = day.getMonth() === month;
                            const dayAppts       = appointments.filter(a => a.date === ds);
                            return (
                                <div
                                    key={ds}
                                    onClick={() => onDayClick(ds)}
                                    className={`rounded-xl p-2 cursor-pointer transition-all border ${
                                        isT
                                            ? 'border-medical-blue/40 bg-medical-blue/5'
                                            : 'border-transparent hover:border-bd2 hover:bg-gray-50 dark:hover:bg-white/5'
                                    } ${!isCurMonth ? 'opacity-35' : ''}`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${isT ? 'bg-medical-blue text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                                        <span className="text-xs font-bold leading-none">{day.getDate()}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {dayAppts.slice(0, 2).map(a => (
                                            <div
                                                key={a.id}
                                                className="rounded px-1 py-0.5 text-[9px] font-semibold truncate text-white leading-tight"
                                                style={{ backgroundColor: TYPE_HEX[a.type] || '#4888C8' }}
                                            >
                                                {a.time} {a.patientName.split(' ')[0]}
                                            </div>
                                        ))}
                                        {dayAppts.length > 2 && (
                                            <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold">+{dayAppts.length - 2}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main AgendaView ──────────────────────────────────────────────────────────

export default function AgendaView() {
    const { patientsV2 } = usePatients();
    const today = localIso(new Date());

    const [viewMode,      setViewMode]      = useState<ViewMode>('semana');
    const [currentDate,   setCurrentDate]   = useState(() => new Date());
    const [appointments,  setAppointments]  = useState<Appointment[]>([]);
    const [sideAppts,     setSideAppts]     = useState<Appointment[]>([]);
    const [showForm,      setShowForm]      = useState(false);
    const [formDate,      setFormDate]      = useState(today);
    const [formTime,      setFormTime]      = useState('08:00');
    const [selectedAppt,  setSelectedAppt]  = useState<Appointment | null>(null);

    const weekStart = useMemo(() => getMondayOfWeek(currentDate), [currentDate]);
    const weekDays  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    // Main subscription — recalculates range from viewMode + currentDate
    useEffect(() => {
        let from: string, to: string;
        if (viewMode === 'dia') {
            from = to = localIso(currentDate);
        } else if (viewMode === 'semana') {
            from = localIso(getMondayOfWeek(currentDate));
            to   = localIso(addDays(getMondayOfWeek(currentDate), 6));
        } else {
            const grid = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth());
            from = localIso(grid[0]);
            to   = localIso(grid[grid.length - 1]);
        }
        return subscribeAppointmentsRange(from, to, setAppointments);
    }, [viewMode, currentDate]);

    // Sidebar: next 7 days (one-time subscription — refreshed on mount)
    useEffect(() => {
        const from = today;
        const to   = localIso(addDays(new Date(), 7));
        return subscribeAppointmentsRange(from, to, setSideAppts);
    }, []);

    const patientSuggestions = useMemo(() =>
        patientsV2
            .filter(p => p.nombre)
            .map(p => ({ name: p.nombre, cedula: p.cedula_pasaporte })),
        [patientsV2],
    );

    const cedulaWithForm = useMemo(
        () => new Set<string>(patientsV2.map(p => p.cedula_pasaporte).filter(Boolean)),
        [patientsV2],
    );

    // Navigation: step by 1 day / 1 week / 1 month depending on view
    const step = (dir: 1 | -1) => {
        setCurrentDate(d => {
            const c = new Date(d);
            if      (viewMode === 'dia')    c.setDate(c.getDate() + dir);
            else if (viewMode === 'semana') c.setDate(c.getDate() + dir * 7);
            else                            c.setMonth(c.getMonth() + dir);
            return c;
        });
    };

    const goToToday = () => setCurrentDate(new Date());

    // Header label
    const dateLabel = (() => {
        if (viewMode === 'dia') {
            return currentDate.toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            });
        }
        if (viewMode === 'semana') {
            const from = weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const to   = weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            return `${from} – ${to}`;
        }
        return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    })();

    const openNewAppt = (date: string, time = '08:00') => {
        setFormDate(date);
        setFormTime(time);
        setShowForm(true);
    };

    const handleStatusCycle = async (appt: Appointment) => {
        const next: AppointmentStatus = STATUS_CYCLE[appt.status];
        await updateAppointment(appt.id, { status: next });
        setSelectedAppt(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta cita?')) {
            await deleteAppointment(id);
            setSelectedAppt(null);
        }
    };

    const upcomingAppts = [...sideAppts]
        .filter(a => a.status !== 'cancelada')
        .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.time.localeCompare(b.time));

    const followUps = upcomingAppts.filter(a => a.type.startsWith('Seguimiento'));

    return (
        <div className="flex-1 flex overflow-hidden">

            {/* ════════════════════ MAIN AREA ════════════════════ */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Header */}
                <div className="flex-shrink-0 px-6 py-3.5 border-b border-bd2 bg-card flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-extrabold text-gray-900 dark:text-slate-50">Agenda</h1>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => step(-1)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-bd2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={() => step(1)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-bd2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <ChevronRight size={15} />
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-400 border border-bd2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ml-0.5"
                        >
                            Hoy
                        </button>
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-2 capitalize whitespace-nowrap">
                            {dateLabel}
                        </span>
                    </div>

                    <div className="flex-1" />

                    {/* View toggle */}
                    <div className="flex items-center bg-gray-100 dark:bg-[#1e2640] rounded-xl p-1 gap-0.5">
                        {(['dia', 'semana', 'mes'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setViewMode(m)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    viewMode === m
                                        ? 'bg-card text-gray-900 dark:text-slate-50 shadow-sm'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                                }`}
                            >
                                {m === 'dia' ? 'Día' : m === 'semana' ? 'Semana' : 'Mes'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => openNewAppt(today)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-medical-blue text-white text-sm font-bold rounded-xl hover:bg-medical-blue/90 transition-colors shadow-sm"
                    >
                        <Plus size={14} /> Nueva cita
                    </button>
                </div>

                {/* Calendar body */}
                {viewMode !== 'mes' ? (
                    <TimeGrid
                        days={viewMode === 'dia' ? [currentDate] : weekDays}
                        appointments={appointments}
                        today={today}
                        cedulaWithForm={cedulaWithForm}
                        onSlotClick={openNewAppt}
                        onApptClick={setSelectedAppt}
                    />
                ) : (
                    <MonthView
                        year={currentDate.getFullYear()}
                        month={currentDate.getMonth()}
                        appointments={appointments}
                        today={today}
                        onDayClick={ds => {
                            setCurrentDate(new Date(ds + 'T00:00:00'));
                            setViewMode('dia');
                        }}
                    />
                )}
            </div>

            {/* ════════════════════ RIGHT SIDEBAR ════════════════════ */}
            <div className="w-64 flex-shrink-0 bg-card border-l border-bd2 flex flex-col overflow-y-auto">

                {/* Follow-ups next 7 days */}
                <div className="p-4 border-b border-bd">
                    <div className="flex items-center gap-2 mb-3">
                        <CalendarDays size={14} className="text-amber-500" />
                        <h3 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Próximos seguimientos</h3>
                    </div>
                    {followUps.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-5">Sin seguimientos pendientes.</p>
                    ) : (
                        <div className="space-y-2">
                            {followUps.map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => setSelectedAppt(a)}
                                    className="w-full flex items-start gap-2 p-2.5 rounded-xl bg-surface hover:bg-teal-50 dark:hover:bg-teal-950/20 border border-transparent hover:border-teal-100 dark:hover:border-teal-900/40 text-left transition-colors"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-teal-500" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{a.patientName}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                            {new Date(a.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                                weekday: 'short', day: 'numeric', month: 'short',
                                            })} · {a.time}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* All upcoming appointments */}
                <div className="p-4 flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Próximas citas</h3>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-surface px-2 py-0.5 rounded-full">
                            {upcomingAppts.length}
                        </span>
                    </div>
                    {upcomingAppts.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-5">Sin citas próximas.</p>
                    ) : (
                        <div className="space-y-1">
                            {upcomingAppts.slice(0, 10).map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => setSelectedAppt(a)}
                                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-colors group"
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            backgroundColor: (TYPE_HEX[a.type] || '#94a3b8') + '20',
                                            color: TYPE_HEX[a.type] || '#94a3b8',
                                        }}
                                    >
                                        <Clock size={13} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate group-hover:text-medical-blue transition-colors">
                                            {a.patientName}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                                            {new Date(a.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                                day: 'numeric', month: 'short',
                                            })} · {a.time} · {a.type}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showForm && (
                <AppointmentFormModal
                    initialDate={formDate}
                    initialTime={formTime}
                    patients={patientSuggestions}
                    onClose={() => setShowForm(false)}
                    onSaved={() => setShowForm(false)}
                />
            )}

            {selectedAppt && (
                <ApptPopover
                    appt={selectedAppt}
                    cedulaWithForm={cedulaWithForm}
                    onClose={() => setSelectedAppt(null)}
                    onStatusCycle={() => handleStatusCycle(selectedAppt)}
                    onDelete={() => handleDelete(selectedAppt.id)}
                />
            )}
        </div>
    );
}
