import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { EvaBadge } from '../shared/Badges.jsx';
import { InfoCard, Row } from '../shared/InfoCard.jsx';
import {
  getPatientConsultations,
  getPatientHistoria,
  getPatientMedications,
} from '../services/patientDetailService.js';

export default function InfoTab({ patient, patientId }) {
  const [extra, setExtra] = useState({ historia: null, medications: [], consultations: [] });

  useEffect(() => {
    Promise.all([
      getPatientHistoria(patientId).catch(() => null),
      getPatientMedications(patientId).catch(() => []),
      getPatientConsultations(patientId).catch(() => []),
    ]).then(([historia, medications, consultations]) => setExtra({
      historia,
      medications,
      consultations,
    }));
  }, [patientId]);

  const { historia, medications, consultations } = extra;
  const activeMeds = medications.filter(m => m.activo);
  const opioids = activeMeds.filter(m => m.es_opioide);
  const lastConsult = consultations[0];
  const alergias = historia?.alergicos || patient.antecedentes_alergicos;
  const hasAlertas = alergias || opioids.length > 0;

  function edad() {
    if (!patient.fecha_nacimiento) return '—';
    const h = new Date(), n = new Date(patient.fecha_nacimiento);
    let e = h.getFullYear() - n.getFullYear();
    const m = h.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && h.getDate() < n.getDate())) e--;
    return e + ' años';
  }

  return (
    <div className="space-y-4">
      {hasAlertas && (
        <div className="bg-rose-50 border-l-4 border-rose-500 rounded-lg p-4">
          <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertCircle size={14} /> Alertas importantes
          </h3>
          <div className="space-y-1 text-sm">
            {alergias && (
              <div><span className="font-semibold text-rose-900">Alergias:</span> <span className="text-rose-800 whitespace-pre-wrap">{alergias}</span></div>
            )}
            {opioids.length > 0 && (
              <div><span className="font-semibold text-rose-900">Opioide activo:</span> <span className="text-rose-800">{opioids.map(m => m.farmaco).join(', ')}</span></div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Datos personales">
          <Row label="Nombres">{patient.nombre}{patient.apodo ? <span className="text-slate-500"> ({patient.apodo})</span> : null}</Row>
          <Row label="Apellidos">{patient.apellido}</Row>
          <Row label="Cédula">{patient.cedula || '—'}</Row>
          <Row label="Nacionalidad">{patient.nacionalidad || '—'}</Row>
          <Row label="F. nacimiento">{patient.fecha_nacimiento || '—'}</Row>
          <Row label="Edad">{edad()}</Row>
          <Row label="Sexo">{patient.genero || '—'}{patient.identidad_genero ? ` / ${patient.identidad_genero}` : ''}</Row>
          <Row label="Estado civil">{patient.estado_civil || '—'}</Row>
          <Row label="# hijos">{patient.numero_hijos ?? '—'}</Row>
          <Row label="Lugar de origen">{patient.lugar_origen || '—'}</Row>
          <Row label="Tipo de sangre">{patient.tipo_sangre
            ? <span className="inline-block bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-xs font-semibold">{patient.tipo_sangre}</span>
            : '—'}
          </Row>
          <Row label="Escolaridad">{patient.escolaridad || '—'}</Row>
          <Row label="Ocupación">{patient.ocupacion || '—'}</Row>
          {patient.profesiones_anteriores && <Row label="Prof. anteriores" block>{patient.profesiones_anteriores}</Row>}
        </InfoCard>

        <div className="space-y-4">
          <InfoCard title="Contacto">
            <Row label="Celular">{patient.telefono || '—'}</Row>
            {patient.telefono_2 && <Row label="Teléfono 1">{patient.telefono_2}</Row>}
            {patient.telefono_otro && <Row label="Teléfono 2">{patient.telefono_otro}</Row>}
            <Row label="Email">{patient.email || '—'}</Row>
            <Row label="Dirección" block>{patient.direccion || '—'}</Row>
          </InfoCard>

          {(patient.referente_nombre || patient.referente_telefono || patient.referente_direccion) && (
            <InfoCard title="Persona que lo refirió">
              <Row label="Nombre">{patient.referente_nombre || '—'}</Row>
              <Row label="Teléfono">{patient.referente_telefono || '—'}</Row>
              {patient.referente_direccion && <Row label="Dirección" block>{patient.referente_direccion}</Row>}
            </InfoCard>
          )}

          <InfoCard title="Contacto de emergencia">
            <Row label="Nombre">{patient.contacto_emergencia_nombre || '—'}</Row>
            <Row label="Teléfono">{patient.contacto_emergencia_telefono || '—'}</Row>
          </InfoCard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Resumen clínico">
          <Row label="Alergias" block>
            {alergias || <span className="text-slate-400 italic">Sin alergias conocidas</span>}
          </Row>
          {historia?.diagnosticos_anteriores && (
            <Row label="Dx anteriores" block>{historia.diagnosticos_anteriores}</Row>
          )}
          {historia?.traumatismos && (
            <Row label="Traumatismos" block>{historia.traumatismos}</Row>
          )}
          {(historia?.cirugias || patient.antecedentes_quirurgicos) && (
            <Row label="Cirugías" block>{historia?.cirugias || patient.antecedentes_quirurgicos}</Row>
          )}
          {patient.antecedentes_personales && (
            <Row label="Ant. personales" block>{patient.antecedentes_personales}</Row>
          )}
          {patient.antecedentes_familiares && (
            <Row label="Ant. familiares" block>{patient.antecedentes_familiares}</Row>
          )}
        </InfoCard>

        <div className="space-y-4">
          <InfoCard title={`Prescripcion activa (${activeMeds.length})`}>
            {activeMeds.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Sin prescripcion activa.</p>
            ) : (
              <ul className="space-y-2">
                {activeMeds.map(m => (
                  <li key={m.id} className="text-sm">
                    <div className="font-medium text-slate-900 flex items-center gap-2 flex-wrap">
                      {m.farmaco}
                      {m.es_opioide && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Opioide</span>}
                    </div>
                    {m.ultima_titulacion && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {m.ultima_titulacion.dosis}
                        {m.ultima_titulacion.frecuencia && ` · ${m.ultima_titulacion.frecuencia}`}
                        {m.ultima_titulacion.via && ` · ${m.ultima_titulacion.via}`}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </InfoCard>

          <InfoCard title="Última consulta">
            {lastConsult ? (
              <div className="space-y-2">
                <Row label="Fecha">{new Date(lastConsult.date).toLocaleDateString('es-DO')}</Row>
                {lastConsult.motivo_consulta && <Row label="Motivo" block>{lastConsult.motivo_consulta}</Row>}
                {lastConsult.diagnostico && <Row label="Diagnóstico" block>{lastConsult.diagnostico}</Row>}
                {lastConsult.eva !== null && lastConsult.eva !== undefined && (
                  <Row label="EVA"><EvaBadge value={lastConsult.eva} /></Row>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Sin consultas registradas.</p>
            )}
          </InfoCard>
        </div>
      </div>

      {patient.notas && (
        <InfoCard title="Notas generales">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{patient.notas}</p>
        </InfoCard>
      )}
    </div>
  );
}
