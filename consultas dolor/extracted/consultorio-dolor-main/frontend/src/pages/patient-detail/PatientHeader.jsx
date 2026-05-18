import { Link } from 'react-router-dom';
import { Pencil, Printer, Trash2 } from 'lucide-react';
import { calcularEdad } from './utils/forms.js';

export default function PatientHeader({ patient, patientId, user, onDelete }) {
  const initials = (patient.nombre[0] + (patient.apellido[0] || '')).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 mb-6 flex justify-between items-start gap-4 flex-wrap">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center text-xl font-semibold shrink-0 shadow-sm">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 truncate">{patient.nombre} {patient.apellido}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {patient.cedula || 'Sin cédula'}
            {patient.telefono && <> · {patient.telefono}</>}
            {patient.fecha_nacimiento && <> · {calcularEdad(patient.fecha_nacimiento)} años</>}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap justify-end">
        <Link to={`/pacientes/${patientId}/editar`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700">
          <Pencil size={14} /> Editar
        </Link>
        {user.role === 'admin' && (
          <button onClick={onDelete} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium">
            <Trash2 size={14} /> Eliminar
          </button>
        )}
        <Link to={`/print/informe/${patientId}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium">
          <Printer size={14} /> Informe PDF
        </Link>
      </div>
    </div>
  );
}
