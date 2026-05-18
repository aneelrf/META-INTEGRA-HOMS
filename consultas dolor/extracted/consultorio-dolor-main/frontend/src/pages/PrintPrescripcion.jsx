import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MedicoHeader from './print/components/MedicoHeader.jsx';
import PrintActionButton from './print/components/PrintActionButton.jsx';
import PrintLayout from './print/components/PrintLayout.jsx';
import SignatureFooter from './print/components/SignatureFooter.jsx';
import { useAutoPrint } from './print/hooks/useAutoPrint.js';
import { getMedicationsByIds, getSettings } from './print/services/printService.js';
import { calcularEdad } from './print/utils/age.js';

export default function PrintPrescripcion() {
  const { medicationId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const [prescripciones, settings] = await Promise.all([
        getMedicationsByIds(medicationId),
        getSettings(),
      ]);
      setData({ prescripciones, settings });
    })();
  }, [medicationId]);

  useAutoPrint(Boolean(data));

  if (!data) return <div className="p-8">Cargando...</div>;
  const { prescripciones, settings } = data;
  const paciente = prescripciones[0];
  const edad = paciente ? calcularEdad(paciente.fecha_nacimiento) : null;

  return (
    <PrintLayout>
      <MedicoHeader settings={settings} />

      {paciente && (
        <section className="mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Paciente:</strong> {paciente.nombre} {paciente.apellido}</div>
            <div><strong>Cedula:</strong> {paciente.cedula || '-'}</div>
            <div><strong>Edad:</strong> {edad != null ? `${edad} anos` : '-'}</div>
            <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-DO')}</div>
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="border-b-2 border-slate-900 pb-2 mb-5">
          <h2 className="text-xl font-bold tracking-wide">Rp.</h2>
        </div>
        {prescripciones.length === 0 ? (
          <p className="text-slate-600">(Sin prescripciones seleccionadas)</p>
        ) : (
          <ol className="space-y-4 list-decimal pl-7">
            {prescripciones.map(p => {
              const t = p.ultima_titulacion;
              return (
                <li key={p.id} className="break-inside-avoid pl-1 text-[16px] leading-snug">
                  <div className="font-semibold text-slate-950">
                    {p.farmaco}
                    {t?.dosis && <span className="font-normal"> - {t.dosis}</span>}
                    {t?.via && <span className="font-normal">, via {t.via}</span>}
                    {t?.frecuencia && <span className="font-normal">, {t.frecuencia}</span>}
                    {p.es_opioide && <span className="font-normal text-[12px] uppercase tracking-wide"> (opioide)</span>}
                  </div>
                  <div className="text-[14px] text-slate-800 mt-1 min-h-[18px]">
                    {p.notas ? p.notas : 'Indicaciones segun criterio medico.'}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <SignatureFooter settings={settings} />
      <PrintActionButton />
    </PrintLayout>
  );
}
