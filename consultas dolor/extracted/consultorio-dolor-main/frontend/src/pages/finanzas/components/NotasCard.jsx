import { Field, inputCls } from './FinanzasShared.jsx';

export default function NotasCard({ value, onChange, placeholder }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
      <Field label="Notas (opcional)">
        <textarea
          rows={2}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={inputCls}
          placeholder={placeholder}
        />
      </Field>
    </div>
  );
}
