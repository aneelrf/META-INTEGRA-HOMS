import { fmt } from '../utils/format.js';

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function MonthlyChart({ months }) {
  if (!months.length) return <p className="text-sm text-slate-500">Sin datos.</p>;
  const maxVal = Math.max(...months.flatMap(m => [m.facturado, m.cobrado]), 1);
  return (
    <div>
      <div className="space-y-2.5">
        {months.map(m => {
          const [y, mo] = m.mes.split('-');
          const label = `${NOMBRES_MES[Number(mo) - 1]} ${y.slice(2)}`;
          return (
            <div key={m.mes} className="flex items-center gap-3">
              <div className="w-14 text-xs text-slate-500 shrink-0">{label}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-brand-500 rounded-full min-w-[2px]" style={{ width: `${(m.facturado / maxVal) * 100}%` }} />
                  <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">{fmt(m.facturado)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-emerald-500 rounded-full min-w-[2px]" style={{ width: `${(m.cobrado / maxVal) * 100}%` }} />
                  <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">{fmt(m.cobrado)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 pt-3 mt-3 border-t border-slate-100 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500"></span> Facturado</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cobrado</span>
      </div>
    </div>
  );
}
