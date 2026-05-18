import { FileText } from 'lucide-react';
import { Card, Field, inputCls } from './ConsultasShared.jsx';

const FIELDS = [
  ['motivo_consulta', 'Motivo de consulta', 2],
  ['antecedentes_relevantes', 'Antecedentes relevantes', 2],
  ['examen_fisico', 'Examen físico', 3],
  ['diagnostico', 'Diagnóstico', 2],
  ['plan', 'Plan / recomendaciones', 4, 'Procedimientos a realizar, recomendaciones, seguimiento...'],
];

export default function EvolucionFormSection({ form, setField }) {
  return (
    <Card icon={FileText} title="Evolución">
      {FIELDS.map(([key, label, rows, placeholder]) => (
        <Field key={key} label={label}>
          <textarea
            rows={rows}
            className={inputCls}
            value={form[key]}
            onChange={e => setField(key, e.target.value)}
            placeholder={placeholder}
          />
        </Field>
      ))}
    </Card>
  );
}
