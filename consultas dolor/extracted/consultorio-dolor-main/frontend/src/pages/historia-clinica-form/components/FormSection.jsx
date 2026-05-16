export const inp = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm';

export function Card({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export function LongField({ label, value, onChange }) {
  return (
    <label className="block mb-3 last:mb-0">
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      <textarea rows={2} className={inp} value={value || ''} onChange={e => onChange(e.target.value)} />
    </label>
  );
}

export function EscalaLegenda({ items, max }) {
  return (
    <div className="mb-3 flex gap-3 flex-wrap text-xs text-slate-600">
      {items.map(({ n, label }) => (
        <span key={n} className="inline-flex items-center gap-1">
          <span className="font-mono font-semibold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">{n}/{max}</span>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

export function GridDI({ filas, data, setData, max }) {
  function setCell(k, side, val) {
    const v = val === '' ? '' : Math.max(0, Math.min(max, Number(val) || 0));
    setData(d => ({ ...d, [k]: { ...d[k], [side]: v } }));
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase text-slate-500 tracking-wider border-b border-slate-200">
            <th className="text-left py-2 font-semibold">Zona / Reflejo</th>
            <th className="text-center py-2 font-semibold w-24">Derecha</th>
            <th className="text-center py-2 font-semibold w-24">Izquierda</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.map(([k, label]) => (
            <tr key={k}>
              <td className="py-2 text-slate-700">{label}</td>
              <td className="py-1 text-center">
                <input
                  type="number" min="0" max={max}
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={data[k]?.d ?? ''}
                  onChange={e => setCell(k, 'd', e.target.value)}
                />
              </td>
              <td className="py-1 text-center">
                <input
                  type="number" min="0" max={max}
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={data[k]?.i ?? ''}
                  onChange={e => setCell(k, 'i', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

