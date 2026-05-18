import { useEffect, useState } from 'react';
import { Field, inputCls, PermissionDenied } from '../components/AdminShared.jsx';
import { getSettings, updateSettings } from '../services/adminService.js';

export default function ConsultorioTab({ isAdmin }) {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { getSettings().then(setS); }, []);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      await updateSettings(s);
      setMsg('Guardado.');
    } catch (e) { setMsg(e.message); }
    finally { setSaving(false); }
  }

  if (!s) return <p className="text-slate-500">Cargando...</p>;
  if (!isAdmin) return <PermissionDenied />;

  const fields = [
    ['medico_nombre', 'Nombre del médico'],
    ['medico_exequatur', 'Exequátur'],
    ['medico_especialidad', 'Especialidad'],
    ['consultorio_nombre', 'Nombre del consultorio'],
    ['direccion', 'Dirección'],
    ['telefono', 'Teléfono'],
    ['email', 'Email'],
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
      <p className="text-sm text-slate-600">
        Estos datos aparecen en el encabezado de los PDFs e informes.
      </p>
      {fields.map(([k, label]) => (
        <label key={k} className="block">
          <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
          <input className={inputCls} value={s[k] || ''} onChange={e => setS({ ...s, [k]: e.target.value })} />
        </label>
      ))}
      {msg && <div className="text-sm text-emerald-700">{msg}</div>}
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}

