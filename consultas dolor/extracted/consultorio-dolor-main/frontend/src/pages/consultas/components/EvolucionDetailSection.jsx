import { FileText } from 'lucide-react';
import { Card } from './ConsultasShared.jsx';

const FIELDS = [
  ['motivo_consulta', 'Motivo de consulta'],
  ['antecedentes_relevantes', 'Antecedentes relevantes'],
  ['examen_fisico', 'Examen físico'],
  ['diagnostico', 'Diagnóstico'],
  ['plan', 'Plan / recomendaciones'],
];

function Item({ label, value }) {
  if (!value) return null;
  return (
    <div className="mb-4 last:mb-0">
      <div className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-slate-800 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

export default function EvolucionDetailSection({ consulta }) {
  const empty = FIELDS.every(([key]) => !consulta[key]);
  return (
    <Card icon={FileText} title="Evolución">
      {FIELDS.map(([key, label]) => (
        <Item key={key} label={label} value={consulta[key]} />
      ))}
      {empty && <p className="text-sm text-slate-500 italic">Sin contenido en esta consulta.</p>}
    </Card>
  );
}
