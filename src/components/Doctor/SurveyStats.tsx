import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, BarChart2, XCircle, Filter, Star, ThumbsUp, Users } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import * as XLSX from 'xlsx';

interface Survey {
    id: string; cedula: string; nombre: string;
    tipoConsulta: string; motivoVisita: string; motivoVisitaEncuesta: string;
    facilidadCita: number; amabilidadPersonal: number; tratoMedico: number;
    comodidadEspera: number; informacionOrientacion: number; puntualidad: number;
    publicidadInstitucional: number; experienciaGeneral: number;
    recomendaria: string; calificacionGeneral: string; createdAt: string;
}

const SCALE_FIELDS: { key: keyof Survey; label: string }[] = [
    { key: 'facilidadCita',           label: 'Facilidad para obtener una cita' },
    { key: 'amabilidadPersonal',      label: 'Amabilidad del personal al recibirlo' },
    { key: 'tratoMedico',             label: 'Trato del personal médico' },
    { key: 'comodidadEspera',         label: 'Comodidad de las áreas de espera' },
    { key: 'informacionOrientacion',  label: 'Información y orientación recibida' },
    { key: 'puntualidad',             label: 'Puntualidad en la atención' },
    { key: 'publicidadInstitucional', label: 'Publicidad e información institucional' },
    { key: 'experienciaGeneral',      label: 'Experiencia general en Meta Integra' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function DonutChart({ segments, total, centerLabel }: {
    segments: { label: string; count: number; color: string }[];
    total: number;
    centerLabel?: string;
}) {
    const R = 38;
    const cx = 54;
    const cy = 54;
    const sw = 13;
    const circ = 2 * Math.PI * R;

    let cumulative = 0;
    const renderedSegments = segments.map(seg => {
        const len = total > 0 ? circ * (seg.count / total) : 0;
        const offset = circ / 4 - cumulative;
        cumulative += len;
        return { ...seg, dasharray: `${len} ${circ - len}`, dashoffset: offset };
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Donut SVG */}
            <svg viewBox="0 0 108 108" style={{ width: '108px', height: '108px', flexShrink: 0 }} aria-hidden="true">
                {/* Background circle */}
                <circle
                    cx={cx} cy={cy} r={R}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth={sw}
                />
                {/* Segments */}
                {renderedSegments.map((seg, i) => (
                    <circle
                        key={i}
                        cx={cx} cy={cy} r={R}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={sw}
                        strokeDasharray={seg.dasharray}
                        strokeDashoffset={seg.dashoffset}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                ))}
                {/* Center text */}
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1F2937">
                    {total}
                </text>
                {centerLabel && (
                    <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="#94A3B8">
                        {centerLabel}
                    </text>
                )}
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                {segments.map((seg, i) => {
                    const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: seg.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: '#1F2937', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {seg.label}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1F2937', flexShrink: 0 }}>{seg.count}</span>
                            <span style={{ fontSize: '10px', color: '#64748B', flexShrink: 0 }}>{pct}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function KpiCard({ label, value, sub, icon, accent }: {
    label: string; value: string | number; sub?: string;
    icon: React.ReactNode; accent: string; textAccent: string;
}) {
    return (
        <div className={`bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 hover:shadow-md transition-all duration-200`}>
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0 mt-0.5">
                    <p className="text-3xl font-extrabold leading-none text-[#1F2937]">{value}</p>
                    {sub && <p className="text-xs text-[#64748B] mt-1">{sub}</p>}
                    <p className="text-xs font-medium text-[#64748B] mt-1.5">{label}</p>
                </div>
            </div>
        </div>
    );
}

function SectionCard({ title, icon, accent, children }: {
    title: string; icon: React.ReactNode; accent: string; children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
                    {icon}
                </div>
                <h3 className="font-semibold text-[#1F2937] text-sm">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color?: string }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-[#1F2937] font-medium truncate">{label}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold text-[#1F2937]">{count}</span>
                    <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">{pct}%</span>
                </div>
            </div>
            <div className="w-full bg-[#F1F5F9] rounded-full h-2">
                <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ backgroundColor: color || '#0074B7', width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function ScoreBar({ label, avg }: { label: string; avg: number }) {
    const pct = (avg / 5) * 100;
    const hexColor = avg >= 4.5 ? '#22C55E' : avg >= 3.5 ? '#0074B7' : avg >= 2.5 ? '#FACC15' : '#EF4444';
    const badgeBorder = avg >= 4.5 ? '#22C55E' : avg >= 3.5 ? '#0074B7' : avg >= 2.5 ? '#FACC15' : '#EF4444';
    const badgeText  = avg >= 4.5 ? '#16A34A' : avg >= 3.5 ? '#0074B7' : avg >= 2.5 ? '#B45309' : '#DC2626';
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-[#1F2937] flex-1 min-w-0 leading-tight">{label}</span>
            <div className="w-32 bg-[#F1F5F9] rounded-full h-2 flex-shrink-0">
                <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ backgroundColor: hexColor, width: `${pct}%` }}
                />
            </div>
            <span
                className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 min-w-[44px] text-center bg-white"
                style={{ border: `1.5px solid ${badgeBorder}`, color: badgeText }}
            >
                {avg.toFixed(1)}
            </span>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SurveyStats({ onClose, isPage }: { onClose: () => void; isPage?: boolean }) {
    const [surveys,      setSurveys]      = useState<Survey[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [dateFrom,     setDateFrom]     = useState('');
    const [dateTo,       setDateTo]       = useState('');
    const [motivoFilter, setMotivoFilter] = useState('');
    const [tipoFilter,   setTipoFilter]   = useState('');

    useEffect(() => {
        const q = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => {
            setSurveys(snap.docs.map(d => ({ id: d.id, ...d.data() } as Survey)));
            setLoading(false);
        }, () => setLoading(false));
    }, []);

    const tipoOptions = useMemo(() => Array.from(new Set(surveys.map(s => s.tipoConsulta).filter(Boolean))), [surveys]);

    const filtered = useMemo(() => surveys.filter(s => {
        if (dateFrom) { const f = new Date(dateFrom); f.setHours(0,0,0,0); if (new Date(s.createdAt) < f) return false; }
        if (dateTo)   { const t = new Date(dateTo); t.setHours(23,59,59,999); if (new Date(s.createdAt) > t) return false; }
        if (motivoFilter && s.motivoVisitaEncuesta !== motivoFilter) return false;
        if (tipoFilter   && s.tipoConsulta         !== tipoFilter)   return false;
        return true;
    }), [surveys, dateFrom, dateTo, motivoFilter, tipoFilter]);

    const stats = useMemo(() => {
        if (filtered.length === 0) return null;
        const total = filtered.length;
        const avg   = (key: keyof Survey) => {
            const vals = filtered.map(s => s[key]).filter((v): v is number => typeof v === 'number');
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        };
        const cnt = (key: keyof Survey, val: string) => filtered.filter(s => s[key] === val).length;
        const fieldAvgs        = SCALE_FIELDS.map(f => ({ label: f.label, avg: avg(f.key) }));
        const promedioGeneral  = fieldAvgs.reduce((s, f) => s + f.avg, 0) / fieldAvgs.length;
        const recomiendaSi     = cnt('recomendaria', 'Sí');
        const recomiendaPct    = total > 0 ? Math.round((recomiendaSi / total) * 100) : 0;
        return {
            total, promedioGeneral, fieldAvgs, recomiendaSi, recomiendaPct,
            byMotivo:    ['Cirugía general','Cirugía bariátrica','Servicios Meta Integra','Otros'].map(m => ({ label: m, count: cnt('motivoVisitaEncuesta', m) })),
            recomendaria:['Sí','No','Tal vez'].map(r => ({ label: r, count: cnt('recomendaria', r) })),
            calificacion:['Excelente','Buena','Regular','Mala'].map(c => ({ label: c, count: cnt('calificacionGeneral', c) })),
            byTipo:      tipoOptions.map(t => ({ label: t, count: filtered.filter(s => s.tipoConsulta === t).length })).filter(r => r.count > 0),
        };
    }, [filtered, tipoOptions]);

    const exportToExcel = () => {
        const rows = filtered.map(s => ({
            'Fecha': new Date(s.createdAt).toLocaleString('es-ES'),
            'Nombre': s.nombre, 'Cédula': s.cedula,
            'Tipo de consulta': s.tipoConsulta,
            'Motivo (formulario)': s.motivoVisita, 'Motivo (encuesta)': s.motivoVisitaEncuesta,
            'Facilidad cita (1-5)': s.facilidadCita, 'Amabilidad personal (1-5)': s.amabilidadPersonal,
            'Trato médico (1-5)': s.tratoMedico, 'Comodidad espera (1-5)': s.comodidadEspera,
            'Info y orientación (1-5)': s.informacionOrientacion, 'Puntualidad (1-5)': s.puntualidad,
            'Publicidad (1-5)': s.publicidadInstitucional, 'Experiencia general (1-5)': s.experienciaGeneral,
            '¿Recomendaría?': s.recomendaria, 'Calificación': s.calificacionGeneral,
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'Sin datos': 'No hay encuestas' }]), 'Respuestas');
        if (stats) {
            const summary = [
                { Indicador: 'Total encuestas', Valor: stats.total },
                { Indicador: 'Promedio general', Valor: stats.promedioGeneral.toFixed(2) },
                { Indicador: '', Valor: '' },
                ...stats.fieldAvgs.map(f => ({ Indicador: f.label, Valor: f.avg.toFixed(2) })),
                { Indicador: '', Valor: '' },
                ...stats.byMotivo.map(m => ({ Indicador: m.label, Valor: m.count })),
                { Indicador: '', Valor: '' },
                ...stats.recomendaria.map(r => ({ Indicador: r.label, Valor: r.count })),
                { Indicador: '', Valor: '' },
                ...stats.calificacion.map(c => ({ Indicador: c.label, Valor: c.count })),
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Resumen');
        }
        XLSX.writeFile(wb, 'estadisticas_encuestas_meta_integra.xlsx');
    };

    const hasFilters  = !!(dateFrom || dateTo || motivoFilter || tipoFilter);
    const clearFilters = () => { setDateFrom(''); setDateTo(''); setMotivoFilter(''); setTipoFilter(''); };

    const scoreColor = (v: number) =>
        v >= 4 ? 'text-emerald-600 dark:text-emerald-400' : v >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500';

    // Dynamic color helpers for KPI card icon/accent based on score
    const avgAccent = stats
        ? stats.promedioGeneral >= 4 ? 'bg-emerald-50' : stats.promedioGeneral >= 3 ? 'bg-[#BFD7ED]' : 'bg-red-50'
        : 'bg-[#BFD7ED]';

    const recomendaBarColor = (label: string) => {
        if (label === 'Sí')      return '#22C55E';
        if (label === 'No')      return '#EF4444';
        return '#FACC15';
    };

    const content = (
        <div className="flex flex-col flex-1 overflow-hidden bg-app-bg">

            {/* Header */}
            <div className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#BFD7ED] flex items-center justify-center">
                        <BarChart2 size={18} style={{ color: '#0074B7' }} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[#1F2937]">Estadísticas de Encuestas</h2>
                        {!loading && (
                            <p className="text-xs text-[#64748B] mt-0.5">
                                {filtered.length} {filtered.length === 1 ? 'encuesta' : 'encuestas'}{hasFilters ? ' filtradas' : ''}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportToExcel}
                        disabled={filtered.length === 0}
                        className="flex items-center gap-1.5 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                        style={{ backgroundColor: '#0074B7' }}
                    >
                        <Download size={14} /> Exportar Excel
                    </button>
                    {!isPage && (
                        <button
                            onClick={onClose}
                            className="text-[#64748B] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter bar */}
            <div className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex flex-wrap gap-3 items-end flex-shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] uppercase tracking-wider self-end pb-0.5">
                    <Filter size={11} /> Filtros
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Desde</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0074B7]/20"
                    />
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Hasta</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0074B7]/20"
                    />
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Motivo de visita</label>
                    <select
                        value={motivoFilter}
                        onChange={e => setMotivoFilter(e.target.value)}
                        className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0074B7]/20"
                    >
                        <option value="">Todos</option>
                        {['Cirugía general','Cirugía bariátrica','Servicios Meta Integra','Otros'].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                {tipoOptions.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Tipo de consulta</label>
                        <select
                            value={tipoFilter}
                            onChange={e => setTipoFilter(e.target.value)}
                            className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0074B7]/20"
                        >
                            <option value="">Todos</option>
                            {tipoOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                )}
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold self-end pb-0.5 transition-colors"
                    >
                        <XCircle size={12} /> Limpiar
                    </button>
                )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-24 gap-4"
                        >
                            <Loader2 className="animate-spin" size={36} style={{ color: '#0074B7' }} />
                            <p className="text-[#64748B] animate-pulse text-sm">Cargando encuestas...</p>
                        </motion.div>
                    ) : filtered.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-24 gap-4 text-[#64748B]"
                        >
                            <BarChart2 size={48} strokeWidth={1} />
                            <p className="text-sm font-medium text-center">
                                No hay encuestas{hasFilters ? ' para los filtros seleccionados' : ' registradas'}.
                            </p>
                        </motion.div>
                    ) : stats ? (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <div className="p-6 max-w-5xl mx-auto space-y-6">

                                {/* Row 1: 3 KPI cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <KpiCard
                                        label="Encuestas respondidas"
                                        value={stats.total}
                                        accent="bg-[#BFD7ED]"
                                        textAccent="text-[#0074B7]"
                                        icon={<BarChart2 size={20} style={{ color: '#0074B7' }} />}
                                    />
                                    <KpiCard
                                        label="Promedio general de satisfacción"
                                        value={`${stats.promedioGeneral.toFixed(1)} / 5`}
                                        sub={
                                            stats.promedioGeneral >= 4.5 ? 'Excelente'
                                            : stats.promedioGeneral >= 3.5 ? 'Muy bueno'
                                            : stats.promedioGeneral >= 2.5 ? 'Regular'
                                            : 'Necesita mejora'
                                        }
                                        accent={avgAccent}
                                        textAccent={scoreColor(stats.promedioGeneral)}
                                        icon={
                                            <Star
                                                size={20}
                                                className={scoreColor(stats.promedioGeneral)}
                                            />
                                        }
                                    />
                                    <KpiCard
                                        label="Recomendarían Meta Integra"
                                        value={`${stats.recomiendaSi} (${stats.recomiendaPct}%)`}
                                        sub="respondieron Sí"
                                        accent="bg-emerald-50"
                                        textAccent="text-emerald-700"
                                        icon={<ThumbsUp size={20} className="text-emerald-600" />}
                                    />
                                </div>

                                {/* Row 2: Score bars — full width */}
                                <SectionCard
                                    title="Promedio por criterio (escala 1–5)"
                                    icon={<Star size={15} className="text-amber-500" />}
                                    accent="bg-amber-50"
                                >
                                    <div className="space-y-4">
                                        {stats.fieldAvgs.map(({ label, avg }) => (
                                            <ScoreBar key={label} label={label} avg={avg} />
                                        ))}
                                    </div>
                                </SectionCard>

                                {/* Row 3: Calificación donut + Recomendación bars side by side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SectionCard
                                        title="Calificación general"
                                        icon={<Star size={15} style={{ color: '#0074B7' }} />}
                                        accent="bg-[#BFD7ED]"
                                    >
                                        <DonutChart
                                            segments={[
                                                { label: 'Excelente', count: stats.calificacion[0].count, color: '#22C55E' },
                                                { label: 'Buena',     count: stats.calificacion[1].count, color: '#0074B7' },
                                                { label: 'Regular',   count: stats.calificacion[2].count, color: '#FACC15' },
                                                { label: 'Mala',      count: stats.calificacion[3].count, color: '#EF4444' },
                                            ]}
                                            total={stats.total}
                                            centerLabel="encuestas"
                                        />
                                    </SectionCard>

                                    <SectionCard
                                        title="¿Recomendaría Meta Integra?"
                                        icon={<ThumbsUp size={15} className="text-emerald-600" />}
                                        accent="bg-emerald-50"
                                    >
                                        <div className="space-y-4">
                                            {stats.recomendaria.map(({ label, count }) => (
                                                <BarRow
                                                    key={label}
                                                    label={label}
                                                    count={count}
                                                    total={stats.total}
                                                    color={recomendaBarColor(label)}
                                                />
                                            ))}
                                        </div>
                                    </SectionCard>
                                </div>

                                {/* Row 4: Motivo + Tipo side by side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SectionCard
                                        title="Motivo de visita"
                                        icon={<BarChart2 size={15} style={{ color: '#0074B7' }} />}
                                        accent="bg-[#BFD7ED]"
                                    >
                                        <div className="space-y-4">
                                            {stats.byMotivo.map(({ label, count }) => (
                                                <BarRow key={label} label={label} count={count} total={stats.total} />
                                            ))}
                                        </div>
                                    </SectionCard>

                                    {stats.byTipo.length > 0 && (
                                        <SectionCard
                                            title="Por tipo de consulta"
                                            icon={<Users size={15} style={{ color: '#60A3D9' }} />}
                                            accent="bg-[#E0F2FE]"
                                        >
                                            <div className="space-y-4">
                                                {stats.byTipo.map(({ label, count }) => (
                                                    <BarRow key={label} label={label} count={count} total={stats.total} color="#60A3D9" />
                                                ))}
                                            </div>
                                        </SectionCard>
                                    )}
                                </div>

                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );

    if (isPage) return content;

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 16 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="w-full max-w-5xl max-h-[92vh]"
            >
                {content}
            </motion.div>
        </motion.div>
    );
}
