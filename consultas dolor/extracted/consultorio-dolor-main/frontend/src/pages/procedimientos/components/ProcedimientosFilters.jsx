const inputCls = 'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';

export default function ProcedimientosFilters({ desde, hasta, tipo, onChange, count }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 mb-4 flex items-end gap-3 flex-wrap">
      <label className="block">
        <span className="text-xs font-medium text-slate-600 mb-1 block">Desde</span>
        <input type="date" value={desde} onChange={e => onChange({ desde: e.target.value })} className={inputCls} />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600 mb-1 block">Hasta</span>
        <input type="date" value={hasta} onChange={e => onChange({ hasta: e.target.value })} className={inputCls} />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600 mb-1 block">Tipo</span>
        <select value={tipo} onChange={e => onChange({ tipo: e.target.value })} className={inputCls}>
          <option value="">Todos</option>
          <option value="bloqueo">Bloqueo</option>
          <option value="infiltracion">Infiltración</option>
          <option value="neuromodulacion">Neuromodulación</option>
        </select>
      </label>
      <div className="ml-auto text-sm text-slate-500">
        {count} procedimiento{count !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
