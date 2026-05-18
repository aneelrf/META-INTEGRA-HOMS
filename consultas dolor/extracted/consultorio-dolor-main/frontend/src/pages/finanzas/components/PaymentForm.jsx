import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Field, inputCls } from './FinanzasShared.jsx';

const EMPTY = { monto: '', metodo: 'efectivo', referencia: '', notas: '' };

export default function PaymentForm({ balanceSugerido, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setPaying(true);
    setError('');
    try {
      const monto = Number(form.monto);
      if (!monto || monto <= 0) throw new Error('Monto inválido');
      await onSubmit({
        monto,
        metodo: form.metodo || null,
        referencia: form.referencia || null,
        notas: form.notas || null,
      });
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-emerald-200 p-5 mb-6 shadow-card animate-fade-in">
      <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-3">Registrar pago</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Monto *">
          <input
            type="number" required min="0.01" step="0.01" autoFocus
            value={form.monto}
            onChange={e => setForm({ ...form, monto: e.target.value })}
            className={inputCls}
            placeholder={`Máx sugerido: ${balanceSugerido.toFixed(2)}`}
          />
        </Field>
        <Field label="Método">
          <select value={form.metodo} onChange={e => setForm({ ...form, metodo: e.target.value })} className={inputCls}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
            <option value="otro">Otro</option>
          </select>
        </Field>
        <Field label="Referencia (opcional)">
          <input value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} className={inputCls} placeholder="ej: # autorización, # transferencia" />
        </Field>
        <Field label="Notas (opcional)">
          <input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className={inputCls} />
        </Field>
      </div>
      {error && <div className="text-sm text-red-700 mt-3">{error}</div>}
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={paying} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50">
          {paying && <Loader2 size={14} className="animate-spin" />}
          Guardar pago
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium">Cancelar</button>
      </div>
    </form>
  );
}
