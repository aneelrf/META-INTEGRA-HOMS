import { Field, Section, input } from '../PacientesShared.jsx';

export default function FormacionTrabajoSection({ data, set }) {
  return (
    <Section title="Formación y trabajo">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nivel de escolaridad"><input className={input} value={data.escolaridad} onChange={e => set('escolaridad', e.target.value)} placeholder="ej: Universitario, Bachiller" /></Field>
        <Field label="Profesión u oficio actual"><input className={input} value={data.ocupacion} onChange={e => set('ocupacion', e.target.value)} /></Field>
        <Field full label="Profesiones u oficios anteriores de interés"><input className={input} value={data.profesiones_anteriores} onChange={e => set('profesiones_anteriores', e.target.value)} /></Field>
      </div>
    </Section>
  );
}
