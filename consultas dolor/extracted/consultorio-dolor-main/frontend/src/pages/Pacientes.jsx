import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PatientSearchBox from './pacientes/components/PatientSearchBox.jsx';
import PatientsTable from './pacientes/components/PatientsTable.jsx';
import { usePatientList } from './pacientes/hooks/usePatientList.js';

export default function Pacientes() {
  const [q, setQ] = useState('');
  const { patients, loading } = usePatientList(q);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-1">{patients.length} en lista</p>
        </div>
        <Link
          to="/pacientes/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-sm"
        >
          <Plus size={16} strokeWidth={2.2} />
          Nuevo paciente
        </Link>
      </div>

      <PatientSearchBox value={q} onChange={setQ} />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
        <PatientsTable patients={patients} loading={loading} query={q} />
      </div>
    </div>
  );
}
