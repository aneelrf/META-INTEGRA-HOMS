import AntecedentesSection from './sections/AntecedentesSection.jsx';
import ContactoSection from './sections/ContactoSection.jsx';
import DatosPersonalesSection from './sections/DatosPersonalesSection.jsx';
import EmergenciaSection from './sections/EmergenciaSection.jsx';
import FormacionTrabajoSection from './sections/FormacionTrabajoSection.jsx';
import ReferenteSection from './sections/ReferenteSection.jsx';
import { Section, input } from './PacientesShared.jsx';

export default function PacienteFormBody({ data, set }) {
  return (
    <>
      <DatosPersonalesSection data={data} set={set} />
      <FormacionTrabajoSection data={data} set={set} />
      <ContactoSection data={data} set={set} />
      <ReferenteSection data={data} set={set} />
      <EmergenciaSection data={data} set={set} />
      <AntecedentesSection data={data} set={set} />
      <Section title="Notas">
        <textarea rows={3} className={input} value={data.notas} onChange={e => set('notas', e.target.value)} />
      </Section>
    </>
  );
}
