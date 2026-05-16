import { Field, Section, input } from '../PacientesShared.jsx';

export default function ContactoSection({ data, set }) {
  return (
    <Section title="Contacto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Celular"><input className={input} value={data.telefono} onChange={e => set('telefono', e.target.value)} /></Field>
        <Field label="Teléfono 1"><input className={input} value={data.telefono_2} onChange={e => set('telefono_2', e.target.value)} /></Field>
        <Field label="Teléfono 2"><input className={input} value={data.telefono_otro} onChange={e => set('telefono_otro', e.target.value)} /></Field>
        <Field label="Email"><input type="email" className={input} value={data.email} onChange={e => set('email', e.target.value)} /></Field>
        <Field full label="Dirección"><input className={input} value={data.direccion} onChange={e => set('direccion', e.target.value)} /></Field>
      </div>
    </Section>
  );
}
