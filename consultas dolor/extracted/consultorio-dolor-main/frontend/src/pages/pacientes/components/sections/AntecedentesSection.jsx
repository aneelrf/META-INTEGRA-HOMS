import { Field, Section, input } from '../PacientesShared.jsx';

export default function AntecedentesSection({ data, set }) {
  return (
    <Section title="Antecedentes (resumen rápido)">
      <p className="text-xs text-slate-500 mb-3">
        Para antecedentes detallados (patológicos, exposición tóxicos, etc.) usa la Historia Clínica completa desde la pestaña correspondiente.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field full label="Personales"><textarea rows={2} className={input} value={data.antecedentes_personales} onChange={e => set('antecedentes_personales', e.target.value)} /></Field>
        <Field full label="Familiares"><textarea rows={2} className={input} value={data.antecedentes_familiares} onChange={e => set('antecedentes_familiares', e.target.value)} /></Field>
        <Field full label="Alergias"><textarea rows={2} className={input} value={data.antecedentes_alergicos} onChange={e => set('antecedentes_alergicos', e.target.value)} /></Field>
        <Field full label="Quirúrgicos"><textarea rows={2} className={input} value={data.antecedentes_quirurgicos} onChange={e => set('antecedentes_quirurgicos', e.target.value)} /></Field>
      </div>
    </Section>
  );
}
