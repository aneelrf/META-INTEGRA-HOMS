import { fmt } from '../utils/format.js';

export default function TotalsSection({ subtotal, impuesto, onImpuestoChange, totalLabel = 'Total' }) {
  const imp = Number(impuesto) || 0;
  const total = subtotal + imp;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
      <div className="flex justify-between items-center py-1 text-sm">
        <span className="text-slate-600">Subtotal</span>
        <span className="tabular-nums font-medium text-slate-900">{fmt(subtotal)}</span>
      </div>
      <div className="flex justify-between items-center py-2 text-sm">
        <label className="text-slate-600 flex items-center gap-2">
          Impuesto / ITBIS
          <input
            type="number" min="0" step="0.01"
            value={impuesto}
            onChange={e => onImpuestoChange(e.target.value)}
            className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right tabular-nums text-sm"
          />
        </label>
        <span className="tabular-nums font-medium text-slate-900">{fmt(imp)}</span>
      </div>
      <div className="flex justify-between items-center py-3 border-t border-slate-200 text-lg">
        <span className="font-semibold text-slate-900">{totalLabel}</span>
        <span className="tabular-nums font-semibold text-brand-700">{fmt(total)}</span>
      </div>
    </div>
  );
}
