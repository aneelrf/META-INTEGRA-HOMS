import { Link } from 'react-router-dom';
import { fmt, numeroFactura } from '../utils/format.js';
import InvoiceEstadoBadge from './InvoiceEstadoBadge.jsx';

export default function InvoicesTable({ invoices }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Facturas recientes</h3>
        <span className="text-xs text-slate-500">{invoices.length} mostradas</span>
      </div>
      {invoices.length === 0 ? (
        <p className="p-6 text-slate-500 text-sm text-center">Aún no hay facturas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600 tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Número</th>
                <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold">Paciente</th>
                <th className="text-right px-4 py-3 font-semibold">Total</th>
                <th className="text-right px-4 py-3 font-semibold">Pagado</th>
                <th className="text-right px-4 py-3 font-semibold">Balance</th>
                <th className="text-left px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(i => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    <Link to={`/finanzas/factura/${i.id}`} className="font-mono text-brand-600 hover:text-brand-700">
                      {numeroFactura(i)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{i.fecha}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link to={`/pacientes/${i.patient_id}`} className="text-slate-900 hover:text-brand-700">{i.paciente_nombre}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums text-slate-700 whitespace-nowrap">{fmt(i.total)}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums text-emerald-700 whitespace-nowrap">{fmt(i.pagado)}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums font-medium whitespace-nowrap">
                    {i.estado === 'anulada' ? '—' : fmt(i.total - i.pagado)}
                  </td>
                  <td className="px-4 py-3"><InvoiceEstadoBadge estado={i.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
