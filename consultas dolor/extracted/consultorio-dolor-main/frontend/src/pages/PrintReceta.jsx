import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MedicoHeader from './print/components/MedicoHeader.jsx';
import PrintActionButton from './print/components/PrintActionButton.jsx';
import PrintLayout from './print/components/PrintLayout.jsx';
import SignatureFooter from './print/components/SignatureFooter.jsx';
import { useAutoPrint } from './print/hooks/useAutoPrint.js';
import { getConsultation, getPatient, getSettings } from './print/services/printService.js';
import { calcularEdad } from './print/utils/age.js';

export default function PrintReceta() {
  const { consultationId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const consulta = await getConsultation(consultationId);
      const [settings, paciente] = await Promise.all([getSettings(), getPatient(consulta.patient_id)]);
      setData({ consulta, settings, paciente });
    })();
  }, [consultationId]);

  useAutoPrint(Boolean(data));

  if (!data) return <div className="p-8">Cargando...</div>;
  const { consulta, settings, paciente } = data;
  const edad = calcularEdad(paciente.fecha_nacimiento);

  return (
    <PrintLayout>
      <MedicoHeader settings={settings} />

      <section className="mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Paciente:</strong> {paciente.nombre} {paciente.apellido}</div>
          <div><strong>Cédula:</strong> {paciente.cedula || '—'}</div>
          <div><strong>Edad:</strong> {edad != null ? `${edad} años` : '—'}</div>
          <div><strong>Fecha:</strong> {new Date(consulta.date).toLocaleDateString('es-DO')}</div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">Plan / recomendaciones</h2>
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed min-h-[180px]">
          {consulta.plan || '(Sin indicaciones registradas)'}
        </div>
      </section>

      {consulta.diagnostico && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Diagnóstico</h3>
          <p className="text-sm whitespace-pre-wrap">{consulta.diagnostico}</p>
        </section>
      )}

      <SignatureFooter settings={settings} />
      <PrintActionButton />
    </PrintLayout>
  );
}
