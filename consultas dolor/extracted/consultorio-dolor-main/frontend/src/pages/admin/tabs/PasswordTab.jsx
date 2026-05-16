import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Field, inputCls } from '../components/AdminShared.jsx';
import { changePassword } from '../services/adminService.js';

export default function PasswordTab() {
  const [old_password, setOld] = useState('');
  const [new_password, setNew] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const minLength = 6;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      await changePassword({ old_password, new_password });
      setOld('');
      setNew('');
      setMsg('Contrasena actualizada correctamente.');
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md space-y-4 shadow-card">
      <Field label="Contrasena actual">
        <input
          type="password"
          required
          className={inputCls}
          value={old_password}
          onChange={e => setOld(e.target.value)}
        />
      </Field>

      <Field label={`Nueva contrasena (minimo ${minLength} caracteres)`}>
        <input
          type="password"
          required
          minLength={minLength}
          className={inputCls}
          value={new_password}
          onChange={e => setNew(e.target.value)}
        />
      </Field>

      {msg && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}

      {err && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle size={14} />{err}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Cambiar contrasena'}
      </button>
    </form>
  );
}
