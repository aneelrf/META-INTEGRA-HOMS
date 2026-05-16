import { Link } from 'react-router-dom';
import { fmt } from '../utils/format.js';

export default function DeudoresList({ deudores }) {
  if (deudores.length === 0) return <p className="text-sm text-slate-500">Sin deudas pendientes.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {deudores.slice(0, 15).map(d => (
        <li key={d.id}>
          <Link to={`/pacientes/${d.id}`} className="py-3 flex justify-between items-center hover:bg-slate-50 rounded-lg px-2 -mx-2 transition">
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{d.apellido}, {d.nombre}</div>
              <div className="text-xs text-slate-500">
                {d.facturas_pendientes} factura{d.facturas_pendientes !== 1 ? 's' : ''} pendiente{d.facturas_pendientes !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="font-semibold text-rose-700 tabular-nums shrink-0 ml-2">{fmt(d.deuda)}</div>
          </Link>
        </li>
      ))}
      {deudores.length > 15 && <li className="pt-2 text-center text-xs text-slate-500">+{deudores.length - 15} más</li>}
    </ul>
  );
}
