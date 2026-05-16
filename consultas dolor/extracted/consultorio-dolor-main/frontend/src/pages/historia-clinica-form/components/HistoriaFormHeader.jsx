import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';

export default function HistoriaFormHeader({ patientId, patient, historiaId, fecha }) {
  return (
    <div className="mb-6">
      <Link to={`/pacientes/${patientId}`} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
        <ArrowLeft size={14} /> Volver al paciente
      </Link>
      <div className="flex justify-between items-start gap-3 flex-wrap mt-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {historiaId ? 'Editar' : 'Nueva'} historia clínica — <span className="text-slate-600">{patient.nombre} {patient.apellido}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Unidad del Dolor · fecha {fecha || new Date().toISOString().slice(0, 10)}</p>
        </div>
        {historiaId && (
          <Link to={`/print/historia-clinica/${patientId}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium">
            <Printer size={14} /> Imprimir
          </Link>
        )}
      </div>
    </div>
  );
}
