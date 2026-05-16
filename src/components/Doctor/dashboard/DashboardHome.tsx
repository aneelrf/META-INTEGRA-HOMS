import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../../../store/PatientContext';
import { auth } from '../../../firebase';
import {
    subscribeAppointmentsRange,
    type Appointment,
} from '../../../services/appointmentsService';
import {
    Users, Calendar, AlertTriangle, ChevronLeft, ChevronRight,
    Plus, Loader2, Bell, Clock, UserPlus,
} from 'lucide-react';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function localIso(d: Date): string { return d.toLocaleDateString('en-CA'); }

function getMondayOfWeek(d: Date): Date {
    const c = new Date(d);
    const day = c.getDay();
    c.setDate(c.getDate() - (day === 0 ? 6 : day - 1));
    c.setHours(0, 0, 0, 0);
    return c;
}

function shiftDays(d: Date, n: number): Date {
    const c = new Date(d);
    c.setDate(c.getDate() + n);
    return c;
}

const DAY_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const TYPE_HEX: Record<string, string> = {
    'Primera vez':                    '#4888C8',
    'Seguimiento 1er mes quirúrgico': '#14b8a6',
    'Seguimiento 2do mes quirúrgico': '#0d9488',
    'Seguimiento 4to mes quirúrgico': '#0f766e',
    'Seguimiento 1 año quirúrgico':   '#065f46',
    'Entrega de resultados':          '#ECC350',
    'Otro':                           '#94a3b8',
};

// ─── Small components ─────────────────────────────────────────────────────────

function InitialsAvatar({ name, cls = 'w-9 h-9 text-xs' }: { name: string; cls?: string }) {
    const parts = name.trim().split(/\s+/);
    const letters = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return (
        <div className={`${cls} rounded-full bg-medical-blue/15 flex items-center justify-center flex-shrink-0`}>
            <span className="font-bold text-medical-blue leading-none">{letters}</span>
        </div>
    );
}

function StatCard({ label, value, icon, accent }: {
    label: string; value: number | string; icon: ReactNode; accent: string;
}) {
    return (
        <div className="bg-card rounded-2xl p-5 border border-bd shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 leading-none">{value}</p>
                <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-1.5">{label}</p>
            </div>
        </div>
    );
}

// Mini SVG area chart for the last-7-days panel
function MiniTrendChart({ values }: { values: number[] }) {
    if (values.length < 2) return null;
    const W = 240, H = 72, px = 6, py = 8;
    const max = Math.max(...values, 1);
    const n = values.length;
    const x = (i: number) => px + (i / (n - 1)) * (W - px * 2);
    const y = (v: number) => py + (H - py * 2) * (1 - v / max);
    const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(n - 1).toFixed(1)},${H - py} L${x(0).toFixed(1)},${H - py} Z`;
    const lx = x(n - 1), ly = y(values[n - 1]);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            <defs>
                <linearGradient id="mg7d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4888C8" stopOpacity=".22" />
                    <stop offset="100%" stopColor="#4888C8" stopOpacity=".02" />
                </linearGradient>
            </defs>
            <path d={area} fill="url(#mg7d)" />
            <path d={line} fill="none" stroke="#4888C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={lx} cy={ly} r="4.5" fill="white" stroke="#4888C8" strokeWidth="2" />
            <circle cx={lx} cy={ly} r="2" fill="#4888C8" />
        </svg>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardHome() {
    const { patientsV2, loading } = usePatients();
    const navigate = useNavigate();
    const todayStr = localIso(new Date());

    const [weekStart,    setWeekStart]    = useState(() => getMondayOfWeek(new Date()));
    const [selectedDay,  setSelectedDay]  = useState(todayStr);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, i) => shiftDays(weekStart, i)),
        [weekStart],
    );

    useEffect(() => {
        const from = localIso(weekDays[0]);
        const to   = localIso(weekDays[6]);
        return subscribeAppointmentsRange(from, to, setAppointments);
    }, [weekStart]);

    const stats = useMemo(() => {
        const weekAgo = localIso(shiftDays(new Date(), -7));
        return {
            total:           patientsV2.length,
            today:           patientsV2.filter(p => p.lastVisitAt.startsWith(todayStr)).length,
            newPatientsWeek: patientsV2.filter(p => p.createdAt >= weekAgo && p.lastVisitType === 'Primera vez').length,
            withAlerts:      patientsV2.filter(p => p.hasAlertFlag).length,
            recentPatients:  patientsV2.slice(0, 5),
        };
    }, [patientsV2, todayStr]);

    const currentUser = auth.currentUser;
    const doctorLabel = currentUser?.displayName
        || currentUser?.email?.split('@')[0]
        || 'Doctor';

    // Patient counts for last 7 days
    const dailyCounts = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => {
            const d = localIso(shiftDays(new Date(), -(6 - i)));
            return patientsV2.filter(p => p.lastVisitAt.startsWith(d)).length;
        }),
        [patientsV2],
    );

    const selectedAppts = appointments.filter(a => a.date === selectedDay);

    const weekLabel = weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const goToPrev = () => {
        const nw = shiftDays(weekStart, -7);
        setWeekStart(nw);
        setSelectedDay(localIso(nw));
    };
    const goToNext = () => {
        const nw = shiftDays(weekStart, 7);
        setWeekStart(nw);
        setSelectedDay(localIso(nw));
    };
    const goToToday = () => {
        setWeekStart(getMondayOfWeek(new Date()));
        setSelectedDay(todayStr);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-primary" size={40} />
            </div>
        );
    }

    return (
        <>
        <div className="flex-1 flex overflow-hidden">

            {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">

                {/* Page header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50">Dashboard</h1>
                        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5 capitalize">
                            {new Date().toLocaleDateString('es-ES', {
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                {/* Welcome banner */}
                <div className="bg-gradient-to-br from-medical-blue to-brand-primary rounded-2xl overflow-hidden relative shadow-lg">
                    <div className="px-8 py-5 relative z-10">
                        <h2 className="text-white text-xl font-bold">Bienvenido/a, Dr. {doctorLabel}</h2>
                        <p className="text-white/60 text-sm mt-1">Que tengas un excelente día de trabajo</p>
                        <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                            {stats.today > 0 && (
                                <span className="bg-white/15 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {stats.today} paciente{stats.today !== 1 ? 's' : ''} hoy
                                </span>
                            )}
                            {selectedAppts.length > 0 && (
                                <span className="bg-gold/30 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {selectedAppts.length} cita{selectedAppts.length !== 1 ? 's' : ''} programada{selectedAppts.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none select-none">
                        <svg viewBox="0 0 200 100" className="w-full h-full">
                            <circle cx="170" cy="50" r="80" fill="rgba(255,255,255,0.05)" />
                            <circle cx="170" cy="50" r="52" fill="rgba(255,255,255,0.05)" />
                            <circle cx="170" cy="50" r="28" fill="rgba(255,255,255,0.07)" />
                        </svg>
                    </div>
                </div>

                {/* Stat cards */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-gray-800 dark:text-slate-200">Resumen</h2>
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">Este mes</span>
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                        <StatCard
                            label="Total pacientes"
                            value={stats.total}
                            icon={<Users size={20} className="text-medical-blue" />}
                            accent="bg-medical-blue/10"
                        />
                        <StatCard
                            label="Registrados hoy"
                            value={stats.today}
                            icon={<Calendar size={20} className="text-amber-600" />}
                            accent="bg-amber-50"
                        />
                        <StatCard
                            label="Nuevos esta semana"
                            value={stats.newPatientsWeek}
                            icon={<UserPlus size={20} className="text-green-600" />}
                            accent="bg-green-50"
                        />
                        <StatCard
                            label="Con alertas médicas"
                            value={stats.withAlerts}
                            icon={<AlertTriangle size={20} className="text-red-500" />}
                            accent="bg-red-50"
                        />
                    </div>
                </div>

                {/* Weekly agenda */}
                <div className="bg-card rounded-2xl border border-bd shadow-sm overflow-hidden">

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-bd flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="font-bold text-gray-800 dark:text-slate-200 capitalize">{weekLabel}</h2>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Agenda semanal</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={goToToday}
                                className="px-3 py-1.5 text-xs font-bold text-medical-blue bg-medical-blue/5 rounded-xl hover:bg-medical-blue/10 transition-colors"
                            >
                                Hoy
                            </button>
                            <button onClick={goToPrev} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                <ChevronLeft size={15} className="text-gray-500 dark:text-slate-400" />
                            </button>
                            <button onClick={goToNext} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                <ChevronRight size={15} className="text-gray-500 dark:text-slate-400" />
                            </button>
                            <button
                                onClick={() => navigate('/doctor/agenda')}
                                className="flex items-center gap-1.5 ml-1 px-3 py-1.5 bg-medical-blue text-white text-xs font-bold rounded-xl hover:bg-medical-blue/90 transition-colors"
                            >
                                <Plus size={12} /> Nueva cita
                            </button>
                        </div>
                    </div>

                    {/* Day columns */}
                    <div className="p-4">
                        <div className="grid grid-cols-7 gap-2">
                            {weekDays.map((day, i) => {
                                const ds = localIso(day);
                                const isToday = ds === todayStr;
                                const isSel   = ds === selectedDay;
                                const dayAppts = appointments.filter(a => a.date === ds);

                                return (
                                    <div
                                        key={ds}
                                        onClick={() => setSelectedDay(ds)}
                                        className={`flex flex-col rounded-2xl p-2.5 cursor-pointer transition-all min-h-[130px] border ${
                                            isSel
                                                ? 'border-medical-blue/30 bg-medical-blue/[0.04] shadow-sm'
                                                : 'border-transparent hover:border-bd2 hover:bg-white/5 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {/* Day header */}
                                        <div className="flex flex-col items-center gap-1 mb-2">
                                            <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                                                {DAY_ES[i]}
                                            </span>
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                                isToday
                                                    ? 'bg-medical-blue text-white'
                                                    : isSel
                                                    ? 'bg-medical-blue/15 text-medical-blue'
                                                    : 'text-gray-700 dark:text-slate-300'
                                            }`}>
                                                <span className="text-xs font-bold leading-none">{day.getDate()}</span>
                                            </div>
                                        </div>

                                        {/* Appointment bars */}
                                        <div className="flex flex-col gap-1 flex-1">
                                            {dayAppts.slice(0, 3).map(a => (
                                                <div
                                                    key={a.id}
                                                    className="rounded-lg px-1.5 py-1 text-[8px] font-semibold leading-tight text-white"
                                                    style={{ backgroundColor: TYPE_HEX[a.type] || '#4888C8' }}
                                                    title={`${a.time} · ${a.patientName} · ${a.type}`}
                                                >
                                                    <p className="truncate">{a.time} · {a.patientName.split(' ')[0]}</p>
                                                    <p className="truncate opacity-75">{a.type}</p>
                                                </div>
                                            ))}
                                            {dayAppts.length > 3 && (
                                                <span className="text-[8px] font-bold text-gray-400 dark:text-slate-500 text-center">
                                                    +{dayAppts.length - 3} más
                                                </span>
                                            )}
                                            {dayAppts.length === 0 && (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="w-5 h-5 rounded-full border border-dashed border-bd2 flex items-center justify-center">
                                                        <Plus size={9} className="text-gray-300 dark:text-slate-600" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected day appointment list */}
                    {selectedAppts.length > 0 && (
                        <div className="border-t border-bd px-5 pb-4">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest pt-4 pb-2">
                                Citas — {new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-ES', {
                                    weekday: 'long', day: 'numeric', month: 'long',
                                })}
                            </p>
                            <div className="space-y-1.5">
                                {selectedAppts.map(a => (
                                    <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                                        <div
                                            className="w-1 self-stretch rounded-full flex-shrink-0"
                                            style={{ backgroundColor: TYPE_HEX[a.type] || '#4888C8' }}
                                        />
                                        <div className="w-12 text-center flex-shrink-0">
                                            <p className="text-xs font-bold text-gray-900 dark:text-slate-50">{a.time}</p>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{a.patientName}</p>
                                            <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                                                {a.type}{a.notes ? ` · ${a.notes}` : ''}
                                            </p>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${
                                            a.status === 'confirmada' ? 'bg-blue-100 text-blue-600'
                                            : a.status === 'completada' ? 'bg-green-100 text-green-700'
                                            : a.status === 'cancelada'  ? 'bg-red-100 text-red-500'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {a.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty selected day */}
                    {selectedAppts.length === 0 && (
                        <div className="border-t border-bd px-5 py-5 text-center">
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                No hay citas para {new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-ES', {
                                    weekday: 'long', day: 'numeric', month: 'long',
                                })}
                            </p>
                            <button
                                onClick={() => navigate('/doctor/agenda')}
                                className="mt-2 text-xs text-medical-blue font-semibold hover:underline"
                            >
                                Agendar una cita
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════ RIGHT PANEL ═══════════════════ */}
            <div className="w-72 xl:w-80 flex-shrink-0 bg-card border-l border-bd flex flex-col overflow-y-auto">

                {/* Profile */}
                <div className="p-5 border-b border-bd">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Mi Perfil</h3>
                        <button className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <Bell size={14} className="text-gray-500 dark:text-slate-400" />
                        </button>
                    </div>
                    <div className="flex flex-col items-center gap-3 py-2">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-medical-blue to-brand-primary flex items-center justify-center shadow-md ring-4 ring-medical-blue/10">
                            <span className="text-white text-xl font-extrabold uppercase">
                                {(currentUser?.displayName || currentUser?.email || 'D')[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-900 dark:text-slate-50 capitalize">{doctorLabel}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Médico especialista</p>
                        </div>
                        <div className="flex gap-4 mt-1">
                            <div className="text-center">
                                <p className="font-extrabold text-gray-900 dark:text-slate-50 text-sm">{stats.total}</p>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500">Pacientes</p>
                            </div>
                            <div className="w-px bg-bd" />
                            <div className="text-center">
                                <p className="font-extrabold text-gray-900 dark:text-slate-50 text-sm">{appointments.length}</p>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500">Citas semana</p>
                            </div>
                            <div className="w-px bg-bd" />
                            <div className="text-center">
                                <p className="font-extrabold text-gray-900 dark:text-slate-50 text-sm">{stats.today}</p>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500">Hoy</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Last patients */}
                <div className="p-5 border-b border-bd">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Últimos pacientes</h3>
                        <button
                            onClick={() => navigate('/doctor/pacientes')}
                            className="text-[11px] text-medical-blue font-bold hover:underline"
                        >
                            Ver todos
                        </button>
                    </div>
                    {stats.recentPatients.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">Sin pacientes aún</p>
                    ) : (
                        <div className="space-y-0.5">
                            {stats.recentPatients.map(p => {
                                const fecha = new Date(p.lastVisitAt).toLocaleDateString('es-ES', {
                                    day: '2-digit', month: 'short',
                                });
                                const hora = new Date(p.lastVisitAt).toLocaleTimeString('es-ES', {
                                    hour: '2-digit', minute: '2-digit',
                                });
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => navigate(`/doctor/pacientes/${p.id}`)}
                                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                                    >
                                        <InitialsAvatar name={p.nombre} cls="w-9 h-9 text-xs" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate group-hover:text-medical-blue transition-colors">
                                                {p.nombre}
                                            </p>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                                <Clock size={9} /> {fecha} · {hora}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Patient trend chart */}
                <div className="p-5 flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Pacientes por día</h3>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-surface px-2 py-0.5 rounded-full">7 días</span>
                    </div>

                    <div className="bg-gradient-to-br from-medical-blue/5 to-medical-blue/[0.02] rounded-2xl p-4 border border-medical-blue/10">
                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <p className="text-3xl font-extrabold text-medical-blue leading-none">{stats.total}</p>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-1">Total pacientes</p>
                            </div>
                            {stats.today > 0 && (
                                <div className="text-right">
                                    <p className="text-lg font-extrabold text-gold leading-none">{stats.today}</p>
                                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">hoy</p>
                                </div>
                            )}
                        </div>

                        <MiniTrendChart values={dailyCounts} />

                        {/* Day labels */}
                        <div className="flex justify-between mt-1 px-1">
                            {Array.from({ length: 7 }, (_, i) => {
                                const d = shiftDays(new Date(), -(6 - i));
                                const isT = localIso(d) === todayStr;
                                return (
                                    <span
                                        key={i}
                                        className={`text-[9px] font-bold ${isT ? 'text-medical-blue' : 'text-gray-400 dark:text-slate-500'}`}
                                    >
                                        {d.toLocaleDateString('es-ES', { weekday: 'narrow' })}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        </>
    );
}
