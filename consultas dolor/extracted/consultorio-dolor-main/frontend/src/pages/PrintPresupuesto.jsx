import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { numeroPresupuesto } from './finanzas/utils/format.js';
import DocumentHeader from './print/components/DocumentHeader.jsx';
import ItemsTablePrint from './print/components/ItemsTablePrint.jsx';
import PatientStrip from './print/components/PatientStrip.jsx';
import PrintActionButton from './print/components/PrintActionButton.jsx';
import PrintLayout from './print/components/PrintLayout.jsx';
import SignatureFooter from './print/components/SignatureFooter.jsx';
import { useAutoPrint } from './print/hooks/useAutoPrint.js';
import { getBudget, getSettings } from './print/services/printService.js';

export default function PrintPresupuesto() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([getBudget(id), getSettings()]).then(([budget, settings]) => {
      setData({ budget, settings });
    });
  }, [id]);

  useAutoPrint(Boolean(data));

  if (!data) return <div className="p-8">Cargando...</div>;
  const { budget, settings } = data;

  return (
    <PrintLayout>
      <DocumentHeader
        settings={settings}
        title="PRESUPUESTO"
        numero={numeroPresupuesto(budget)}
        fecha={budget.fecha}
      />

      <PatientStrip label="Paciente" nombre={budget.paciente_nombre} cedula={budget.cedula} />

      <ItemsTablePrint
        items={budget.items}
        subtotal={budget.subtotal}
        impuesto={budget.impuesto}
        total={budget.total}
        totalLabel="TOTAL ESTIMADO"
      />

      {budget.notas && (
        <section className="mt-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notas</div>
          <p className="text-sm whitespace-pre-wrap">{budget.notas}</p>
        </section>
      )}

      <section className="mt-6 text-xs text-slate-600 italic">
        Este presupuesto es una cotización y no constituye factura. Vigencia: 30 días desde la fecha de emisión.
      </section>

      <SignatureFooter settings={settings} />
      <PrintActionButton />
    </PrintLayout>
  );
}
