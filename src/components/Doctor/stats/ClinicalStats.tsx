import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';
import { usePatients } from '../../../store/PatientContext';
import { calcIMC, calcPesoKg } from '../../../services/patientsService';
import type { PatientVisit } from '../../../services/patientServiceV2';
import {
    Activity, AlertTriangle, Loader2,
    TrendingUp, Users, Download, User, Calendar, HeartPulse, Globe, Share2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Normalización a español ──────────────────────────────────────────────────

const MOTIVO_TO_ES: Record<string, string> = {
    'Cirugía Metabólica':    'Cirugía Metabólica',
    'Cirugía General':       'Cirugía General',
    'Metabolic Surgery':     'Cirugía Metabólica',
    'General Surgery':       'Cirugía General',
    'Chirurgie Métabolique': 'Cirugía Metabólica',
    'Chirurgie Générale':    'Cirugía General',
    'Metabolische Chirurgie':'Cirugía Metabólica',
    'Allgemeinchirurgie':    'Cirugía General',
};

const TIPO_TO_ES: Record<string, string> = {
    // tipo_consulta_metabolica
    'Primera vez':                           'Primera vez',
    'Seguimiento 1er mes quirúrgico':        'Seguimiento 1er mes quirúrgico',
    'Seguimiento 2do mes quirúrgico':        'Seguimiento 2do mes quirúrgico',
    'Seguimiento 4to mes quirúrgico':        'Seguimiento 4to mes quirúrgico',
    'Seguimiento 1 año quirúrgico':          'Seguimiento 1 año quirúrgico',
    'First visit':                           'Primera vez',
    '1st surgical month follow-up':         'Seguimiento 1er mes quirúrgico',
    '2nd surgical month follow-up':         'Seguimiento 2do mes quirúrgico',
    '4th surgical month follow-up':         'Seguimiento 4to mes quirúrgico',
    '1-year surgical follow-up':            'Seguimiento 1 año quirúrgico',
    'Première consultation':                 'Primera vez',
    'Suivi 1er mois chirurgical':            'Seguimiento 1er mes quirúrgico',
    'Suivi 2ème mois chirurgical':           'Seguimiento 2do mes quirúrgico',
    'Suivi 4ème mois chirurgical':           'Seguimiento 4to mes quirúrgico',
    'Suivi 1 an chirurgical':                'Seguimiento 1 año quirúrgico',
    'Erstbesuch':                            'Primera vez',
    'Nachsorge 1. Monat nach OP':           'Seguimiento 1er mes quirúrgico',
    'Nachsorge 2. Monat nach OP':           'Seguimiento 2do mes quirúrgico',
    'Nachsorge 4. Monat nach OP':           'Seguimiento 4to mes quirúrgico',
    'Nachsorge 1 Jahr nach OP':             'Seguimiento 1 año quirúrgico',
    // tipo_cirugia_general
    'Hernia Hiatal':       'Hernia Hiatal',
    'Vesícula':            'Vesícula',
    'Acalasia':            'Acalasia',
    'Cirugía Oncológica':  'Cirugía Oncológica',
    'Otras':               'Otras',
    'Hiatal Hernia':       'Hernia Hiatal',
    'Gallbladder':         'Vesícula',
    'Achalasia':           'Acalasia',
    'Oncological Surgery': 'Cirugía Oncológica',
    'Others':              'Otras',
    'Hernie hiatale':      'Hernia Hiatal',
    'Vésicule biliaire':   'Vesícula',
    'Achalasie':           'Acalasia',
    'Chirurgie oncologique':'Cirugía Oncológica',
    'Autres':              'Otras',
    'Hiatushernie':        'Hernia Hiatal',
    'Gallenblase':         'Vesícula',
    'Onkologische Chirurgie':'Cirugía Oncológica',
    'Andere':              'Otras',
};

const CAPTACION_TO_ES: Record<string, string> = {
    // ES
    'Página web':              'Página web',
    'Familia o amigos':        'Familia o amigos',
    'Publicidad en los medios':'Publicidad en los medios',
    'Redes sociales':          'Redes sociales',
    'Otro':                    'Otro',
    // EN
    'Website':                 'Página web',
    'Family or friends':       'Familia o amigos',
    'Media advertising':       'Publicidad en los medios',
    'Social networks':         'Redes sociales',
    'Other':                   'Otro',
    // FR
    'Site web':                'Página web',
    'Famille ou amis':         'Familia o amigos',
    'Publicité dans les médias':'Publicidad en los medios',
    'Réseaux sociaux':         'Redes sociales',
    'Autre':                   'Otro',
    // DE
    'Webseite':                'Página web',
    'Familie oder Freunde':    'Familia o amigos',
    'Medienwerbung':           'Publicidad en los medios',
    'Soziale Netzwerke':       'Redes sociales',
    'Andere':                  'Otro',
};

function normMotivo(raw: string): string {
    return MOTIVO_TO_ES[raw.trim()] ?? raw.trim();
}

function normTipo(raw: string): string {
    return TIPO_TO_ES[raw.trim()] ?? raw.trim();
}

function normCaptacion(raw: string): string {
    return CAPTACION_TO_ES[raw.trim()] ?? raw.trim();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isYes(val: unknown): boolean {
    return typeof val === 'string' && ['sí', 'si', 'yes', 'oui', 'ja'].includes(val.toLowerCase());
}

function countByKey(items: string[]): { label: string; count: number }[] {
    const map: Record<string, number> = {};
    items.forEach(k => { map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
}

function topFromFreeText(texts: string[], limit = 10): { label: string; count: number }[] {
    const map: Record<string, number> = {};
    texts.forEach(text => {
        text.split(/[,;\/\n\-·]+/)
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 2)
            .forEach(term => { map[term] = (map[term] || 0) + 1; });
    });
    return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label, count]) => ({
            label: label.charAt(0).toUpperCase() + label.slice(1),
            count,
        }));
}

function getMonthlyTrend(visits: PatientVisit[]) {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        return {
            label: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
            count: visits.filter(v => {
                const vd = new Date(v.createdAt);
                return vd.getFullYear() === d.getFullYear() && vd.getMonth() === d.getMonth();
            }).length,
        };
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: {
    label: string; value: string | number; icon: React.ReactNode; color: string;
}) {
    return (
        <div className="bg-card rounded-2xl border border-bd shadow-sm p-5 flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
            <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{value}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

function SectionCard({ title, icon, children }: {
    title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <div className="bg-card rounded-2xl border border-bd shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-bd flex items-center gap-2.5">
                <div className="text-brand-primary">{icon}</div>
                <h3 className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function BarRow({ label, count, total, color = 'bg-brand-primary' }: {
    label: string; count: number; total: number; color?: string;
}) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600 dark:text-slate-400 font-medium truncate pr-2">{label}</span>
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 flex-shrink-0">{count}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-[#1e2640] rounded-full h-1.5 mb-0.5">
                <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">{pct}%</p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClinicalStats() {
    const { patientsV2, loading: patientsLoading } = usePatients();
    const [visits,        setVisits]        = useState<PatientVisit[]>([]);
    const [visitsLoading, setVisitsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'patient_visits'), orderBy('createdAt', 'desc'));
        return onSnapshot(
            q,
            snap => {
                setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() } as PatientVisit)));
                setVisitsLoading(false);
            },
            () => setVisitsLoading(false),
        );
    }, []);

    const isLoading = patientsLoading || visitsLoading;

    const stats = useMemo(() => {
        const total       = patientsV2.length;
        const totalVisits = visits.length;
        if (!total && !totalVisits) return null;

        // Monthly trend
        const monthly    = getMonthlyTrend(visits);
        const maxMonthly = Math.max(...monthly.map(m => m.count), 1);

        // Motivo (normalizado a español)
        const byMotivo = countByKey(
            visits.map(v => normMotivo(v.motivoVisita || '')).filter(Boolean),
        );

        // Tipo de consulta (normalizado a español)
        const byTipo = countByKey(
            visits.map(v => normTipo(v.visitType || '')).filter(Boolean),
        );

        // IMC
        const imcValues = visits
            .map(v => calcIMC(v.answers['peso'], v.answers['estatura']))
            .filter((v): v is number => v !== null && v > 10 && v < 100);
        const avgIMC = imcValues.length
            ? imcValues.reduce((a, b) => a + b, 0) / imcValues.length
            : null;
        const imcBuckets = [
            { label: 'Bajo peso (<18.5)',     count: imcValues.filter(v => v < 18.5).length,            color: 'bg-blue-400' },
            { label: 'Normal (18.5–24.9)',    count: imcValues.filter(v => v >= 18.5 && v < 25).length, color: 'bg-green-400' },
            { label: 'Sobrepeso (25–29.9)',   count: imcValues.filter(v => v >= 25 && v < 30).length,   color: 'bg-yellow-400' },
            { label: 'Obesidad I (30–34.9)',  count: imcValues.filter(v => v >= 30 && v < 35).length,   color: 'bg-orange-400' },
            { label: 'Obesidad II (35–39.9)', count: imcValues.filter(v => v >= 35 && v < 40).length,   color: 'bg-red-400' },
            { label: 'Obesidad III (≥40)',    count: imcValues.filter(v => v >= 40).length,              color: 'bg-red-700' },
        ];

        const weights = visits
            .map(v => calcPesoKg(v.answers['peso']))
            .filter((w): w is number => w !== null && w > 0);
        const avgPeso = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : null;

        const ages = visits
            .map(v => Number(v.answers['edad']))
            .filter(a => !isNaN(a) && a > 0 && a < 120);
        const avgEdad = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null;

        // Top enfermedades (from enfermedades_spec free text)
        const enfSpecs = visits
            .filter(v => isYes(v.answers['enfermedades']))
            .map(v => String(v.answers['enfermedades_spec'] || ''))
            .filter(Boolean);
        const topEnfermedades = topFromFreeText(enfSpecs, 10);
        const totalConEnfermedad = visits.filter(v => isYes(v.answers['enfermedades'])).length;

        // Alertas para tarjeta resumen
        const withAlerts = patientsV2.filter(p => p.hasAlertFlag).length;

        // Por sexo
        const bySex = countByKey(
            patientsV2.map(p => p.sexo || '').filter(Boolean),
        );

        // Por nacionalidad (top 8)
        const byNacionalidad = countByKey(
            visits.map(v => String(v.answers['nacionalidad'] || '')).filter(Boolean),
        ).slice(0, 8);

        // Por día de la semana
        const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const byDow = DOW.map((label, i) => ({
            label,
            count: visits.filter(v => new Date(v.createdAt).getDay() === i).length,
        }));
        const maxDow = Math.max(...byDow.map(d => d.count), 1);

        // ¿Cómo nos conociste?
        const byCaptacion = countByKey(
            visits
                .map(v => normCaptacion(String(v.answers['captacion'] || '').trim()))
                .filter(Boolean),
        );

        return {
            total, totalVisits, withAlerts,
            avgIMC, avgPeso, avgEdad,
            monthly, maxMonthly,
            byMotivo, byTipo,
            imcBuckets, imcTotal: imcValues.length,
            topEnfermedades, totalConEnfermedad,
            bySex, byNacionalidad,
            byDow, maxDow,
            byCaptacion,
        };
    }, [patientsV2, visits]);

    const exportToExcel = () => {
        if (!stats) return;
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb,
            XLSX.utils.json_to_sheet(stats.monthly.map(m => ({ Mes: m.label, Visitas: m.count }))),
            'Tendencia mensual',
        );

        const summary = [
            { Indicador: 'Total pacientes',  Valor: stats.total },
            { Indicador: 'Total visitas',    Valor: stats.totalVisits },
            { Indicador: 'Con alertas',      Valor: stats.withAlerts },
            { Indicador: 'IMC promedio',     Valor: stats.avgIMC?.toFixed(1) ?? 'N/A' },
            { Indicador: 'Peso promedio',    Valor: stats.avgPeso ? `${stats.avgPeso.toFixed(1)} kg` : 'N/A' },
            { Indicador: 'Edad promedio',    Valor: stats.avgEdad ? `${stats.avgEdad.toFixed(0)} años` : 'N/A' },
            { Indicador: '', Valor: '' },
            { Indicador: '─ Por motivo ─', Valor: '' },
            ...stats.byMotivo.map(m => ({ Indicador: m.label, Valor: m.count })),
            { Indicador: '', Valor: '' },
            { Indicador: '─ Por tipo ─', Valor: '' },
            ...stats.byTipo.map(t => ({ Indicador: t.label, Valor: t.count })),
            { Indicador: '', Valor: '' },
            { Indicador: '─ Distribución de IMC ─', Valor: '' },
            ...stats.imcBuckets.map(b => ({ Indicador: b.label, Valor: b.count })),
            { Indicador: '', Valor: '' },
            { Indicador: '─ Top enfermedades ─', Valor: '' },
            ...stats.topEnfermedades.map(e => ({ Indicador: e.label, Valor: e.count })),
            { Indicador: '', Valor: '' },
            { Indicador: '─ Por sexo ─', Valor: '' },
            ...stats.bySex.map(s => ({ Indicador: s.label, Valor: s.count })),
            { Indicador: '', Valor: '' },
            { Indicador: '─ Por nacionalidad ─', Valor: '' },
            ...stats.byNacionalidad.map(n => ({ Indicador: n.label, Valor: n.count })),
            { Indicador: '', Valor: '' },
            { Indicador: '─ ¿Cómo nos conociste? ─', Valor: '' },
            ...stats.byCaptacion.map(c => ({ Indicador: c.label, Valor: c.count })),
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Resumen clínico');
        XLSX.writeFile(wb, 'estadisticas_clinicas_meta_integra.xlsx');
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-primary" size={36} />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-slate-500">
                <Activity size={40} strokeWidth={1} />
                <p className="text-sm">Sin datos registrados todavía</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Estadísticas Clínicas</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                            {stats.total} pacientes · {stats.totalVisits} visitas registradas
                        </p>
                    </div>
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                        <Download size={15} /> Exportar Excel
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total pacientes"    value={stats.total}
                        color="bg-blue-50"   icon={<Users size={18} className="text-blue-600" />} />
                    <StatCard label="Total visitas"      value={stats.totalVisits}
                        color="bg-indigo-50" icon={<Activity size={18} className="text-indigo-600" />} />
                    <StatCard label="Con alertas médicas" value={stats.withAlerts}
                        color="bg-red-50"   icon={<AlertTriangle size={18} className="text-red-500" />} />
                    <StatCard
                        label="IMC promedio"
                        value={stats.avgIMC ? stats.avgIMC.toFixed(1) : '—'}
                        color="bg-green-50"
                        icon={<TrendingUp size={18} className="text-green-600" />}
                    />
                </div>

                {/* Monthly trend */}
                <SectionCard title="Tendencia mensual de visitas" icon={<TrendingUp size={17} />}>
                    <div className="flex items-end gap-1.5 h-28">
                        {stats.monthly.map(m => {
                            const pct = Math.round((m.count / stats.maxMonthly) * 100);
                            return (
                                <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {m.count}
                                    </span>
                                    <div className="w-full relative flex items-end" style={{ height: '80px' }}>
                                        <div
                                            className="w-full bg-brand-primary/80 rounded-t-md hover:bg-brand-primary transition-colors cursor-default"
                                            style={{ height: `${Math.max(pct, m.count > 0 ? 4 : 0)}%` }}
                                            title={`${m.label}: ${m.count}`}
                                        />
                                    </div>
                                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">{m.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>

                {/* Motivo + Tipo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Por motivo de consulta" icon={<Activity size={17} />}>
                        <div className="space-y-4">
                            {stats.byMotivo.length > 0
                                ? stats.byMotivo.map(m => (
                                    <BarRow key={m.label} label={m.label} count={m.count} total={stats.totalVisits} />
                                ))
                                : <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Sin datos</p>
                            }
                        </div>
                    </SectionCard>

                    <SectionCard title="Por tipo de consulta" icon={<Users size={17} />}>
                        <div className="space-y-4">
                            {stats.byTipo.length > 0
                                ? stats.byTipo.map(t => (
                                    <BarRow key={t.label} label={t.label} count={t.count} total={stats.totalVisits} />
                                ))
                                : <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Sin datos</p>
                            }
                        </div>
                    </SectionCard>
                </div>

                {/* IMC */}
                <SectionCard
                    title={`Distribución de IMC (${stats.imcTotal} visitas con datos)`}
                    icon={<TrendingUp size={17} />}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.imcBuckets.map(b => (
                            <BarRow key={b.label} label={b.label} count={b.count} total={stats.imcTotal || 1} color={b.color} />
                        ))}
                    </div>
                    <div className="flex gap-6 mt-4 pt-3 border-t border-bd">
                        {stats.avgPeso && (
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Peso promedio: <strong className="text-gray-800 dark:text-slate-200">{stats.avgPeso.toFixed(1)} kg</strong>
                            </p>
                        )}
                        {stats.avgEdad && (
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Edad promedio: <strong className="text-gray-800 dark:text-slate-200">{stats.avgEdad.toFixed(0)} años</strong>
                            </p>
                        )}
                    </div>
                </SectionCard>

                {/* Top enfermedades */}
                <SectionCard
                    title={`Top enfermedades reportadas (${stats.totalConEnfermedad} pacientes con antecedentes)`}
                    icon={<HeartPulse size={17} />}
                >
                    {stats.topEnfermedades.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.topEnfermedades.map(e => (
                                <BarRow key={e.label} label={e.label} count={e.count} total={stats.totalConEnfermedad || 1} color="bg-red-400" />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Sin datos de enfermedades especificadas</p>
                    )}
                </SectionCard>

                {/* Sexo + Nacionalidad */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Por sexo" icon={<User size={17} />}>
                        <div className="space-y-4">
                            {stats.bySex.length > 0
                                ? stats.bySex.map(s => (
                                    <BarRow key={s.label} label={s.label} count={s.count} total={stats.total} color="bg-indigo-400" />
                                ))
                                : <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Sin datos</p>
                            }
                        </div>
                    </SectionCard>

                    {stats.byNacionalidad.length > 0 ? (
                        <SectionCard title="Por nacionalidad (top 8)" icon={<Globe size={17} />}>
                            <div className="space-y-4">
                                {stats.byNacionalidad.map(n => (
                                    <BarRow key={n.label} label={n.label} count={n.count} total={stats.totalVisits} color="bg-cyan-400" />
                                ))}
                            </div>
                        </SectionCard>
                    ) : (
                        <SectionCard title="Por nacionalidad" icon={<Globe size={17} />}>
                            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Sin datos de nacionalidad</p>
                        </SectionCard>
                    )}
                </div>

                {/* ¿Cómo nos conociste? */}
                <SectionCard title="¿Cómo nos conociste?" icon={<Share2 size={17} />}>
                    <div className="space-y-4">
                        {stats.byCaptacion.length > 0
                            ? stats.byCaptacion.map(c => (
                                <BarRow key={c.label} label={c.label} count={c.count} total={stats.byCaptacion.reduce((s, x) => s + x.count, 0)} color="bg-violet-400" />
                            ))
                            : <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Sin datos de captación</p>
                        }
                    </div>
                </SectionCard>

                {/* Actividad por día */}
                <SectionCard title="Actividad por día de la semana" icon={<Calendar size={17} />}>
                    <div className="flex items-end gap-2 h-24">
                        {stats.byDow.map(d => {
                            const pct = Math.round((d.count / stats.maxDow) * 100);
                            return (
                                <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {d.count}
                                    </span>
                                    <div className="w-full flex items-end" style={{ height: '52px' }}>
                                        <div
                                            className="w-full bg-brand-primary/70 rounded-t-md hover:bg-brand-primary transition-colors"
                                            style={{ height: `${Math.max(pct, d.count > 0 ? 6 : 0)}%` }}
                                            title={`${d.label}: ${d.count}`}
                                        />
                                    </div>
                                    <span className="text-[10px] text-gray-600 dark:text-slate-400 font-semibold">{d.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>

            </div>
        </div>
    );
}
