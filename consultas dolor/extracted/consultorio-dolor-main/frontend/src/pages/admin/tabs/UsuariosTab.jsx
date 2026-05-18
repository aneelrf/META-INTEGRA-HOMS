import { useEffect, useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { PermissionDenied } from '../components/AdminShared.jsx';
import { getUsers, updateUserActive } from '../services/adminService.js';

export default function UsuariosTab({ isAdmin }) {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const users = await getUsers();
      setUsers(users);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function toggle(u) {
    setErr('');
    try {
      await updateUserActive(u.id, !u.active);
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  if (!isAdmin) return <PermissionDenied />;

  const roleStyles = {
    admin: 'bg-violet-100 text-violet-800',
    medico: 'bg-brand-100 text-brand-800',
    secretaria: 'bg-slate-100 text-slate-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuarios del sistema</h3>
      </div>

      <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2 text-sm text-sky-900">
        <Info size={16} className="shrink-0 mt-0.5" />
        <p>
          Crea usuarios en Firebase Auth y asigna permisos agregando su correo en FIREBASE_RULES.md.
          Esta lista muestra los perfiles que ya iniciaron sesion; aqui solo puedes activar o desactivar acceso.
        </p>
      </div>

      {err && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle size={14} />{err}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
        <table className="w-full">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600 tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Usuario</th>
              <th className="text-left px-5 py-3 font-semibold">Nombre</th>
              <th className="text-left px-5 py-3 font-semibold">Rol</th>
              <th className="text-left px-5 py-3 font-semibold">Estado</th>
              <th className="w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-slate-500">Cargando usuarios...</td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-slate-500">
                  No hay perfiles registrados todavia.
                </td>
              </tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{u.email || u.username}</td>
                <td className="px-5 py-3 text-slate-600">{u.full_name}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleStyles[u.role] || 'bg-slate-100 text-slate-700'}`}>{u.role}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => toggle(u)} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                    {u.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
