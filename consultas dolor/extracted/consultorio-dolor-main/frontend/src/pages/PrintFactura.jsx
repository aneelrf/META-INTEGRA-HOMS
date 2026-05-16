import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fmt, numeroFactura } from './finanzas/utils/format.js';
import DocumentHeader from './print/components/DocumentHeader.jsx';
import ItemsTablePrint from './print/components/ItemsTablePrint.jsx';
import PatientStrip from './print/components/PatientStrip.jsx';
import PrintActionButton from './print/components/PrintActionButton.jsx';
import PrintLayout from './print/components/PrintLayout.jsx';
import SignatureFooter from './print/components/SignatureFooter.jsx';
import { useAutoPrint } from './print/hooks/useAutoPrint.js';
import { getInvoice, getSettings } from './print/services/printService.js';

export default function PrintFactura() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([getInvoice(id), getSettings()]).then(([invoice, settings]) => {
      setData({ invoice, settings });
    });
  }, [id]);

  useAutoPrint(Boolean(data));

  if (!data) return <div className="p-8">Cargando...</div>;
  const { invoice, settings } = data;
  const balance = invoice.total - invoice.pagado;
  const isAnulada = invoice.estado === 'anulada';

  const balanceRows = (
    <>
      <tr>
        <td colSpan={3} className="py-2 text-right text-slate-600">Pagado</td>
        <td className="py-2 text-right tabular-nums text-emerald-700">{fmt(invoice.pagado)}</td>
      </tr>
      <tr className="border-t border-slate-300">
        <td colSpan={3} className="py-2 text-right font-semibold">Balance pendiente</td>
        <td className={`py-2 text-right tabular-nums font-semibold ${balance > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
          {isAnulada ? '—' : fmt(balance)}
        </td>
      </tr>
    </>
  );

  return (
    <PrintLayout>
      <DocumentHeader
        settings={settings}
        title="FACTURA"
        numero={numeroFactura(invoice)}
        fecha={invoice.fecha}
        badge={isAnulada && <div className="text-xs font-bold text-rose-700 mt-1">ANULADA</div>}
      />

      <PatientStrip
        label="Cliente"
        nombre={invoice.paciente_nombre}
        cedula={invoice.cedula}
        telefono={invoice.telefono}
        direccion={invoice.direccion}
      />

      <ItemsTablePrint
        items={invoice.items}
        subtotal={invoice.subtotal}
        impuesto={invoice.impuesto}
        total={invoice.total}
        extraRows={balanceRows}
      />

      {invoice.payments && invoice.payments.length > 0 && (
        <section className="mt-6 mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pagos aplicados</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="text-left py-1">Fecha</th>
                <th className="text-left py-1">Método</th>
                <th className="text-left py-1">Referencia</th>
                <th className="text-right py-1">Monto</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map(p => (
                <tr key={p.id}>
                  <td className="py-1">{p.fecha.slice(0, 10)}</td>
                  <td className="py-1 capitalize">{p.metodo || '-'}</td>
                  <td className="py-1">{p.referencia || '-'}</td>
                  <td className="py-1 text-right tabular-nums">{fmt(p.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {invoice.notas && (
        <section className="mt-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notas</div>
          <p className="text-sm whitespace-pre-wrap">{invoice.notas}</p>
        </section>
      )}

      <SignatureFooter settings={settings} />
      <PrintActionButton />
    </PrintLayout>
  );
}
