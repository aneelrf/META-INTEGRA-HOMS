import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Printer } from 'lucide-react';
import { EvaBadge } from '../shared/Badges.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import { getPatientConsultations } from '../services/patientDetailService.js';

export default function ConsultasTab({ patientId, canWrite }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    getPatientConsultations(patientId).then(setItems);
  }, [patientId]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Historial de consultas</h2>
        {canWrite && (
          <Link to={`/pacientes/${patientId}/consulta/nueva`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">
            <Plus size={16} /> Nueva consulta
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState icon={FileText} text="Sin consultas registradas." />
      ) : (
        <ul className="space-y-2">
          {items.map(c => (
            <li key={c.id} className="bg-white border border-slate-200 rounded-xl shadow-card hover:shadow-card-hover hover:border-slate-300 transition flex justify-between items-stretch gap-0 overflow-hidden">
              <Link to={`/pacientes/${patientId}/consulta/${c.id}`} className="flex-1 p-4 min-w-0 hover:bg-slate-50 transition">
                <div className="text-xs text-slate-500">{new Date(c.date).toLocaleString('es-DO')}</div>
                <div className="font-medium mt-1 text-slate-900 truncate">{c.motivo_consulta || 'Consulta'}</div>
                {c.diagnostico && <div className="text-sm text-slate-600 mt-1">Dx: {c.diagnostico}</div>}
              </Link>
              <div className="flex items-center gap-3 shrink-0 p-4 border-l border-slate-100">
                {c.eva !== null && c.eva !== undefined && <EvaBadge value={c.eva} />}
                <Link to={`/print/receta/${c.id}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
                  <Printer size={14} /> Indicaciones
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
