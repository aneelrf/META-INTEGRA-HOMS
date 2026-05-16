import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Printer, Trash2, XCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import InvoiceEstadoBadge from './finanzas/components/InvoiceEstadoBadge.jsx';
import ItemsTable from './finanzas/components/ItemsTable.jsx';
import NotesCard from './finanzas/components/NotesCard.jsx';
import PaymentForm from './finanzas/components/PaymentForm.jsx';
import PaymentsList from './finanzas/components/PaymentsList.jsx';
import {
  addPayment,
  deleteInvoice as deleteInvoiceApi,
  deletePayment,
  getInvoice,
  voidInvoice,
} from './finanzas/services/invoicesService.js';
import { fmt, numeroFactura } from './finanzas/utils/format.js';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [showPayForm, setShowPayForm] = useState(false);

  const canDelete = user.role === 'admin' || user.role === 'medico';

  async function load() { setInvoice(await getInvoice(id)); }
  useEffect(() => { load(); }, [id]);

  async function handlePay(payload) {
    await addPayment(id, payload);
    setShowPayForm(false);
    await load();
  }

  async function handleDeletePago(paymentId) {
    if (!confirm('¿Anular este pago? El balance de la factura se recalculará.')) return;
    await deletePayment(id, paymentId);
    load();
  }

  async function handleVoid() {
    if (!confirm('¿Anular esta factura? No se elimina pero queda marcada como anulada.')) return;
    await voidInvoice(id);
    load();
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta factura permanentemente? Esta acción no se puede deshacer.')) return;
    await deleteInvoiceApi(id);
    navigate('/finanzas');
  }

  if (!invoice) return <div className="p-8 text-slate-500">Cargando...</div>;

  const balance = invoice.total - invoice.pagado;
  const isAnulada = invoice.estado === 'anulada';

  const balanceRows = (
    <>
      <tr>
        <td colSpan={3} className="px-4 py-2 text-right text-slate-600">Pagado</td>
        <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{fmt(invoice.pagado)}</td>
      </tr>
      <tr>
        <td colSpan={3} className="px-4 py-2 text-right font-semibold text-slate-900">Balance</td>
        <td className={`px-4 py-2 text-right tabular-nums font-semibold ${balance > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
          {isAnulada ? '—' : fmt(balance)}
        </td>
      </tr>
    </>
  );

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link to="/finanzas" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
          <ArrowLeft size={14} /> Volver a Finanzas
        </Link>
        <div className="flex justify-between items-start gap-4 flex-wrap mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 font-mono">{numeroFactura(invoice)}</h1>
            <p className="text-sm text-slate-500 mt-1">
              <Link to={`/pacientes/${invoice.patient_id}`} className="text-brand-600 hover:text-brand-700">{invoice.paciente_nombre}</Link>
              {invoice.cedula && <> · {invoice.cedula}</>} · {invoice.fecha}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!isAnulada && balance > 0 && (
              <button onClick={() => setShowPayForm(!showPayForm)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm">
                <Plus size={14} /> Registrar pago
              </button>
            )}
            <Link to={`/print/factura/${id}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium">
              <Printer size={14} /> Imprimir factura
            </Link>
            {canDelete && !isAnulada && (
              <button onClick={handleVoid} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">
                <XCircle size={14} /> Anular
              </button>
            )}
            {user.role === 'admin' && (
              <button onClick={handleDelete} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium">
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <InvoiceEstadoBadge estado={invoice.estado} />
          {invoice.budget_id && (
            <Link to={`/finanzas/presupuesto/${invoice.budget_id}`} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full hover:bg-slate-200">
              desde presupuesto #{invoice.budget_id}
            </Link>
          )}
        </div>
      </div>

      {showPayForm && !isAnulada && balance > 0 && (
        <PaymentForm balanceSugerido={balance} onSubmit={handlePay} onCancel={() => setShowPayForm(false)} />
      )}

      <ItemsTable
        items={invoice.items}
        subtotal={invoice.subtotal}
        impuesto={invoice.impuesto}
        total={invoice.total}
        extraRows={balanceRows}
      />

      <NotesCard notas={invoice.notas} />

      <PaymentsList payments={invoice.payments} canDelete={canDelete} onDelete={handleDeletePago} />
    </div>
  );
}
