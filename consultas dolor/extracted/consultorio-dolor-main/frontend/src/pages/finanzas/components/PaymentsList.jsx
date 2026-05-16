import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { fmt, numeroRecibo } from '../utils/format.js';

export default function PaymentsList({ payments, canDelete, onDelete }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Pagos recibidos</h2>
      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-card">
          <p className="text-sm text-slate-500">Aún no se han registrado pagos.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {payments.map(pay => (
            <li key={pay.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex justify-between items-center flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-slate-500">{numeroRecibo(pay)}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{pay.metodo || 'pago'}</span>
                </div>
                <div className="text-sm text-slate-600 mt-1">{new Date(pay.fecha).toLocaleString('es-DO')}</div>
                {pay.referencia && <div className="text-xs text-slate-500 mt-0.5">Ref: {pay.referencia}</div>}
                {pay.notas && <div className="text-xs text-slate-500 mt-0.5">{pay.notas}</div>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold tabular-nums text-emerald-700 text-lg">{fmt(pay.monto)}</span>
                <Link to={`/print/recibo/${pay.id}`} target="_blank" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  Recibo
                </Link>
                {canDelete && (
                  <button onClick={() => onDelete(pay.id)} className="p-1.5 text-slate-400 hover:text-rose-600" title="Anular pago">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
