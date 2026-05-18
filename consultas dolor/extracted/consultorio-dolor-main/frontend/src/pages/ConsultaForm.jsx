import { Link, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, Loader2 } from 'lucide-react';
import BodyMap from '../components/BodyMap.jsx';
import { Card, Field, inputCls } from './consultas/components/ConsultasShared.jsx';
import EvaSlider from './consultas/components/EvaSlider.jsx';
import EvolucionFormSection from './consultas/components/EvolucionFormSection.jsx';
import { useConsultaForm } from './consultas/hooks/useConsultaForm.js';

export default function ConsultaForm() {
  const { patientId, consultationId } = useParams();
  const navigate = useNavigate();
  const {
    patient, form, bodyMapData, loaded, saving, error, isEdit,
    setField, setBodyMapData, save,
  } = useConsultaForm({ patientId, consultationId });

  async function submit(e) {
    e.preventDefault();
    const savedId = await save();
    if (savedId) navigate(`/pacientes/${patientId}/consulta/${savedId}`);
  }

  if (!patient || !loaded) return <div className="p-8 text-slate-500">Cargando...</div>;

  const backTo = isEdit ? `/pacientes/${patientId}/consulta/${consultationId}` : `/pacientes/${patientId}`;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
          <ArrowLeft size={14} /> {isEdit ? 'Volver a la consulta' : 'Volver al paciente'}
        </Link>
        <h1 className="text-2xl font-semibold mt-2 text-slate-900">
          {isEdit ? 'Editar consulta' : 'Nueva consulta'} — <span className="text-slate-600">{patient.nombre} {patient.apellido}</span>
        </h1>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <EvolucionFormSection form={form} setField={setField} />

        <EvaSlider value={form.eva} onChange={v => setField('eva', v)} />

        <Card icon={Activity} title="Mapa corporal — zonas de dolor">
          <BodyMap value={bodyMapData} onChange={setBodyMapData} />
        </Card>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <Field label="Notas adicionales">
            <textarea rows={2} className={inputCls} value={form.notas} onChange={e => setField('notas', e.target.value)} />
          </Field>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2 sticky bottom-4">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Guardar consulta')}
          </button>
          <Link to={backTo} className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-medium">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
