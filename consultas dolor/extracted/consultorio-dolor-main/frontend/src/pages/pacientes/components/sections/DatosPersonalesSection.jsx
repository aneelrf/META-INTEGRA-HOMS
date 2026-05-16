import { Field, Section, input } from '../PacientesShared.jsx';

export default function DatosPersonalesSection({ data, set }) {
  return (
    <Section title="Datos personales">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombres *"><input required className={input} value={data.nombre} onChange={e => set('nombre', e.target.value)} /></Field>
        <Field label="Apellidos *"><input required className={input} value={data.apellido} onChange={e => set('apellido', e.target.value)} /></Field>
        <Field label="Apodo"><input className={input} value={data.apodo} onChange={e => set('apodo', e.target.value)} /></Field>
        <Field label="Cédula"><input className={input} value={data.cedula} onChange={e => set('cedula', e.target.value)} /></Field>
        <Field label="Nacionalidad"><input className={input} value={data.nacionalidad} onChange={e => set('nacionalidad', e.target.value)} placeholder="ej: Dominicana" /></Field>
        <Field label="Fecha de nacimiento"><input type="date" className={input} value={data.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} /></Field>
        <Field label="Sexo">
          <select className={input} value={data.genero} onChange={e => set('genero', e.target.value)}>
            <option value="">--</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="otro">Otro</option>
          </select>
        </Field>
        <Field label="Identidad de género"><input className={input} value={data.identidad_genero} onChange={e => set('identidad_genero', e.target.value)} placeholder="opcional" /></Field>
        <Field label="Estado civil">
          <select className={input} value={data.estado_civil} onChange={e => set('estado_civil', e.target.value)}>
            <option value="">--</option>
            <option value="soltero">Soltero/a</option>
            <option value="casado">Casado/a</option>
            <option value="union_libre">Unión libre</option>
            <option value="divorciado">Divorciado/a</option>
            <option value="viudo">Viudo/a</option>
          </select>
        </Field>
        <Field label="Número de hijos"><input type="number" min="0" className={input} value={data.numero_hijos} onChange={e => set('numero_hijos', e.target.value)} /></Field>
        <Field label="Lugar de origen"><input className={input} value={data.lugar_origen} onChange={e => set('lugar_origen', e.target.value)} /></Field>
        <Field label="Tipo de sangre">
          <select className={input} value={data.tipo_sangre} onChange={e => set('tipo_sangre', e.target.value)}>
            <option value="">--</option>
            <option>A+</option><option>A-</option>
            <option>B+</option><option>B-</option>
            <option>AB+</option><option>AB-</option>
            <option>O+</option><option>O-</option>
          </select>
        </Field>
      </div>
    </Section>
  );
}
