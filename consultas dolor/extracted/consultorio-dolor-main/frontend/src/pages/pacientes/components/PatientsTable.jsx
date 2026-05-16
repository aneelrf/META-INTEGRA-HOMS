import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';

export default function PatientsTable({ patients, loading, query }) {
  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Cargando...</div>;
  }
  if (patients.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Users size={24} className="text-slate-400" />
        </div>
        <p className="text-slate-700 font-medium">
          {query ? `Sin resultados para "${query}"` : 'Aun no hay pacientes'}
        </p>
        {!query && <p className="text-slate-500 text-sm mt-1">Crea el primero con el boton de arriba.</p>}
      </div>
    );
  }
  return (
    <table className="w-full">
      <thead className="bg-slate-50 text-xs uppercase text-slate-600 tracking-wider">
        <tr>
          <th className="text-left px-5 py-3 font-semibold">Paciente</th>
          <th className="text-left px-5 py-3 font-semibold">Direccion</th>
          <th className="text-left px-5 py-3 font-semibold">Referido</th>
          <th className="w-12"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {patients.map(p => (
          <tr key={p.id} className="group hover:bg-slate-50 transition">
            <td className="px-5 py-3">
              <Link to={`/pacientes/${p.id}`} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {(p.nombre[0] + (p.apellido[0] || '')).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{p.apellido}, {p.nombre}</div>
                </div>
              </Link>
            </td>
            <td className="px-5 py-3 text-slate-600 text-sm max-w-md truncate">{p.direccion || '-'}</td>
            <td className="px-5 py-3 text-slate-600 text-sm">{p.referente_nombre || '-'}</td>
            <td className="px-5 py-3 text-right pr-5">
              <Link to={`/pacientes/${p.id}`} className="inline-flex items-center text-slate-400 group-hover:text-brand-600 transition">
                <ChevronRight size={18} />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
