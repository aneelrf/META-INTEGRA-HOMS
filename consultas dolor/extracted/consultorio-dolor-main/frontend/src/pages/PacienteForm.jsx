import { Link, useNavigate, useParams } from 'react-router-dom';
import PacienteFormBody from './pacientes/components/PacienteFormBody.jsx';
import { usePacienteForm } from './pacientes/hooks/usePacienteForm.js';

export default function PacienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, set, save, saving, error, isEdit } = usePacienteForm(id);

  async function submit(e) {
    e.preventDefault();
    const savedId = await save();
    if (savedId) navigate(`/pacientes/${savedId}`);
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">{isEdit ? 'Editar paciente' : 'Nuevo paciente'}</h1>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-card">
        <PacienteFormBody data={data} set={set} />

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <Link to={isEdit ? `/pacientes/${id}` : '/pacientes'} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
