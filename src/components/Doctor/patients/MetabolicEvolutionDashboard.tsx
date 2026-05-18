import { useMemo } from 'react';
import { TIPO_SHORT } from '../../../services/patientsService';
import type { ClinicalMetric } from '../../../services/patientServiceV2';
import type { PatientVisit } from '../../../services/patientServiceV2';
import { BarChart2, TrendingDown, TrendingUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartPoint {
    label: string;
    value: number;
}

interface DataPoint {
    label: string;
    date: string;
    peso: number | null;
    imc:  number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_XSHORT: Record<string, string> = {
    'Primera vez':                    '1ª vez',
    'Seguimiento 1er mes quirúrgico': '1er mes',
    'Seguimiento 2do mes quirúrgico': '2do mes',
    'Seguimiento 4to mes quirúrgico': '4to mes',
    'Seguimiento 1 año quirúrgico':   '1 año',
};

function imcCategory(imc: number): string {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25)   return 'Normal';
    if (imc < 30)   return 'Sobrepeso';
    if (imc < 35)   return 'Obesidad I';
    if (imc < 40)   return 'Obesidad II';
    return 'Obesidad III';
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function SummaryCard({
    label, value, unit, sub, trend,
}: {
    label: string;
    value: number | null | undefined;
    unit: string;
    sub?: string;
    trend?: 'down-good' | 'up-bad' | 'neutral';
}) {
    const display = value != null ? value.toFixed(1) : '—';

    const textColor = trend === 'down-good' ? 'text-green-600'
        : trend === 'up-bad' ? 'text-red-500' : 'text-gray-900';
    const borderBg  = trend === 'down-good' ? 'bg-green-50 border-green-100'
        : trend === 'up-bad' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100';
    const Icon = trend === 'down-good' ? TrendingDown
        : trend === 'up-bad' ? TrendingUp : null;

    return (
        <div className={`rounded-2xl border shadow-sm p-4 flex flex-col gap-1.5 ${borderBg}`}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                    {label}
                </span>
                {Icon && (
                    <Icon size={14}
                        className={trend === 'down-good' ? 'text-green-500' : 'text-red-400'} />
                )}
            </div>
            <div className="flex items-end gap-1">
                <span className={`text-2xl font-bold leading-none ${textColor}`}>{display}</span>
                {value != null && unit && (
                    <span className="text-sm text-gray-400 mb-0.5">{unit}</span>
                )}
            </div>
            {sub && <span className="text-[11px] text-gray-400 leading-tight">{sub}</span>}
        </div>
    );
}

// ─── SVG Line chart ───────────────────────────────────────────────────────────

function LineChart({
    points, color, unit, dp, gradientId,
}: {
    points: ChartPoint[];
    color:  string;
    unit:   string;
    dp:     number;
    gradientId: string;
}) {
    if (points.length === 0) return null;

    const W = 520, H = 170;
    const ml = 54, mr = 18, mt = 28, mb = 44;
    const cw = W - ml - mr;
    const ch = H - mt - mb;

    const vals   = points.map(p => p.value);
    const minV   = Math.min(...vals);
    const maxV   = Math.max(...vals);
    const vRange = maxV - minV || minV * 0.15 || 5;
    const yMin   = Math.max(0, minV - vRange * 0.35);
    const yMax   = maxV + vRange * 0.35;

    const xPos = (i: number) =>
        points.length <= 1 ? ml + cw / 2 : ml + (i / (points.length - 1)) * cw;
    const yPos = (v: number) =>
        mt + ch * (1 - (v - yMin) / (yMax - yMin));

    const linePath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)},${yPos(p.value).toFixed(1)}`)
        .join(' ');

    const areaPath = points.length >= 2
        ? `${linePath} L ${xPos(points.length - 1).toFixed(1)},${(mt + ch)} L ${xPos(0).toFixed(1)},${(mt + ch)} Z`
        : null;

    const yTicks = [0, 0.33, 0.67, 1].map(t => yMin + (yMax - yMin) * t);

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto select-none"
            aria-label={`Gráfico de evolución${unit ? ' (' + unit + ')' : ''}`}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
            </defs>

            {yTicks.map((v, i) => (
                <g key={i}>
                    <line
                        x1={ml} x2={W - mr} y1={yPos(v)} y2={yPos(v)}
                        stroke={i === 0 ? '#cbd5e1' : '#e2e8f0'}
                        strokeWidth="1"
                        strokeDasharray={i > 0 ? '3,4' : undefined}
                    />
                    <text x={ml - 8} y={yPos(v) + 4} textAnchor="end" fill="#94a3b8" fontSize="10">
                        {v.toFixed(dp)}
                    </text>
                </g>
            ))}

            {unit && (
                <text
                    x={14} y={mt + ch / 2}
                    textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600"
                    transform={`rotate(-90, 14, ${(mt + ch / 2).toFixed(0)})`}
                >
                    {unit}
                </text>
            )}

            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

            {points.length >= 2 && (
                <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}

            {points.length === 1 && (
                <line
                    x1={xPos(0) - 30} x2={xPos(0) + 30}
                    y1={yPos(points[0].value)} y2={yPos(points[0].value)}
                    stroke={color} strokeWidth="1.5"
                    strokeDasharray="5,4" strokeOpacity="0.4"
                />
            )}

            {points.map((p, i) => {
                const cx = xPos(i);
                const cy = yPos(p.value);
                const labelVal = `${p.value.toFixed(dp)}${unit ? ' ' + unit : ''}`;
                return (
                    <g key={i}>
                        <circle cx={cx} cy={cy} r="6"   fill="white" stroke={color} strokeWidth="2.5" />
                        <circle cx={cx} cy={cy} r="2.5" fill={color} />
                        <text
                            x={cx} y={cy - 12}
                            textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="700"
                        >
                            {labelVal}
                        </text>
                    </g>
                );
            })}

            <line x1={ml} x2={W - mr} y1={mt + ch} y2={mt + ch} stroke="#cbd5e1" strokeWidth="1" />

            {points.map((p, i) => (
                <text
                    key={i}
                    x={xPos(i)} y={mt + ch + 16}
                    textAnchor="middle" fill="#6b7280" fontSize="10"
                >
                    {p.label}
                </text>
            ))}
        </svg>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
    metrics: ClinicalMetric[];   // chronological order (asc)
    visits:  PatientVisit[];     // for visit-type labels
}

export default function MetabolicEvolutionDashboard({ metrics, visits }: Props) {

    const data = useMemo((): DataPoint[] => {
        return metrics.map(m => {
            const visit = visits.find(v => v.id === m.visitId);
            const tipo  = visit?.visitType ?? null;
            const label = tipo
                ? (TIPO_XSHORT[tipo] ?? TIPO_SHORT[tipo] ?? tipo)
                : new Date(m.recordedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            return { label, date: m.recordedAt, peso: m.peso, imc: m.imc };
        });
    }, [metrics, visits]);

    const pesoPoints: ChartPoint[] = data
        .filter(d => d.peso != null)
        .map(d => ({ label: d.label, value: d.peso! }));

    const imcPoints: ChartPoint[] = data
        .filter(d => d.imc != null)
        .map(d => ({ label: d.label, value: d.imc! }));

    if (pesoPoints.length === 0 && imcPoints.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <BarChart2 size={36} strokeWidth={1} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">Sin datos de peso o IMC</p>
                <p className="text-gray-400 text-xs mt-1">
                    Los registros de este paciente no contienen mediciones de peso o IMC.
                </p>
            </div>
        );
    }

    const multi     = Math.max(pesoPoints.length, imcPoints.length) > 1;

    const firstPeso = pesoPoints[0]?.value ?? null;
    const lastPeso  = pesoPoints.length > 1 ? pesoPoints[pesoPoints.length - 1].value : null;
    const deltaPeso = firstPeso != null && lastPeso != null ? lastPeso - firstPeso : null;

    const firstIMC  = imcPoints[0]?.value ?? null;
    const lastIMC   = imcPoints.length > 1 ? imcPoints[imcPoints.length - 1].value : null;
    const deltaIMC  = firstIMC != null && lastIMC != null ? lastIMC - firstIMC : null;

    const firstPesoRecord = data.find(d => d.peso != null);
    const lastPesoRecord  = [...data].reverse().find(d => d.peso != null);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                        <BarChart2 size={16} className="text-medical-blue" />
                        Evaluación metabólica comparativa
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Comparación histórica de peso e IMC · datos de formularios</p>
                </div>
                <span className="text-[10px] font-bold bg-medical-blue/10 text-medical-blue px-2.5 py-1 rounded-full whitespace-nowrap">
                    {data.length} consulta{data.length !== 1 ? 's' : ''}
                </span>
            </div>

            {!multi && (
                <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                    <span className="text-amber-500 font-bold text-sm leading-none mt-0.5 flex-shrink-0">i</span>
                    <p className="text-xs text-amber-700 font-medium">
                        Aún no hay suficientes seguimientos para mostrar una comparación completa.
                    </p>
                </div>
            )}

            <div className="p-6 space-y-7">

                <div className={`grid gap-3 ${multi ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
                    {firstPeso != null && (
                        <SummaryCard
                            label={multi ? 'Peso inicial' : 'Peso registrado'}
                            value={firstPeso}
                            unit="kg"
                            sub={firstPesoRecord?.imc != null ? `IMC: ${firstPesoRecord.imc.toFixed(1)}` : undefined}
                        />
                    )}
                    {multi && lastPeso != null && (
                        <SummaryCard
                            label="Peso actual"
                            value={lastPeso}
                            unit="kg"
                            sub={lastPesoRecord?.imc != null ? `IMC: ${lastPesoRecord.imc.toFixed(1)}` : undefined}
                        />
                    )}
                    {deltaPeso != null && (
                        <SummaryCard
                            label="Variación de peso"
                            value={Math.abs(deltaPeso)}
                            unit="kg"
                            sub={deltaPeso < 0 ? 'Reducción desde 1ª consulta' : deltaPeso > 0 ? 'Aumento desde 1ª consulta' : 'Sin cambio registrado'}
                            trend={deltaPeso < 0 ? 'down-good' : deltaPeso > 0 ? 'up-bad' : 'neutral'}
                        />
                    )}
                    {firstIMC != null && (
                        <SummaryCard
                            label={multi ? 'IMC inicial' : 'IMC registrado'}
                            value={firstIMC}
                            unit=""
                            sub={imcCategory(firstIMC)}
                        />
                    )}
                    {multi && lastIMC != null && (
                        <SummaryCard
                            label="IMC actual"
                            value={lastIMC}
                            unit=""
                            sub={imcCategory(lastIMC)}
                        />
                    )}
                    {deltaIMC != null && (
                        <SummaryCard
                            label="Variación de IMC"
                            value={Math.abs(deltaIMC)}
                            unit=""
                            sub={deltaIMC < 0 ? 'Reducción desde 1ª consulta' : deltaIMC > 0 ? 'Aumento desde 1ª consulta' : 'Sin cambio registrado'}
                            trend={deltaIMC < 0 ? 'down-good' : deltaIMC > 0 ? 'up-bad' : 'neutral'}
                        />
                    )}
                </div>

                {pesoPoints.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-medical-blue inline-block flex-shrink-0" />
                            Evolución del peso (kg)
                        </p>
                        <div className="bg-[#f8faff] rounded-2xl border border-blue-50 px-4 pt-3 pb-2">
                            <LineChart points={pesoPoints} color="#4888C8" unit="kg" dp={1} gradientId="grad_peso_evo" />
                        </div>
                    </div>
                )}

                {imcPoints.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block flex-shrink-0" />
                            Evolución del IMC
                        </p>
                        <div className="bg-[#fffdf5] rounded-2xl border border-yellow-50 px-4 pt-3 pb-2">
                            <LineChart points={imcPoints} color="#ECC350" unit="" dp={1} gradientId="grad_imc_evo" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
