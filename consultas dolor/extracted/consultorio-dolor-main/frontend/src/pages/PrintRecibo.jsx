import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fmt, numeroFactura, numeroRecibo } from './finanzas/utils/format.js';
import DocumentHeader from './print/components/DocumentHeader.jsx';
import PrintActionButton from './print/components/PrintActionButton.jsx';
import PrintLayout from './print/components/PrintLayout.jsx';
import SignatureFooter from './print/components/SignatureFooter.jsx';
import { useAutoPrint } from './print/hooks/useAutoPrint.js';
import {
  getInvoice,
  getInvoicesIndex,
  getPaymentById,
  getSettings,
} from './print/services/printService.js';
import { montoEnLetras } from './print/utils/numberToWords.js';

async function findPaymentAndInvoice(paymentId) {
  const direct = await getPaymentById(paymentId);
  if (direct) {
    const invoice = await getInvoice(direct.invoice_id);
    return { payment: direct, invoice };
  }
  const invs = await getInvoicesIndex();
  for (const inv of invs) {
    const det = await getInvoice(inv.id);
    const p = det.payments.find(p => String(p.id) === String(paymentId));
    if (p) return { payment: p, invoice: det };
  }
  return { payment: null, invoice: null };
}

export default function PrintRecibo() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { payment, invoice } = await findPaymentAndInvoice(id);
      const settings = await getSettings();
      setData({ payment, invoice, settings });
    })();
  }, [id]);

  useAutoPrint(Boolean(data?.payment));

  if (!data || !data.payment) return <div className="p-8">Cargando...</div>;
  const { payment, invoice, settings } = data;
  const invoiceNumero = invoice ? numeroFactura(invoice) : '';

  return (
    <PrintLayout>
      <DocumentHeader
        settings={settings}
        title="RECIBO"
        numero={numeroRecibo(payment)}
        fecha={payment.fecha.slice(0, 10)}
      />

      <section className="mb-8">
        <p className="text-sm leading-relaxed">
          Recibí de <strong className="border-b border-slate-400 px-2">{invoice?.paciente_nombre || '—'}</strong>
          {invoice?.cedula && <>, cédula <strong>{invoice.cedula}</strong></>},
          la cantidad de <strong className="text-xl">{fmt(payment.monto)}</strong>
          <span className="italic text-slate-700"> ({montoEnLetras(payment.monto)})</span>,
          {' '}por concepto de abono a <strong>{invoiceNumero}</strong>.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-6 text-sm mb-8">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Método de pago</div>
          <div className="capitalize mt-1">{payment.metodo || 'Efectivo'}</div>
        </div>
        {payment.referencia && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Referencia</div>
            <div className="mt-1">{payment.referencia}</div>
          </div>
        )}
        {invoice && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Factura</div>
            <div className="mt-1">{invoiceNumero}</div>
          </div>
        )}
        {invoice && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance actual</div>
            <div className="mt-1 tabular-nums">
              Total {fmt(invoice.total)} · Pagado {fmt(invoice.pagado)} · Pendiente <strong>{fmt(invoice.total - invoice.pagado)}</strong>
            </div>
          </div>
        )}
      </div>

      {payment.notas && (
        <section className="mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notas</div>
          <p className="text-sm">{payment.notas}</p>
        </section>
      )}

      <SignatureFooter settings={settings} label="Recibí conforme" />
      <PrintActionButton />
    </PrintLayout>
  );
}
