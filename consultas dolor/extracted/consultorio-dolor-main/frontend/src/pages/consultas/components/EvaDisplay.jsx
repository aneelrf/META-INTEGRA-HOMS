import { evaColor, evaLabel } from '../utils/eva.js';

export default function EvaDisplay({ eva }) {
  const color = evaColor(eva);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">EVA</h3>
          <p className="text-sm text-slate-600 mt-1">Escala analógica visual del dolor</p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-semibold tabular-nums ${color}`}>
            {eva}<span className="text-xl text-slate-400">/10</span>
          </div>
          <div className={`text-xs font-medium uppercase tracking-wider ${color}`}>{evaLabel(eva)}</div>
        </div>
      </div>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500">
        <div
          className="absolute -top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-900 shadow"
          style={{ left: `calc(${(eva / 10) * 100}% - 10px)` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>0</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}
