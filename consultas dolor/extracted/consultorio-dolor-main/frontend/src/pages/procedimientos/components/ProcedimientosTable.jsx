import { Link } from 'react-router-dom';
import { Activity, AlertCircle } from 'lucide-react';

const tipoStyles = {
  bloqueo: 'bg-brand-100 text-brand-800',
  infiltracion: 'bg-violet-100 text-violet-800',
  neuromodulacion: 'bg-amber-100 text-amber-800',
};

export default function ProcedimientosTable({ items, loading }) {
  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Cargando...</div>;
  }
  if (items.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Activity size={20} className="text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">Sin procedimientos en este rango.</p>
      </div>
    );
  }
  return (
    <table className="w-full">
      <thead className="bg-slate-50 text-xs uppercase text-slate-600 tracking-wider">
        <tr>
          <th className="text-left px-5 py-3 font-semibold">Fecha</th>
          <th className="text-left px-5 py-3 font-semibold">Paciente</th>
          <th className="text-left px-5 py-3 font-semibold">Tipo</th>
          <th className="text-left px-5 py-3 font-semibold">Descripción</th>
          <th className="text-left px-5 py-3 font-semibold">Zona</th>
          <th className="text-left px-5 py-3 font-semibold">Resultado</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map(p => (
          <tr key={p.id} className="hover:bg-slate-50">
            <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">
              {new Date(p.fecha).toLocaleDateString('es-DO')}
            </td>
            <td className="px-5 py-3">
              <Link to={`/pacientes/${p.patient_id}`} className="text-sm font-medium text-slate-900 hover:text-brand-700">
                {p.paciente_nombre}
              </Link>
            </td>
            <td className="px-5 py-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tipoStyles[p.tipo] || 'bg-slate-100 text-slate-700'}`}>
                {p.tipo}
              </span>
            </td>
            <td className="px-5 py-3 text-sm text-slate-700">{p.subtipo || '—'}</td>
            <td className="px-5 py-3 text-sm text-slate-600">{p.zona || '—'}</td>
            <td className="px-5 py-3 text-sm text-slate-600 max-w-xs">
              <div className="flex items-start gap-1">
                {p.complicaciones && <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />}
                <span className="truncate">{p.resultado || p.complicaciones || '—'}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
