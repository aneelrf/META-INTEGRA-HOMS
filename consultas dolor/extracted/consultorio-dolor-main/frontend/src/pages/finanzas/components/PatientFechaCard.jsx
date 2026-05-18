import { Field, inputCls } from './FinanzasShared.jsx';

export default function PatientFechaCard({ patients, patientId, fecha, onPatientChange, onFechaChange }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Paciente *">
          <select required value={patientId} onChange={e => onPatientChange(e.target.value)} className={inputCls}>
            <option value="">-- elegir --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.apellido}, {p.nombre} {p.cedula ? `(${p.cedula})` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha">
          <input type="date" value={fecha} onChange={e => onFechaChange(e.target.value)} className={inputCls} />
        </Field>
      </div>
    </div>
  );
}
