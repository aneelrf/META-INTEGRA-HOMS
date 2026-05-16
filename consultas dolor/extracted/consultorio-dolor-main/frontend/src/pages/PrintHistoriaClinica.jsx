import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HistoriaPrintBody from './print/components/historia/HistoriaPrintBody.jsx';
import MedicoHeader from './print/components/MedicoHeader.jsx';
import PrintActionButton from './print/components/PrintActionButton.jsx';
import PrintLayout from './print/components/PrintLayout.jsx';
import SignatureFooter from './print/components/SignatureFooter.jsx';
import { useAutoPrint } from './print/hooks/useAutoPrint.js';
import { getHistoria, getPatient, getSettings } from './print/services/printService.js';

export default function PrintHistoriaClinica() {
  const { patientId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      getPatient(patientId),
      getHistoria(patientId),
      getSettings(),
    ]).then(([paciente, historia, settings]) => {
      setData({ paciente, historia, settings });
    });
  }, [patientId]);

  useAutoPrint(Boolean(data), 500);

  if (!data) return <div className="p-8">Cargando...</div>;
  const { paciente, historia, settings } = data;

  return (
    <PrintLayout dense>
      <MedicoHeader settings={settings} variant="center" />

      <h2 className="text-center text-base font-bold uppercase tracking-wider mb-1">Historia Clínica — Unidad del Dolor</h2>
      <p className="text-right text-[11px] mb-4">
        <strong>Fecha:</strong> {historia?.fecha || new Date().toISOString().slice(0, 10)}
      </p>

      <HistoriaPrintBody paciente={paciente} historia={historia} />

      <SignatureFooter settings={settings} dense />
      <PrintActionButton />
    </PrintLayout>
  );
}
