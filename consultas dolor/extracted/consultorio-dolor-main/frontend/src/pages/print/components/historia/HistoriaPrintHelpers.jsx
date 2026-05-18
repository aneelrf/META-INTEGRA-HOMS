export const v = x => (x !== null && x !== undefined && x !== '' ? x : '—');

export function HistoriaSection({ title, children }) {
  return (
    <section className="mb-4">
      <h3 className="bg-slate-100 border-l-4 border-slate-900 px-2 py-1 text-sm font-bold uppercase tracking-wider mb-2 break-inside-avoid">{title}</h3>
      <div className="pl-1">{children}</div>
    </section>
  );
}

export function LabeledLine({ label, value }) {
  return (
    <div className="mb-1.5 break-inside-avoid">
      <span className="font-semibold">{label}: </span>
      <span className="whitespace-pre-wrap">{v(value)}</span>
    </div>
  );
}

export function DataGrid({ pairs, cols = 2 }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-x-4`}>
      {pairs.map(([label, value], i) => (
        <div key={i} className="mb-1 flex gap-2">
          <span className="font-semibold shrink-0">{label}:</span>
          <span className="flex-1">{v(value)}</span>
        </div>
      ))}
    </div>
  );
}

export function TablaDI({ filas, data }) {
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr>
          <th className="text-left border border-slate-300 px-2 py-1 bg-slate-50">Zona / Reflejo</th>
          <th className="border border-slate-300 px-2 py-1 bg-slate-50 w-16">D</th>
          <th className="border border-slate-300 px-2 py-1 bg-slate-50 w-16">I</th>
        </tr>
      </thead>
      <tbody>
        {filas.map(([k, label]) => (
          <tr key={k}>
            <td className="border border-slate-300 px-2 py-1">{label}</td>
            <td className="border border-slate-300 px-2 py-1 text-center tabular-nums">{v(data[k]?.d)}</td>
            <td className="border border-slate-300 px-2 py-1 text-center tabular-nums">{v(data[k]?.i)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
