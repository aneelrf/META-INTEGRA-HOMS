import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FormActions from './finanzas/components/FormActions.jsx';
import LineItemsSection from './finanzas/components/LineItemsSection.jsx';
import NotasCard from './finanzas/components/NotasCard.jsx';
import PatientFechaCard from './finanzas/components/PatientFechaCard.jsx';
import TotalsSection from './finanzas/components/TotalsSection.jsx';
import { useLineItems } from './finanzas/hooks/useLineItems.js';
import { createBudget } from './finanzas/services/budgetsService.js';
import { listPatientsForSelect } from './finanzas/services/patientsLookup.js';

export default function BudgetForm() {
  const [searchParams] = useSearchParams();
  const prefilledPatient = searchParams.get('patient');
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(prefilledPatient || '');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [impuesto, setImpuesto] = useState('0');
  const [notas, setNotas] = useState('');
  const lineItems = useLineItems();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { listPatientsForSelect().then(setPatients); }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const items = lineItems.clean();
      if (!items.length) throw new Error('Agrega al menos un item con descripción');
      const d = await createBudget({
        patient_id: patientId,
        fecha,
        impuesto: Number(impuesto) || 0,
        notas: notas || null,
        items,
      });
      navigate(`/finanzas/presupuesto/${d.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link to="/finanzas" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
          <ArrowLeft size={14} /> Volver a Finanzas
        </Link>
        <h1 className="text-2xl font-semibold mt-2 text-slate-900">Nuevo presupuesto</h1>
        <p className="text-sm text-slate-500 mt-1">Cotización para un tratamiento. Podrás convertirlo en factura después.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <PatientFechaCard
          patients={patients}
          patientId={patientId}
          fecha={fecha}
          onPatientChange={setPatientId}
          onFechaChange={setFecha}
        />

        <LineItemsSection
          title="Items del tratamiento"
          items={lineItems.items}
          onUpdate={lineItems.update}
          onAdd={lineItems.add}
          onRemove={lineItems.remove}
          descripcionPlaceholder="Descripción (ej: 4 bloqueos epidurales)"
        />

        <TotalsSection subtotal={lineItems.subtotal} impuesto={impuesto} onImpuestoChange={setImpuesto} totalLabel="Total estimado" />

        <NotasCard value={notas} onChange={setNotas} placeholder="ej: Plan de 4 meses con 3 sesiones mensuales" />

        <FormActions saving={saving} error={error} submitLabel="Crear presupuesto" />
      </form>
    </div>
  );
}
