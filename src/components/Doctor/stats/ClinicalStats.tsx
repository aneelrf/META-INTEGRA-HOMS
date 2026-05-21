import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';
import { usePatients } from '../../../store/PatientContext';
import { calcIMC, calcPesoKg } from '../../../services/patientsService';
import type { PatientVisit } from '../../../services/patientServiceV2';
import {
    Activity, AlertTriangle, Loader2, TrendingUp, Users, Download,
    User, Calendar, HeartPulse, Globe, Share2, Filter, X,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Normalización ─────────────────────────────────────────────────────────────

const MOTIVO_TO_ES: Record<string, string> = {
    'Cirugía Metabólica': 'Cirugía Metabólica', 'Cirugía General': 'Cirugía General',
    'Metabolic Surgery': 'Cirugía Metabólica', 'General Surgery': 'Cirugía General',
    'Chirurgie Métabolique': 'Cirugía Metabólica', 'Chirurgie Générale': 'Cirugía General',
    'Metabolische Chirurgie': 'Cirugía Metabólica', 'Allgemeinchirurgie': 'Cirugía General',
};

const TIPO_TO_ES: Record<string, string> = {
    'Primera vez': 'Primera vez', 'Seguimiento 1er mes quirúrgico': 'Seguimiento 1er mes quirúrgico',
    'Seguimiento 2do mes quirúrgico': 'Seguimiento 2do mes quirúrgico',
    'Seguimiento 4to mes quirúrgico': 'Seguimiento 4to mes quirúrgico',
    'Seguimiento 1 año quirúrgico': 'Seguimiento 1 año quirúrgico',
    'First visit': 'Primera vez', '1st surgical month follow-up': 'Seguimiento 1er mes quirúrgico',
    '2nd surgical month follow-up': 'Seguimiento 2do mes quirúrgico',
    '4th surgical month follow-up': 'Seguimiento 4to mes quirúrgico',
    '1-year surgical follow-up': 'Seguimiento 1 año quirúrgico',
    'Première consultation': 'Primera vez', 'Suivi 1er mois chirurgical': 'Seguimiento 1er mes quirúrgico',
    'Suivi 2ème mois chirurgical': 'Seguimiento 2do mes quirúrgico',
    'Suivi 4ème mois chirurgical': 'Seguimiento 4to mes quirúrgico',
    'Suivi 1 an chirurgical': 'Seguimiento 1 año quirúrgico',
    'Erstbesuch': 'Primera vez', 'Nachsorge 1. Monat nach OP': 'Seguimiento 1er mes quirúrgico',
    'Nachsorge 2. Monat nach OP': 'Seguimiento 2do mes quirúrgico',
    'Nachsorge 4. Monat nach OP': 'Seguimiento 4to mes quirúrgico',
    'Nachsorge 1 Jahr nach OP': 'Seguimiento 1 año quirúrgico',
    'Hernia Hiatal': 'Hernia Hiatal', 'Vesícula': 'Vesícula', 'Acalasia': 'Acalasia',
    'Oncológica': 'Oncológica', 'Cirugía Oncológica': 'Oncológica',
    'Otras': 'Otras', 'Hiatal Hernia': 'Hernia Hiatal', 'Gallbladder': 'Vesícula',
    'Achalasia': 'Acalasia', 'Oncological Surgery': 'Oncológica', 'Others': 'Otras',
    'Hernie hiatale': 'Hernia Hiatal', 'Vésicule biliaire': 'Vesícula', 'Achalasie': 'Acalasia',
    'Chirurgie oncologique': 'Oncológica', 'Autres': 'Otras',
    'Hiatushernie': 'Hernia Hiatal', 'Gallenblase': 'Vesícula',
    'Onkologische Chirurgie': 'Oncológica', 'Andere': 'Otras',
};

const CAPTACION_TO_ES: Record<string, string> = {
    'Página web': 'Página web', 'Familia o amigos': 'Familia o amigos',
    'Publicidad en los medios': 'Publicidad en los medios', 'Redes sociales': 'Redes sociales',
    'Otro': 'Otro', 'Website': 'Página web', 'Family or friends': 'Familia o amigos',
    'Media advertising': 'Publicidad en los medios', 'Social networks': 'Redes sociales',
    'Other': 'Otro', 'Site web': 'Página web', 'Famille ou amis': 'Familia o amigos',
    'Publicité dans les médias': 'Publicidad en los medios', 'Réseaux sociaux': 'Redes sociales',
    'Autre': 'Otro', 'Webseite': 'Página web', 'Familie oder Freunde': 'Familia o amigos',
    'Medienwerbung': 'Publicidad en los medios', 'Soziale Netzwerke': 'Redes sociales',
    'Andere': 'Otro',
};

function normMotivo(r: string) { return MOTIVO_TO_ES[r.trim()] ?? r.trim(); }
function normTipo(r: string)    { return TIPO_TO_ES[r.trim()]    ?? r.trim(); }
function normCaptacion(r: string) { return CAPTACION_TO_ES[r.trim()] ?? r.trim(); }
function isYes(v: unknown) { return typeof v === 'string' && ['sí','si','yes','oui','ja'].includes(v.toLowerCase()); }

function countByKey(items: string[]) {
    const m: Record<string, number> = {};
    items.forEach(k => { m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
}

function topFromFreeText(texts: string[], limit = 10) {
    const m: Record<string, number> = {};
    texts.forEach(t => t.split(/[,;\/\n\-·]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 2)
        .forEach(s => { m[s] = (m[s] || 0) + 1; }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, limit)
        .map(([label, count]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), count }));
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

// ─── Preset dates ──────────────────────────────────────────────────────────────

type Preset = 'Todo' | '7D' | '30D' | '90D' | 'Este año' | 'custom';

function presetDates(p: Preset): { from: string; to: string } {
    const now   = new Date();
    const today = now.toISOString().split('T')[0];
    const ago   = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };
    if (p === '7D')       return { from: ago(7),   to: today };
    if (p === '30D')      return { from: ago(30),  to: today };
    if (p === '90D')      return { from: ago(90),  to: today };
    if (p === 'Este año') return { from: `${now.getFullYear()}-01-01`, to: today };
    return { from: '', to: '' };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function AreaChart({ data, maxVal }: { data: { label: string; count: number }[]; maxVal: number }) {
    const W = 800;
    const H = 200;
    const padL = 20;
    const padR = 20;
    const padT = 28;
    const padB = 28;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const n = data.length;

    const xOf = (i: number) => padL + (i / Math.max(n - 1, 1)) * chartW;
    const yOf = (count: number) => padT + chartH - (count / maxVal) * chartH;

    // Build smooth cubic bezier path
    let pathD = '';
    let areaD = '';
    if (n > 0) {
        const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.count) }));
        pathD = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const x0 = pts[i - 1].x;
            const y0 = pts[i - 1].y;
            const x1 = pts[i].x;
            const y1 = pts[i].y;
            const midX = (x0 + x1) / 2;
            pathD += ` C ${midX} ${y0}, ${midX} ${y1}, ${x1} ${y1}`;
        }
        areaD = pathD + ` L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`;
    }

    const gridLevels = [0.25, 0.5, 0.75, 1.0];

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '200px' }} aria-hidden="true">
            <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0074B7" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#0074B7" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {gridLevels.map(lvl => {
                const gy = padT + chartH - lvl * chartH;
                return (
                    <line
                        key={lvl}
                        x1={padL} y1={gy} x2={W - padR} y2={gy}
                        stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 3"
                    />
                );
            })}

            {/* Area fill */}
            {n > 0 && <path d={areaD} fill="url(#areaGrad)" />}

            {/* Line */}
            {n > 0 && (
                <path d={pathD} fill="none" stroke="#0074B7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Dots + labels */}
            {data.map((d, i) => {
                const cx = xOf(i);
                const cy = yOf(d.count);
                return (
                    <g key={d.label}>
                        <circle cx={cx} cy={cy} r={4} fill="white" stroke="#0074B7" strokeWidth="2.5" />
                        {d.count > 0 && (
                            <text x={cx} y={cy - 9} textAnchor="middle" fontSize="9" fill="#0074B7" fontWeight="700">
                                {d.count}
                            </text>
                        )}
                        <text x={cx} y={H - 4} textAnchor="middle" fontSize="8" fill="#94A3B8">
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

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

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color?: string; }) {
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

function KpiCard({ label, value, sub, icon, accent, textAccent }: {
    label: string; value: string | number; sub?: string;
    icon: React.ReactNode; accent: string; textAccent: string;
}) {
    const subColor = sub
        ? sub.startsWith('+') ? '#16A34A' : sub.startsWith('-') ? '#DC2626' : '#64748B'
        : undefined;

    return (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 hover:shadow-md transition-all duration-200 relative overflow-hidden">
            {sub && (
                <span
                    className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                        color: subColor,
                        backgroundColor: sub.startsWith('+') ? '#DCFCE7' : sub.startsWith('-') ? '#FEE2E2' : '#F1F5F9',
                    }}
                >
                    {sub}
                </span>
            )}
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0 mt-0.5">
                    <p className={`text-3xl font-extrabold leading-none ${textAccent}`}>{value}</p>
                    <p className="text-xs font-medium text-[#64748B] mt-1.5">{label}</p>
                </div>
            </div>
        </div>
    );
}

function SectionCard({ title, subtitle, icon, accent, children }: {
    title: string; subtitle?: string; icon: React.ReactNode; accent: string; children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-[#1F2937] text-sm">{title}</h3>
                    {subtitle && <p className="text-[10px] text-[#64748B] mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ClinicalStats() {
    const { patientsV2, loading: patientsLoading } = usePatients();
    const [visits,        setVisits]        = useState<PatientVisit[]>([]);
    const [visitsLoading, setVisitsLoading] = useState(true);
    const [dateFrom,      setDateFrom]      = useState('');
    const [dateTo,        setDateTo]        = useState('');
    const [activePreset,  setActivePreset]  = useState<Preset>('Todo');

    useEffect(() => {
        const q = query(collection(db, 'patient_visits'), orderBy('createdAt', 'desc'));
        return onSnapshot(q,
            snap => { setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() } as PatientVisit))); setVisitsLoading(false); },
            () => setVisitsLoading(false),
        );
    }, []);

    const applyPreset = (p: Preset) => {
        const { from, to } = presetDates(p);
        setDateFrom(from); setDateTo(to); setActivePreset(p);
    };

    const filteredVisits = useMemo(() => {
        if (!dateFrom && !dateTo) return visits;
        return visits.filter(v => {
            const d = new Date(v.createdAt);
            if (dateFrom) { const f = new Date(dateFrom); f.setHours(0,0,0,0); if (d < f) return false; }
            if (dateTo)   { const t = new Date(dateTo);   t.setHours(23,59,59,999); if (d > t) return false; }
            return true;
        });
    }, [visits, dateFrom, dateTo]);

    const isLoading   = patientsLoading || visitsLoading;
    const isFiltered  = !!dateFrom || !!dateTo;

    const stats = useMemo(() => {
        const total       = patientsV2.length;
        const totalVisits = filteredVisits.length;
        if (!total && !totalVisits) return null;

        const monthly    = getMonthlyTrend(filteredVisits);
        const maxMonthly = Math.max(...monthly.map(m => m.count), 1);
        const curMonth   = monthly[monthly.length - 1]?.count ?? 0;
        const prevMonth  = monthly[monthly.length - 2]?.count ?? 0;
        const monthDelta = prevMonth > 0 ? curMonth - prevMonth : null;

        const byMotivo = countByKey(filteredVisits.map(v => normMotivo(v.motivoVisita || '')).filter(Boolean));
        const byTipo   = countByKey(filteredVisits.map(v => normTipo(v.visitType || '')).filter(Boolean));

        const imcValues = filteredVisits
            .map(v => calcIMC(v.answers['peso'], v.answers['estatura']))
            .filter((v): v is number => v !== null && v > 10 && v < 100);
        const avgIMC = imcValues.length ? imcValues.reduce((a, b) => a + b, 0) / imcValues.length : null;
        const imcBuckets = [
            { label: 'Bajo peso (<18.5)',     count: imcValues.filter(v => v < 18.5).length,            color: '#60A5FA' },
            { label: 'Normal (18.5–24.9)',    count: imcValues.filter(v => v >= 18.5 && v < 25).length, color: '#22C55E' },
            { label: 'Sobrepeso (25–29.9)',   count: imcValues.filter(v => v >= 25   && v < 30).length, color: '#FACC15' },
            { label: 'Obesidad I (30–34.9)',  count: imcValues.filter(v => v >= 30   && v < 35).length, color: '#FB923C' },
            { label: 'Obesidad II (35–39.9)', count: imcValues.filter(v => v >= 35   && v < 40).length, color: '#F87171' },
            { label: 'Obesidad III (≥40)',    count: imcValues.filter(v => v >= 40).length,              color: '#B91C1C' },
        ];

        const weights = filteredVisits.map(v => calcPesoKg(v.answers['peso'])).filter((w): w is number => w !== null && w > 0);
        const avgPeso = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : null;
        const ages    = filteredVisits.map(v => Number(v.answers['edad'])).filter(a => !isNaN(a) && a > 0 && a < 120);
        const avgEdad = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null;

        const enfSpecs = filteredVisits.filter(v => isYes(v.answers['enfermedades'])).map(v => String(v.answers['enfermedades_spec'] || '')).filter(Boolean);
        const topEnfermedades     = topFromFreeText(enfSpecs, 10);
        const totalConEnfermedad  = filteredVisits.filter(v => isYes(v.answers['enfermedades'])).length;
        const withAlerts          = patientsV2.filter(p => p.hasAlertFlag).length;

        const bySex          = countByKey(patientsV2.map(p => p.sexo || '').filter(Boolean));
        const byNacionalidad = countByKey(filteredVisits.map(v => String(v.answers['nacionalidad'] || '')).filter(Boolean)).slice(0, 8);
        const DOW            = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
        const byDow          = DOW.map((label, i) => ({ label, count: filteredVisits.filter(v => new Date(v.createdAt).getDay() === i).length }));
        const maxDow         = Math.max(...byDow.map(d => d.count), 1);
        const byCaptacion    = countByKey(filteredVisits.map(v => normCaptacion(String(v.answers['captacion'] || '').trim())).filter(Boolean));

        return {
            total, totalVisits, withAlerts, avgIMC, avgPeso, avgEdad, monthDelta,
            monthly, maxMonthly, byMotivo, byTipo,
            imcBuckets, imcTotal: imcValues.length,
            topEnfermedades, totalConEnfermedad,
            bySex, byNacionalidad, byDow, maxDow, byCaptacion,
        };
    }, [patientsV2, filteredVisits]);

    const exportToExcel = () => {
        if (!stats) return;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.monthly.map(m => ({ Mes: m.label, Visitas: m.count }))), 'Tendencia mensual');
        const summary = [
            { Indicador: 'Total pacientes', Valor: stats.total },
            { Indicador: 'Total visitas',   Valor: stats.totalVisits },
            { Indicador: 'Con alertas',     Valor: stats.withAlerts },
            { Indicador: 'IMC promedio',    Valor: stats.avgIMC?.toFixed(1) ?? 'N/A' },
            { Indicador: 'Peso promedio',   Valor: stats.avgPeso ? `${stats.avgPeso.toFixed(1)} kg` : 'N/A' },
            { Indicador: 'Edad promedio',   Valor: stats.avgEdad ? `${stats.avgEdad.toFixed(0)} años` : 'N/A' },
            { Indicador: '', Valor: '' },
            ...stats.byMotivo.map(m => ({ Indicador: m.label, Valor: m.count })),
            { Indicador: '', Valor: '' },
            ...stats.byTipo.map(t => ({ Indicador: t.label, Valor: t.count })),
            { Indicador: '', Valor: '' },
            ...stats.imcBuckets.map(b => ({ Indicador: b.label, Valor: b.count })),
            { Indicador: '', Valor: '' },
            ...stats.topEnfermedades.map(e => ({ Indicador: e.label, Valor: e.count })),
            { Indicador: '', Valor: '' },
            ...stats.bySex.map(s => ({ Indicador: s.label, Valor: s.count })),
            { Indicador: '', Valor: '' },
            ...stats.byNacionalidad.map(n => ({ Indicador: n.label, Valor: n.count })),
            { Indicador: '', Valor: '' },
            ...stats.byCaptacion.map(c => ({ Indicador: c.label, Valor: c.count })),
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Resumen clínico');
        XLSX.writeFile(wb, 'estadisticas_clinicas_meta_integra.xlsx');
    };

    if (isLoading) return (
        <div className="flex-1 flex items-center justify-center bg-app-bg">
            <Loader2 className="animate-spin text-brand-primary" size={36} />
        </div>
    );

    if (!stats) return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-slate-500 bg-app-bg">
            <Activity size={40} strokeWidth={1} />
            <p className="text-sm">Sin datos registrados todavía</p>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-app-bg">

            {/* ── Filter bar ── */}
            <div className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex flex-wrap items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    <Filter size={11} /> Período
                </div>

                {/* Quick presets */}
                <div className="flex gap-1">
                    {(['Todo','7D','30D','90D','Este año'] as Preset[]).map(p => (
                        <button
                            key={p}
                            onClick={() => applyPreset(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                activePreset === p
                                    ? 'bg-[#0074B7] text-white shadow-sm'
                                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <div className="h-4 w-px bg-[#E2E8F0]" />

                {/* Date inputs */}
                <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Desde</label>
                        <input type="date" value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); setActivePreset('custom'); }}
                            className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0074B7]/20"
                        />
                    </div>
                    <span className="text-[#E2E8F0] mt-4">—</span>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Hasta</label>
                        <input type="date" value={dateTo}
                            onChange={e => { setDateTo(e.target.value); setActivePreset('custom'); }}
                            className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0074B7]/20"
                        />
                    </div>
                </div>

                {isFiltered && (
                    <button onClick={() => applyPreset('Todo')}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
                        <X size={12} /> Limpiar
                    </button>
                )}

                <div className="ml-auto flex items-center gap-2">
                    {isFiltered && (
                        <span className="text-xs bg-[#BFD7ED] text-[#0074B7] font-semibold px-2.5 py-1 rounded-lg">
                            {stats.totalVisits} de {visits.length} visitas
                        </span>
                    )}
                    <button onClick={exportToExcel}
                        className="flex items-center gap-1.5 bg-[#0074B7] hover:bg-[#003B73] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
                        <Download size={13} /> Exportar Excel
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-6xl mx-auto space-y-6">

                {/* ── Row 1: KPI cards — 6 columns ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    <KpiCard
                        label="Pacientes"
                        value={stats.total}
                        accent="bg-[#BFD7ED]"
                        textAccent="text-[#0074B7]"
                        icon={<Users size={18} style={{ color: '#0074B7' }} />}
                    />
                    <KpiCard
                        label="Visitas"
                        value={stats.totalVisits}
                        sub={stats.monthDelta !== null ? `${stats.monthDelta >= 0 ? '+' : ''}${stats.monthDelta} vs mes ant.` : undefined}
                        accent="bg-[#E0F2FE]"
                        textAccent="text-[#0074B7]"
                        icon={<Activity size={18} style={{ color: '#0074B7' }} />}
                    />
                    <KpiCard
                        label="Con alertas"
                        value={stats.withAlerts}
                        accent="bg-red-50"
                        textAccent="text-red-600"
                        icon={<AlertTriangle size={18} className="text-red-500" />}
                    />
                    <KpiCard
                        label="IMC prom."
                        value={stats.avgIMC ? stats.avgIMC.toFixed(1) : '—'}
                        accent="bg-emerald-50"
                        textAccent="text-emerald-700"
                        icon={<TrendingUp size={18} className="text-emerald-600" />}
                    />
                    <KpiCard
                        label="Peso prom."
                        value={stats.avgPeso ? `${stats.avgPeso.toFixed(0)} kg` : '—'}
                        accent="bg-amber-50"
                        textAccent="text-amber-700"
                        icon={<HeartPulse size={18} className="text-amber-600" />}
                    />
                    <KpiCard
                        label="Edad prom."
                        value={stats.avgEdad ? `${stats.avgEdad.toFixed(0)} años` : '—'}
                        accent="bg-violet-50"
                        textAccent="text-violet-700"
                        icon={<User size={18} className="text-violet-600" />}
                    />
                </div>

                {/* ── Row 2: Area chart — full width ── */}
                <SectionCard
                    title="Tendencia mensual de visitas"
                    subtitle="Últimos 12 meses"
                    icon={<TrendingUp size={15} style={{ color: '#0074B7' }} />}
                    accent="bg-[#BFD7ED]"
                >
                    <AreaChart data={stats.monthly} maxVal={stats.maxMonthly} />
                    {isFiltered && (
                        <div className="mt-3 flex justify-end">
                            <span className="text-xs bg-[#BFD7ED] text-[#0074B7] font-semibold px-2.5 py-1 rounded-lg">
                                {stats.totalVisits} de {visits.length} visitas en el período
                            </span>
                        </div>
                    )}
                </SectionCard>

                {/* ── Row 3: Motivo + Tipo side by side ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard
                        title="Por motivo de consulta"
                        icon={<Activity size={15} style={{ color: '#0074B7' }} />}
                        accent="bg-[#BFD7ED]"
                    >
                        <div className="space-y-4">
                            {stats.byMotivo.length > 0
                                ? stats.byMotivo.map(m => (
                                    <BarRow key={m.label} label={m.label} count={m.count} total={stats.totalVisits} color="#0074B7" />
                                ))
                                : <p className="text-sm text-[#64748B] text-center py-4">Sin datos</p>}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Por tipo de consulta"
                        icon={<Users size={15} style={{ color: '#60A3D9' }} />}
                        accent="bg-[#E0F2FE]"
                    >
                        <div className="space-y-4">
                            {stats.byTipo.length > 0
                                ? stats.byTipo.map(t => (
                                    <BarRow key={t.label} label={t.label} count={t.count} total={stats.totalVisits} color="#60A3D9" />
                                ))
                                : <p className="text-sm text-[#64748B] text-center py-4">Sin datos</p>}
                        </div>
                    </SectionCard>
                </div>

                {/* ── Row 4: IMC donut + Sexo/Nacionalidad side by side ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard
                        title="Distribución de IMC"
                        subtitle={`${stats.imcTotal} visitas con datos de peso y estatura`}
                        icon={<TrendingUp size={15} className="text-emerald-600" />}
                        accent="bg-emerald-50"
                    >
                        <DonutChart
                            segments={stats.imcBuckets.map(b => ({ label: b.label, count: b.count, color: b.color }))}
                            total={stats.imcTotal}
                            centerLabel="visitas"
                        />
                        {(stats.avgPeso || stats.avgEdad) && (
                            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#E2E8F0]">
                                {stats.avgPeso && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Peso promedio</span>
                                        <span className="text-sm font-bold text-[#1F2937]">{stats.avgPeso.toFixed(1)} kg</span>
                                    </div>
                                )}
                                {stats.avgEdad && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Edad promedio</span>
                                        <span className="text-sm font-bold text-[#1F2937]">{stats.avgEdad.toFixed(0)} años</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </SectionCard>

                    <div className="space-y-6">
                        <SectionCard
                            title="Por sexo"
                            icon={<User size={15} style={{ color: '#0074B7' }} />}
                            accent="bg-[#BFD7ED]"
                        >
                            <div className="space-y-4">
                                {stats.bySex.length > 0
                                    ? stats.bySex.map(s => (
                                        <BarRow key={s.label} label={s.label} count={s.count} total={stats.total} color="#0074B7" />
                                    ))
                                    : <p className="text-sm text-[#64748B] text-center py-4">Sin datos</p>}
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Por nacionalidad"
                            subtitle="Top 8"
                            icon={<Globe size={15} style={{ color: '#60A3D9' }} />}
                            accent="bg-[#E0F2FE]"
                        >
                            <div className="space-y-4">
                                {stats.byNacionalidad.length > 0
                                    ? stats.byNacionalidad.map(n => (
                                        <BarRow key={n.label} label={n.label} count={n.count} total={stats.totalVisits} color="#60A3D9" />
                                    ))
                                    : <p className="text-sm text-[#64748B] text-center py-4">Sin datos de nacionalidad</p>}
                            </div>
                        </SectionCard>
                    </div>
                </div>

                {/* ── Row 5: Top enfermedades — 2 col grid inside ── */}
                <SectionCard
                    title="Top enfermedades reportadas"
                    subtitle={`${stats.totalConEnfermedad} pacientes con antecedentes médicos`}
                    icon={<HeartPulse size={15} className="text-red-500" />}
                    accent="bg-red-50"
                >
                    {stats.topEnfermedades.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.topEnfermedades.map(e => (
                                <BarRow key={e.label} label={e.label} count={e.count} total={stats.totalConEnfermedad || 1} color="#F87171" />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[#64748B] text-center py-4">Sin datos de enfermedades especificadas</p>
                    )}
                </SectionCard>

                {/* ── Row 6: Captación + Día semana ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard
                        title="¿Cómo nos conociste?"
                        icon={<Share2 size={15} style={{ color: '#0074B7' }} />}
                        accent="bg-[#BFD7ED]"
                    >
                        <div className="grid grid-cols-1 gap-4">
                            {stats.byCaptacion.length > 0
                                ? stats.byCaptacion.map(c => (
                                    <BarRow
                                        key={c.label}
                                        label={c.label}
                                        count={c.count}
                                        total={stats.byCaptacion.reduce((s, x) => s + x.count, 0)}
                                        color="#0074B7"
                                    />
                                ))
                                : <p className="text-sm text-[#64748B] text-center py-4">Sin datos de captación</p>}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Actividad por día de la semana"
                        icon={<Calendar size={15} style={{ color: '#0074B7' }} />}
                        accent="bg-[#BFD7ED]"
                    >
                        <div className="flex items-end gap-2 pt-2" style={{ height: '160px' }}>
                            {stats.byDow.map(d => {
                                const pct = Math.round((d.count / stats.maxDow) * 100);
                                return (
                                    <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
                                        <span className="text-[9px] font-bold text-[#64748B]">
                                            {d.count > 0 ? d.count : ''}
                                        </span>
                                        <div className="w-full flex items-end" style={{ height: '108px' }}>
                                            <div
                                                className="w-full rounded-t-md transition-colors cursor-default"
                                                style={{
                                                    height: `${Math.max(pct, d.count > 0 ? 6 : 0)}%`,
                                                    backgroundColor: '#0074B7',
                                                }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#003B73'; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#0074B7'; }}
                                                title={`${d.label}: ${d.count}`}
                                            />
                                        </div>
                                        <span className="text-[10px] text-[#1F2937] font-semibold">{d.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>
                </div>

            </div>
        </div>
    );
}
