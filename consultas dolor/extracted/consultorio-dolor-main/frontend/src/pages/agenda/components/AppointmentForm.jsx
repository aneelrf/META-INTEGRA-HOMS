export const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export default function AppointmentForm({ form, setForm, patients, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-card animate-fade-in">
      <label className="block md:col-span-2">
        <span className="text-xs font-medium text-slate-600 mb-1 block">Paciente *</span>
        <select required value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} className={inputCls}>
          <option value="">-- elegir --</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.apellido}, {p.nombre} {p.cedula ? `(${p.cedula})` : ''}
            </option>
          ))}
        </select>
      </label>
      <Field label="Tipo">
        <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inputCls}>
          <option value="cita">Cita programada</option>
          <option value="walkin">Sin cita</option>
          <option value="followup">Seguimiento</option>
        </select>
      </Field>
      <Field label="Fecha">
        <input required type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Hora">
        <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Motivo">
        <input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} className={inputCls} />
      </Field>
      <div className="md:col-span-2 flex gap-2">
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">Guardar</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium">Cancelar</button>
      </div>
    </form>
  );
}

