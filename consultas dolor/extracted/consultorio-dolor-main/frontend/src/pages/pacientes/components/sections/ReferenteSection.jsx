import { Field, Section, input } from '../PacientesShared.jsx';

export default function ReferenteSection({ data, set }) {
  return (
    <Section title="Familiar o persona quien lo refirió">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre"><input className={input} value={data.referente_nombre} onChange={e => set('referente_nombre', e.target.value)} /></Field>
        <Field label="Teléfono"><input className={input} value={data.referente_telefono} onChange={e => set('referente_telefono', e.target.value)} /></Field>
        <Field full label="Dirección"><input className={input} value={data.referente_direccion} onChange={e => set('referente_direccion', e.target.value)} /></Field>
      </div>
    </Section>
  );
}
