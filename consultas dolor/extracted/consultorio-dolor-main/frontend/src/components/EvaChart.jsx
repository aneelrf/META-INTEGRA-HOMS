import { useMemo } from 'react';

const W = 800, H = 220;
const PAD = { t: 24, r: 30, b: 36, l: 38 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

const evaColor = v => (v <= 3 ? '#059669' : v <= 6 ? '#d97706' : '#e11d48');

export default function EvaChart({ consultations = [], procedures = [] }) {
  const { points, procPoints } = useMemo(() => {
    const p = consultations
      .filter(c => c.eva !== null && c.eva !== undefined)
      .map(c => ({ date: new Date(c.date.replace(' ', 'T')), eva: c.eva, id: c.id }))
      .sort((a, b) => a.date - b.date);
    const pp = procedures
      .map(pr => ({
        date: new Date(pr.fecha.replace(' ', 'T')),
        tipo: pr.tipo,
        subtipo: pr.subtipo,
        eva_pre: pr.eva_pre,
        eva_post: pr.eva_post,
        id: pr.id,
      }))
      .sort((a, b) => a.date - b.date);
    return { points: p, procPoints: pp };
  }, [consultations, procedures]);

  const summary = useMemo(() => {
    if (points.length === 0) return null;
    const vals = points.map(p => p.eva);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const first = points[0].eva;
    const last = points[points.length - 1].eva;
    return { latest: last, avg: avg.toFixed(1), first, delta: first - last, count: points.length };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-slate-500">
        Sin EVAs registrados todavía. Al crear consultas con EVA aparecerá aquí la evolución.
      </div>
    );
  }

  const allDates = [...points.map(p => p.date), ...procPoints.map(p => p.date)];
  let minT = Math.min(...allDates.map(d => d.getTime()));
  let maxT = Math.max(...allDates.map(d => d.getTime()));
  if (maxT - minT < 1000 * 60 * 60 * 24 * 7) {
    const mid = (minT + maxT) / 2;
    minT = mid - 1000 * 60 * 60 * 24 * 30;
    maxT = mid + 1000 * 60 * 60 * 24 * 30;
  }
  const range = maxT - minT;

  const x = d => PAD.l + ((d.getTime() - minT) / range) * IW;
  const y = v => PAD.t + ((10 - v) / 10) * IH;

  const linePath = points.length > 1
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.date).toFixed(1)} ${y(p.eva).toFixed(1)}`).join(' ')
    : '';

  const xLabels = [
    { t: minT, anchor: 'start', posX: PAD.l },
    { t: (minT + maxT) / 2, anchor: 'middle', posX: PAD.l + IW / 2 },
    { t: maxT, anchor: 'end', posX: W - PAD.r },
  ];

  const latestColor = summary.latest <= 3 ? 'text-emerald-600' : summary.latest <= 6 ? 'text-amber-600' : 'text-rose-600';
  const deltaColor = summary.delta > 0 ? 'text-emerald-600' : summary.delta < 0 ? 'text-rose-600' : 'text-slate-600';

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Gráfica de evolución del EVA"
      >
        {[0, 2, 4, 6, 8, 10].map(v => (
          <g key={v}>
            <line
              x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)}
              stroke="#e2e8f0"
              strokeDasharray={v === 0 || v === 10 ? '' : '3 3'}
            />
            <text x={PAD.l - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text>
          </g>
        ))}

        {procPoints.map(p => (
          <g key={`pr-${p.id}`}>
            <line
              x1={x(p.date)} x2={x(p.date)} y1={PAD.t} y2={H - PAD.b}
              stroke="#c4b5fd" strokeWidth={1} strokeDasharray="3 3"
            />
            <circle cx={x(p.date)} cy={PAD.t - 8} r={5} fill="#7c3aed">
              <title>
                {(p.subtipo || p.tipo) + ' — ' + p.date.toLocaleDateString('es-DO') +
                  (p.eva_pre != null ? ` · pre ${p.eva_pre}` : '') +
                  (p.eva_post != null ? ` · post ${p.eva_post}` : '')}
              </title>
            </circle>
          </g>
        ))}

        {linePath && <path d={linePath} fill="none" stroke="#475569" strokeWidth={1.5} />}

        {points.map(p => (
          <circle key={p.id} cx={x(p.date)} cy={y(p.eva)} r={5} fill={evaColor(p.eva)} stroke="white" strokeWidth={1.5}>
            <title>EVA {p.eva} — {p.date.toLocaleDateString('es-DO')}</title>
          </circle>
        ))}

        {xLabels.map((l, i) => (
          <text key={i} x={l.posX} y={H - 12} fontSize="10" fill="#64748b" textAnchor={l.anchor}>
            {new Date(l.t).toLocaleDateString('es-DO', { month: 'short', year: '2-digit' })}
          </text>
        ))}
      </svg>

      <div className="flex gap-8 mt-4 pt-4 border-t border-slate-100 text-sm flex-wrap">
        <Stat label="Última EVA" value={summary.latest} valueClass={latestColor} />
        <Stat label="Promedio" value={summary.avg} valueClass="text-slate-700" />
        {summary.count > 1 && (
          <Stat
            label={`Cambio total (${summary.count} mediciones)`}
            value={summary.delta > 0 ? `↓ ${summary.delta}` : summary.delta < 0 ? `↑ ${Math.abs(summary.delta)}` : '='}
            valueClass={deltaColor}
          />
        )}
        {procPoints.length > 0 && (
          <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
            <span className="w-3 h-3 rounded-full bg-violet-600"></span>
            Procedimientos ({procPoints.length})
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, valueClass }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
}
