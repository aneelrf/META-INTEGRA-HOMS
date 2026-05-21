import { useMemo } from 'react';
import { TIPO_SHORT } from '../../../services/patientsService';
import type { ClinicalMetric, PatientVisit } from '../../../services/patientServiceV2';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const TIPO_XSHORT: Record<string, string> = {
    'Primera vez':                    '1ª vez',
    'Seguimiento 1er mes quirúrgico': '1m',
    'Seguimiento 2do mes quirúrgico': '2m',
    'Seguimiento 4to mes quirúrgico': '4m',
    'Seguimiento 1 año quirúrgico':   '1 año',
};

function imcCategory(imc: number): { label: string; color: string } {
    if (imc < 18.5) return { label: 'Bajo peso',   color: 'text-blue-500'    };
    if (imc < 25)   return { label: 'Normal',       color: 'text-emerald-500' };
    if (imc < 30)   return { label: 'Sobrepeso',    color: 'text-amber-500'   };
    if (imc < 35)   return { label: 'Obesidad I',   color: 'text-orange-500'  };
    if (imc < 40)   return { label: 'Obesidad II',  color: 'text-red-500'     };
    return                  { label: 'Obesidad III', color: 'text-red-700'     };
}

// ─── Compact stat pill ────────────────────────────────────────────────────────

function StatPill({
    label, value, unit, delta, sub,
}: {
    label: string;
    value: number | null;
    unit: string;
    delta?: number | null;
    sub?: string;
}) {
    const display = value != null ? value.toFixed(1) : '—';
    const hasDelta = delta != null;
    const Icon = hasDelta
        ? (delta < -0.05 ? TrendingDown : delta > 0.05 ? TrendingUp : Minus)
        : null;
    const deltaColor = !hasDelta ? ''
        : delta! < -0.05 ? 'text-emerald-500'
        : delta! > 0.05  ? 'text-red-500'
        : 'text-gray-400 dark:text-slate-500';

    return (
        <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl bg-surface border border-bd">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                {label}
            </span>
            <div className="flex items-end justify-between gap-2">
                <div className="flex items-end gap-0.5">
                    <span className="text-xl font-black leading-none text-gray-900 dark:text-slate-100">{display}</span>
                    {value != null && unit && (
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 mb-0.5 ml-0.5">{unit}</span>
                    )}
                </div>
                {Icon && hasDelta && (
                    <Icon size={14} className={`flex-shrink-0 ${deltaColor}`} />
                )}
            </div>
            {sub && (
                <span className="text-[10px] text-gray-400 dark:text-slate-500 leading-none">{sub}</span>
            )}
        </div>
    );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({
    points, color, unit, dp, gradientId,
}: {
    points: { label: string; value: number }[];
    color: string;
    unit: string;
    dp: number;
    gradientId: string;
}) {
    if (points.length === 0) return null;

    const W = 460, H = 100;
    const ml = 8, mr = 8, mt = 22, mb = 18;
    const cw = W - ml - mr;
    const ch = H - mt - mb;

    const vals   = points.map(p => p.value);
    const minV   = Math.min(...vals);
    const maxV   = Math.max(...vals);
    const vRange = maxV - minV || minV * 0.1 || 3;
    const yMin   = Math.max(0, minV - vRange * 0.4);
    const yMax   = maxV + vRange * 0.4;

    const xPos = (i: number) =>
        points.length <= 1 ? ml + cw / 2 : ml + (i / (points.length - 1)) * cw;
    const yPos = (v: number) =>
        mt + ch * (1 - (v - yMin) / (yMax - yMin));

    const linePath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)},${yPos(p.value).toFixed(1)}`)
        .join(' ');

    const areaPath = points.length >= 2
        ? `${linePath} L ${xPos(points.length - 1).toFixed(1)},${mt + ch} L ${xPos(0).toFixed(1)},${mt + ch} Z`
        : null;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" aria-hidden="true">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={color} stopOpacity="0.20" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.00" />
                </linearGradient>
            </defs>

            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

            {points.length >= 2 && (
                <path
                    d={linePath} fill="none"
                    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
            )}

            {points.map((p, i) => {
                const cx = xPos(i);
                const cy = yPos(p.value);
                return (
                    <g key={i}>
                        <circle cx={cx} cy={cy} r="4.5" fill="white" stroke={color} strokeWidth="2" />
                        <circle cx={cx} cy={cy} r="2"   fill={color} />
                        <text x={cx} y={cy - 9} textAnchor="middle" fill={color} fontSize="9" fontWeight="700">
                            {p.value.toFixed(dp)}{unit ? ` ${unit}` : ''}
                        </text>
                        <text x={cx} y={H - 3} textAnchor="middle" fill="#94a3b8" fontSize="8.5">
                            {p.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
    metrics: ClinicalMetric[];
    visits:  PatientVisit[];
}

export default function MetabolicEvolutionDashboard({ metrics, visits }: Props) {

    const data = useMemo(() => metrics.map(m => {
        const visit = visits.find(v => v.id === m.visitId);
        const tipo  = visit?.visitType ?? null;
        const label = tipo
            ? (TIPO_XSHORT[tipo] ?? TIPO_SHORT[tipo] ?? tipo)
            : new Date(m.recordedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        return { label, peso: m.peso, imc: m.imc };
    }), [metrics, visits]);

    const pesoPoints = data.filter(d => d.peso != null).map(d => ({ label: d.label, value: d.peso! }));
    const imcPoints  = data.filter(d => d.imc  != null).map(d => ({ label: d.label, value: d.imc! }));

    if (pesoPoints.length === 0 && imcPoints.length === 0) return null;

    const firstPeso = pesoPoints[0]?.value ?? null;
    const lastPeso  = pesoPoints.length > 1 ? pesoPoints[pesoPoints.length - 1].value : null;
    const deltaPeso = firstPeso != null && lastPeso != null ? lastPeso - firstPeso : null;

    const firstIMC  = imcPoints[0]?.value ?? null;
    const lastIMC   = imcPoints.length > 1 ? imcPoints[imcPoints.length - 1].value : null;
    const deltaIMC  = firstIMC != null && lastIMC != null ? lastIMC - firstIMC : null;

    const lastImcCat = lastIMC != null ? imcCategory(lastIMC) : null;

    return (
        <div className="bg-card rounded-2xl border border-bd overflow-hidden">

            {/* ── Stats row ── */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <StatPill
                    label="Peso inicial"
                    value={firstPeso}
                    unit="kg"
                />
                <StatPill
                    label={lastPeso != null ? 'Peso actual' : 'Peso registrado'}
                    value={lastPeso ?? firstPeso}
                    unit="kg"
                    delta={deltaPeso}
                    sub={deltaPeso != null ? `${deltaPeso < 0 ? '▼' : deltaPeso > 0 ? '▲' : '='} ${Math.abs(deltaPeso).toFixed(1)} kg desde inicio` : undefined}
                />
                <StatPill
                    label="IMC inicial"
                    value={firstIMC}
                    unit=""
                    sub={firstIMC != null ? imcCategory(firstIMC).label : undefined}
                />
                <StatPill
                    label={lastIMC != null ? 'IMC actual' : 'IMC registrado'}
                    value={lastIMC ?? firstIMC}
                    unit=""
                    delta={deltaIMC}
                    sub={lastImcCat?.label}
                />
            </div>

            {/* ── Sparklines ── */}
            {(pesoPoints.length > 0 || imcPoints.length > 0) && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pesoPoints.length > 0 && (
                        <div className="bg-surface rounded-xl border border-bd px-3 pt-2.5 pb-1">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue inline-block" />
                                Peso (kg)
                            </p>
                            <Sparkline points={pesoPoints} color="#4888C8" unit="kg" dp={1} gradientId="sp_peso" />
                        </div>
                    )}
                    {imcPoints.length > 0 && (
                        <div className="bg-surface rounded-xl border border-bd px-3 pt-2.5 pb-1">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                                IMC
                            </p>
                            <Sparkline points={imcPoints} color="#F59E0B" unit="" dp={1} gradientId="sp_imc" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
