import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { BudgetEstadoBadge, InvoiceEstadoBadge } from '../shared/Badges.jsx';
import { getPatientFinances } from '../services/patientDetailService.js';

export default function CuentaTab({ patientId }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    getPatientFinances(patientId).then(setData);
  }, [patientId]);

  const fmt = n => 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!data) return <p className="text-slate-500">Cargando...</p>;
  const { invoices, payments, budgets, summary } = data;

  return (
    <div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facturado</div>
            <div className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">{fmt(summary.total_facturado)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagado</div>
            <div className="text-2xl font-semibold text-emerald-700 tabular-nums mt-1">{fmt(summary.total_pagado)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Por cobrar</div>
            <div className={`text-2xl font-semibold tabular-nums mt-1 ${summary.deuda > 0 ? 'text-rose-700' : 'text-slate-500'}`}>{fmt(summary.deuda)}</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Presupuestos</h2>
        <Link to={`/finanzas/presupuesto/nuevo?patient=${patientId}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium">
          <Plus size={16} /> Presupuesto
        </Link>
      </div>
      {budgets.length === 0 ? (
        <p className="text-sm text-slate-500 mb-6">Sin presupuestos.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {budgets.map(b => (
            <li key={b.id}>
              <Link to={`/finanzas/presupuesto/${b.id}`} className="block bg-white border border-slate-200 rounded-xl p-3 shadow-card hover:shadow-card-hover hover:border-slate-300 transition">
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <div className="font-mono text-xs text-slate-500">PRES-{b.fecha.slice(0,4)}-{String(b.id).padStart(5, '0')}</div>
                    <div className="text-sm text-slate-900 mt-0.5">{b.fecha}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums text-slate-900">{fmt(b.total)}</div>
                    <BudgetEstadoBadge estado={b.estado} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Facturas</h2>
        <Link to={`/finanzas/factura/nueva?patient=${patientId}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">
          <Plus size={16} /> Factura
        </Link>
      </div>
      {invoices.length === 0 ? (
        <p className="text-sm text-slate-500 mb-6">Sin facturas.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {invoices.map(i => (
            <li key={i.id}>
              <Link to={`/finanzas/factura/${i.id}`} className="block bg-white border border-slate-200 rounded-xl p-3 shadow-card hover:shadow-card-hover hover:border-slate-300 transition">
                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <div>
                    <div className="font-mono text-xs text-slate-500">FAC-{i.fecha.slice(0,4)}-{String(i.id).padStart(5, '0')}</div>
                    <div className="text-sm text-slate-900 mt-0.5">{i.fecha}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums text-slate-900">{fmt(i.total)}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 justify-end">
                      Pagado <span className="tabular-nums">{fmt(i.pagado)}</span>
                      <InvoiceEstadoBadge estado={i.estado} />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-lg font-semibold text-slate-900 mb-3">Historial de pagos</h2>
      {payments.length === 0 ? (
        <p className="text-sm text-slate-500">Sin pagos registrados.</p>
      ) : (
        <ul className="space-y-2">
          {payments.map(p => (
            <li key={p.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-card flex justify-between items-center flex-wrap gap-2">
              <div>
                <div className="font-mono text-xs text-slate-500">REC-{p.fecha.slice(0,4)}-{String(p.id).padStart(5, '0')}</div>
                <div className="text-sm text-slate-600 mt-0.5">
                  {p.fecha.slice(0, 10)}
                  {p.metodo && <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{p.metodo}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold tabular-nums text-emerald-700">{fmt(p.monto)}</span>
                <Link to={`/print/recibo/${p.id}`} target="_blank" className="text-xs text-brand-600 hover:text-brand-700 font-medium">Recibo</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
