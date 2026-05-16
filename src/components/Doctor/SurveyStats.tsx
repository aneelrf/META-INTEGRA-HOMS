import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, BarChart2, XCircle, Filter } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import * as XLSX from 'xlsx';

interface Survey {
    id: string;
    cedula: string;
    nombre: string;
    tipoConsulta: string;
    motivoVisita: string;
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
    createdAt: string;
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

function avgBadgeClass(v: number): string {
    if (v >= 4.5) return 'text-green-700 bg-green-100';
    if (v >= 3.5) return 'text-blue-700 bg-blue-100';
    if (v >= 2.5) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
}

function BarRow({ label, count, total }: { label: string; count: number; total: number }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 min-w-[150px] flex-shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5 min-w-0">
                <div
                    className="h-2.5 rounded-full bg-brand-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap w-24 text-right">
                {count} ({pct}%)
            </span>
        </div>
    );
}

export default function SurveyStats({ onClose, isPage }: { onClose: () => void; isPage?: boolean }) {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [motivoFilter, setMotivoFilter] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            const surveys: Survey[] = [];
            snap.docs.forEach(d => {
                const raw = d.data();
                if (raw.answers?._isSurvey === true) {
                    surveys.push({ id: d.id, createdAt: raw.createdAt, ...raw.answers } as Survey);
                }
            });
            setSurveys(surveys);
            setLoading(false);
        }, (error) => {
            console.error('[SurveyStats] Error loading surveys:', error);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const tipoOptions = useMemo(() => {
        return Array.from(new Set(surveys.map(s => s.tipoConsulta).filter(Boolean)));
    }, [surveys]);

    const filtered = useMemo(() => {
        return surveys.filter(s => {
            if (dateFrom) {
                const from = new Date(dateFrom);
                from.setHours(0, 0, 0, 0);
                if (new Date(s.createdAt) < from) return false;
            }
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (new Date(s.createdAt) > to) return false;
            }
            if (motivoFilter && s.motivoVisitaEncuesta !== motivoFilter) return false;
            if (tipoFilter && s.tipoConsulta !== tipoFilter) return false;
            return true;
        });
    }, [surveys, dateFrom, dateTo, motivoFilter, tipoFilter]);

    const stats = useMemo(() => {
        if (filtered.length === 0) return null;
        const total = filtered.length;

        const avg = (key: keyof Survey): number => {
            const vals = filtered.map(s => s[key]).filter((v): v is number => typeof v === 'number');
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        };
        const countBy = (key: keyof Survey, val: string) => filtered.filter(s => s[key] === val).length;

        const fieldAvgs = SCALE_FIELDS.map(f => ({ label: f.label, avg: avg(f.key) }));
        const promedioGeneral = fieldAvgs.reduce((s, f) => s + f.avg, 0) / fieldAvgs.length;

        return {
            total,
            promedioGeneral,
            fieldAvgs,
            byMotivo: ['Cirugía general', 'Cirugía bariátrica', 'Servicios Meta Integra', 'Otros'].map(m => ({
                label: m, count: countBy('motivoVisitaEncuesta', m),
            })),
            recomendaria: ['Sí', 'No', 'Tal vez'].map(r => ({
                label: r, count: countBy('recomendaria', r),
            })),
            calificacion: ['Excelente', 'Buena', 'Regular', 'Mala'].map(c => ({
                label: c, count: countBy('calificacionGeneral', c),
            })),
            byTipo: tipoOptions
                .map(t => ({ label: t, count: filtered.filter(s => s.tipoConsulta === t).length }))
                .filter(r => r.count > 0),
        };
    }, [filtered, tipoOptions]);

    const exportToExcel = () => {
        const rows = filtered.map(s => ({
            'Fecha': new Date(s.createdAt).toLocaleString('es-ES'),
            'Nombre': s.nombre,
            'Cédula': s.cedula,
            'Tipo de consulta': s.tipoConsulta,
            'Motivo visita (formulario)': s.motivoVisita,
            'Motivo visita (encuesta)': s.motivoVisitaEncuesta,
            'Facilidad para obtener cita (1-5)': s.facilidadCita,
            'Amabilidad del personal (1-5)': s.amabilidadPersonal,
            'Trato del personal médico (1-5)': s.tratoMedico,
            'Comodidad áreas de espera (1-5)': s.comodidadEspera,
            'Información y orientación (1-5)': s.informacionOrientacion,
            'Puntualidad en la atención (1-5)': s.puntualidad,
            'Publicidad institucional (1-5)': s.publicidadInstitucional,
            'Experiencia general (1-5)': s.experienciaGeneral,
            '¿Recomendaría Meta Integra?': s.recomendaria,
            'Calificación general': s.calificacionGeneral,
        }));

        const wb = XLSX.utils.book_new();
        const ws1 = XLSX.utils.json_to_sheet(
            rows.length ? rows : [{ 'Sin datos': 'No hay encuestas para los filtros seleccionados' }]
        );
        XLSX.utils.book_append_sheet(wb, ws1, 'Respuestas');

        if (stats) {
            const summary: Record<string, string | number>[] = [
                { Indicador: 'Total de encuestas', Valor: stats.total },
                { Indicador: 'Promedio general de satisfacción', Valor: stats.promedioGeneral.toFixed(2) },
                { Indicador: '', Valor: '' },
                { Indicador: '— PROMEDIOS POR PREGUNTA —', Valor: '' },
                ...stats.fieldAvgs.map(f => ({ Indicador: f.label, Valor: f.avg.toFixed(2) })),
                { Indicador: '', Valor: '' },
                { Indicador: '— MOTIVO DE VISITA —', Valor: '', Porcentaje: '' },
                ...stats.byMotivo.map(m => ({
                    Indicador: m.label, Valor: m.count,
                    Porcentaje: `${stats.total > 0 ? Math.round((m.count / stats.total) * 100) : 0}%`,
                })),
                { Indicador: '', Valor: '', Porcentaje: '' },
                { Indicador: '— ¿RECOMENDARÍA META INTEGRA? —', Valor: '', Porcentaje: '' },
                ...stats.recomendaria.map(r => ({
                    Indicador: r.label, Valor: r.count,
                    Porcentaje: `${stats.total > 0 ? Math.round((r.count / stats.total) * 100) : 0}%`,
                })),
                { Indicador: '', Valor: '', Porcentaje: '' },
                { Indicador: '— CALIFICACIÓN GENERAL —', Valor: '', Porcentaje: '' },
                ...stats.calificacion.map(c => ({
                    Indicador: c.label, Valor: c.count,
                    Porcentaje: `${stats.total > 0 ? Math.round((c.count / stats.total) * 100) : 0}%`,
                })),
            ];
            const ws2 = XLSX.utils.json_to_sheet(summary);
            XLSX.utils.book_append_sheet(wb, ws2, 'Resumen');
        }

        XLSX.writeFile(wb, 'estadisticas_encuestas_meta_integra.xlsx');
    };

    const hasFilters = dateFrom || dateTo || motivoFilter || tipoFilter;
    const clearFilters = () => { setDateFrom(''); setDateTo(''); setMotivoFilter(''); setTipoFilter(''); };

    const inner = (
        <div className={isPage ? 'flex flex-col flex-1 overflow-hidden' : 'bg-[#f4f7fb] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden'}>
                {/* Header */}
                <div className="bg-white px-8 py-5 border-b border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <BarChart2 size={22} className="text-brand-primary" />
                        <h2 className="text-xl font-bold text-gray-900">Estadísticas de Encuestas</h2>
                        {!loading && (
                            <span className="text-sm text-gray-400 font-medium">
                                ({filtered.length} {filtered.length === 1 ? 'encuesta' : 'encuestas'}{hasFilters ? ' filtradas' : ''})
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToExcel}
                            disabled={filtered.length === 0}
                            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
                        >
                            <Download size={16} /> Exportar a Excel
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white border-b border-gray-100 px-8 py-4 flex flex-wrap gap-4 items-end flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-widest self-end pb-1.5">
                        <Filter size={11} /> Filtros
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Desde</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Hasta</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Motivo de visita</label>
                        <select value={motivoFilter} onChange={e => setMotivoFilter(e.target.value)}
                            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
                            <option value="">Todos</option>
                            {['Cirugía general', 'Cirugía bariátrica', 'Servicios Meta Integra', 'Otros'].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    {tipoOptions.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Tipo de consulta</label>
                            <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
                                className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
                                <option value="">Todos</option>
                                {tipoOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    )}
                    {hasFilters && (
                        <button onClick={clearFilters}
                            className="self-end flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold uppercase pb-1.5 transition-colors">
                            <XCircle size={12} /> Limpiar
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-24 gap-4">
                                <Loader2 className="animate-spin text-brand-primary" size={36} />
                                <p className="text-gray-400 animate-pulse">Cargando encuestas...</p>
                            </motion.div>
                        ) : filtered.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                                <BarChart2 size={48} strokeWidth={1} />
                                <p className="text-lg font-medium text-center">
                                    No hay encuestas registradas{hasFilters ? ' para los filtros seleccionados' : ''}.
                                </p>
                            </motion.div>
                        ) : stats ? (
                            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="space-y-6">

                                {/* Summary cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                                        <p className="text-4xl font-bold text-brand-primary">{stats.total}</p>
                                        <p className="text-sm text-gray-500 mt-1 font-medium">Encuestas respondidas</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                                        <p className={`text-4xl font-bold ${stats.promedioGeneral >= 4 ? 'text-green-600' : stats.promedioGeneral >= 3 ? 'text-blue-600' : 'text-red-600'}`}>
                                            {stats.promedioGeneral.toFixed(1)}
                                            <span className="text-lg text-gray-400 font-normal"> /5</span>
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1 font-medium">Promedio general</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                                        <p className="text-4xl font-bold text-green-600">
                                            {stats.recomendaria.find(r => r.label === 'Sí')?.count ?? 0}
                                            <span className="text-lg text-gray-400 font-normal"> / {stats.total}</span>
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1 font-medium">Recomendarían Meta Integra</p>
                                    </div>
                                </div>

                                {/* Scale averages */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-800">Promedio por pregunta</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {stats.fieldAvgs.map(({ label, avg }) => (
                                            <div key={label} className="flex items-center gap-4">
                                                <span className="text-sm text-gray-600 flex-1 min-w-0">{label}</span>
                                                <div className="w-32 bg-gray-100 rounded-full h-2 flex-shrink-0">
                                                    <div
                                                        className="h-2 rounded-full bg-brand-primary transition-all duration-500"
                                                        style={{ width: `${(avg / 5) * 100}%` }}
                                                    />
                                                </div>
                                                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${avgBadgeClass(avg)}`}>
                                                    {avg.toFixed(1)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommendation + General rating */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <h3 className="font-semibold text-gray-800">¿Recomendaría Meta Integra?</h3>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            {stats.recomendaria.map(({ label, count }) => (
                                                <BarRow key={label} label={label} count={count} total={stats.total} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <h3 className="font-semibold text-gray-800">Calificación general</h3>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            {stats.calificacion.map(({ label, count }) => (
                                                <BarRow key={label} label={label} count={count} total={stats.total} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Motivo de visita */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-800">Motivo de visita</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {stats.byMotivo.map(({ label, count }) => (
                                            <BarRow key={label} label={label} count={count} total={stats.total} />
                                        ))}
                                    </div>
                                </div>

                                {/* Tipo de consulta */}
                                {stats.byTipo.length > 0 && (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <h3 className="font-semibold text-gray-800">Por tipo de consulta</h3>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            {stats.byTipo.map(({ label, count }) => (
                                                <BarRow key={label} label={label} count={count} total={stats.total} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
        </div>
    );

    if (isPage) return inner;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 16 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="w-full max-w-5xl max-h-[92vh]"
            >
                {inner}
            </motion.div>
        </motion.div>
    );
}
