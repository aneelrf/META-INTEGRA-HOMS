import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleDollarSign, Plus, TrendingUp, Users, Wallet } from 'lucide-react';
import DeudoresList from './finanzas/components/DeudoresList.jsx';
import InvoicesTable from './finanzas/components/InvoicesTable.jsx';
import MonthlyChart from './finanzas/components/MonthlyChart.jsx';
import StatCard from './finanzas/components/StatCard.jsx';
import { getDeudores, getPorMes, getSummary } from './finanzas/services/financesService.js';
import { listInvoices } from './finanzas/services/invoicesService.js';
import { fmt } from './finanzas/utils/format.js';

export default function Finanzas() {
  const [summary, setSummary] = useState(null);
  const [deudores, setDeudores] = useState([]);
  const [porMes, setPorMes] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    getSummary().then(setSummary).catch(() => {});
    getDeudores().then(setDeudores).catch(() => {});
    getPorMes().then(setPorMes).catch(() => {});
    listInvoices().then(setInvoices).catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Finanzas</h1>
          <p className="text-sm text-slate-500 mt-1">Presupuestos, facturas, pagos y cobros</p>
        </div>
        <div className="flex gap-2">
          <Link to="/finanzas/presupuesto/nuevo" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium">
            <Plus size={16} /> Presupuesto
          </Link>
          <Link to="/finanzas/factura/nueva" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-sm">
            <Plus size={16} /> Factura
          </Link>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Wallet} tone="rose" label="Por cobrar"
            value={fmt(summary.total_pendiente)}
            hint={`${summary.pacientes_con_deuda} paciente${summary.pacientes_con_deuda !== 1 ? 's' : ''} con deuda`}
          />
          <StatCard
            icon={TrendingUp} tone="brand" label="Facturado este mes"
            value={fmt(summary.facturado_mes)}
            hint={`${summary.facturas_mes} factura${summary.facturas_mes !== 1 ? 's' : ''}`}
          />
          <StatCard
            icon={CircleDollarSign} tone="emerald" label="Cobrado este mes"
            value={fmt(summary.cobrado_mes)}
            hint={`${summary.pagos_mes} pago${summary.pagos_mes !== 1 ? 's' : ''}`}
          />
          <StatCard
            icon={Users} tone="slate" label="Cobrado histórico"
            value={fmt(summary.cobrado_global)} hint="total acumulado"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Deudores</h3>
          <DeudoresList deudores={deudores} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Últimos 12 meses</h3>
          <MonthlyChart months={porMes} />
        </div>
      </div>

      <InvoicesTable invoices={invoices} />
    </div>
  );
}
