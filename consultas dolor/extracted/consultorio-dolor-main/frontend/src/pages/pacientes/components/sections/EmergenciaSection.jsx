import { Field, Section, input } from '../PacientesShared.jsx';

export default function EmergenciaSection({ data, set }) {
  return (
    <Section title="Contacto de emergencia">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre"><input className={input} value={data.contacto_emergencia_nombre} onChange={e => set('contacto_emergencia_nombre', e.target.value)} /></Field>
        <Field label="Teléfono"><input className={input} value={data.contacto_emergencia_telefono} onChange={e => set('contacto_emergencia_telefono', e.target.value)} /></Field>
      </div>
    </Section>
  );
}
