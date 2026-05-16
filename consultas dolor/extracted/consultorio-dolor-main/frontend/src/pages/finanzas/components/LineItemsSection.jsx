import { Plus, Trash2 } from 'lucide-react';
import { fmt } from '../utils/format.js';
import { inputCls } from './FinanzasShared.jsx';

export default function LineItemsSection({ title, items, onUpdate, onAdd, onRemove, descripcionPlaceholder }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium">
          <Plus size={14} /> Agregar línea
        </button>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-12 md:col-span-6">
              <input
                placeholder={descripcionPlaceholder}
                value={it.descripcion}
                onChange={e => onUpdate(i, { descripcion: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="col-span-3 md:col-span-2">
              <input
                type="number" min="1" step="1"
                placeholder="Cant."
                value={it.cantidad}
                onChange={e => onUpdate(i, { cantidad: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <input
                type="number" min="0" step="0.01"
                placeholder="Precio unitario"
                value={it.precio_unitario}
                onChange={e => onUpdate(i, { precio_unitario: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="col-span-3 md:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(i)}
                disabled={items.length <= 1}
                className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="col-span-12 text-right text-sm text-slate-500 -mt-1">
              Subtotal línea: <span className="tabular-nums font-medium text-slate-700">
                {fmt((Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
