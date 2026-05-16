import { evaColor, evaLabel } from '../utils/eva.js';

export default function EvaSlider({ value, onChange }) {
  const color = evaColor(value);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">EVA — Dolor actual</h3>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-semibold tabular-nums ${color}`}>
            {value}<span className="text-lg text-slate-400">/10</span>
          </div>
          <div className={`text-xs font-medium uppercase tracking-wider ${color}`}>{evaLabel(value)}</div>
        </div>
      </div>
      <input
        type="range" min="0" max="10" step="1"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="eva-slider w-full"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
        {Array.from({ length: 11 }, (_, i) => <span key={i}>{i}</span>)}
      </div>
    </div>
  );
}
