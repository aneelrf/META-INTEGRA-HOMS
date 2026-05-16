import { useNavigate, useParams } from 'react-router-dom';
import HistoriaFormActions from './historia-clinica-form/components/HistoriaFormActions.jsx';
import HistoriaFormBody from './historia-clinica-form/components/HistoriaFormBody.jsx';
import HistoriaFormHeader from './historia-clinica-form/components/HistoriaFormHeader.jsx';
import { useHistoriaForm } from './historia-clinica-form/hooks/useHistoriaForm.js';

export default function HistoriaClinicaForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const {
    patient, form, tono, reflejos, historiaId,
    loaded, saving, error,
    setField, setTono, setReflejos, save,
  } = useHistoriaForm(patientId);

  async function submit(e) {
    e.preventDefault();
    if (await save()) navigate(`/pacientes/${patientId}`);
  }

  if (!loaded || !patient) return <div className="p-8 text-slate-500">Cargando...</div>;

  return (
    <div className="p-8 max-w-5xl">
      <HistoriaFormHeader patientId={patientId} patient={patient} historiaId={historiaId} fecha={form.fecha} />
      <form onSubmit={submit} className="space-y-6">
        <HistoriaFormBody
          form={form}
          tono={tono}
          reflejos={reflejos}
          setField={setField}
          setTono={setTono}
          setReflejos={setReflejos}
        />
        <HistoriaFormActions patientId={patientId} historiaId={historiaId} saving={saving} error={error} />
      </form>
    </div>
  );
}
