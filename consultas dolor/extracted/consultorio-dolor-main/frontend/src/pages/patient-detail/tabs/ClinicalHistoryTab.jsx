import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Pencil, Plus, Printer } from 'lucide-react';
import { getPatientHistoria } from '../services/patientDetailService.js';

export default function HistoriaClinicaTab({ patientId, canWrite }) {
  const [historia, setHistoria] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientHistoria(patientId)
      .then(setHistoria)
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <p className="text-slate-500">Cargando...</p>;

  if (!historia) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-card">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <ClipboardList size={24} className="text-slate-400" />
        </div>
        <p className="text-slate-700 font-medium">Este paciente aún no tiene historia clínica formal.</p>
        <p className="text-slate-500 text-sm mt-1 mb-5">Documento completo de la Unidad del Dolor: anamnesis, antecedentes, examen físico, neurológico.</p>
        {canWrite && (
          <Link to={`/pacientes/${patientId}/historia-clinica`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">
            <Plus size={16} /> Crear historia clínica
          </Link>
        )}
      </div>
    );
  }

  let tono = {}, reflejos = {};
  if (historia.tono_muscular) { try { tono = JSON.parse(historia.tono_muscular); } catch {} }
  if (historia.reflejos) { try { reflejos = JSON.parse(historia.reflejos); } catch {} }
  const hasData = hasHistoriaClinicaData(historia, tono, reflejos);

  return (
    <div>
      <div className="flex justify-between items-start gap-3 flex-wrap mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Historia Clínica — Unidad del Dolor</h2>
          <p className="text-sm text-slate-500 mt-0.5">Registrada el {historia.fecha}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canWrite && (
            <Link to={`/pacientes/${patientId}/historia-clinica`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium">
              <Pencil size={14} /> Editar
            </Link>
          )}
          <Link to={`/print/historia-clinica/${patientId}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium">
            <Printer size={14} /> Imprimir
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {!hasData && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-amber-900">Historia creada sin datos registrados</h3>
            <p className="text-sm text-amber-800 mt-1">
              Esta historia clinica existe, pero todavia no tiene campos clinicos completados. Usa Editar para llenarla.
            </p>
          </div>
        )}
        <HCView title="Consulta — Anamnesis del dolor" data={historia} fields={[
          ['motivo_consulta', 'Motivo de consulta'],
          ['inicio_desarrollo', 'Inicio y desarrollo'],
          ['distribucion_espacial', 'Distribución espacial'],
          ['aspectos_cualitativos_cuantitativos', 'Aspectos cualitativos y cuantitativos'],
          ['evolucion_temporal', 'Evolución temporal'],
          ['factores_provocativos', 'Factores provocativos'],
          ['factores_paliativos', 'Factores paliativos'],
          ['tratamiento_actual', 'Tratamiento actual'],
          ['efectos_socio_familiares', 'Efectos socio-familiares'],
        ]} />

        <HCView title="Antecedentes Personales Patológicos" data={historia} fields={[
          ['diagnosticos_anteriores', 'Diagnósticos anteriores'],
          ['factores_geneticos_congenitos', 'Factores genéticos y/o congénitos'],
          ['factores_nutricionales', 'Factores nutricionales'],
          ['exposicion_toxicos', 'Exposición a tóxicos'],
          ['traumatismos', 'Traumatismos'],
          ['cirugias', 'Cirugías'],
          ['transfusiones', 'Transfusiones'],
          ['alergicos', 'Alérgicos'],
          ['anestesicos', 'Anestésicos'],
          ['ets_its', 'ETS/ITS'],
          ['inmunizaciones', 'Inmunizaciones'],
          ['psiquiatricos', 'Psiquiátricos'],
          ['habitos_toxicos', 'Hábitos tóxicos'],
        ]} />

        <HCView title="Antecedentes No Patológicos, Sociales y Familiares" data={historia} fields={[
          ['estado_salud_previo', 'Estado de salud antes de la sintomatología'],
          ['descripcion_entorno', 'Entorno del paciente'],
          ['familiares_problematica', 'Familiares con la misma problemática'],
          ['incidencia_familiares', '¿Inciden los familiares?'],
          ['otros_antecedentes_familiares', 'Otros antecedentes a destacar'],
        ]} />

        <HCView title="Revisión por Sistemas" data={historia} fields={[
          ['tension_arterial', 'Tensión arterial'],
          ['frecuencia_cardiaca', 'Frecuencia cardíaca'],
          ['saturacion_o2', 'Saturación O₂'],
          ['auscultacion_pulmones', 'Respiratorio — Auscultación pulmones'],
          ['auscultacion_corazon', 'Cardiovascular — Auscultación del corazón'],
          ['juicio_percepcion', 'Psiquiátrico — Juicio de percepción'],
        ]} />

        <HCView title="Sistema Músculo Esquelético" data={historia} fields={[
          ['inspeccion_dedos_unas', 'Inspección de dedos y uñas'],
          ['examen_articulaciones', 'Examen articulaciones/huesos/músculos'],
          ['marcha_movimientos', 'Marcha — movimientos'],
          ['columna_cervical', 'Columna cervical'],
          ['columna_toracolumbar', 'Columna toracolumbar'],
          ['columna_rotacion', 'Rotación'],
          ['hombros', 'Hombros'],
          ['codos', 'Codos'],
          ['munecas_movimiento', 'Muñecas — Movimiento 130-0-130°'],
          ['munecas_palmas_dorsos', 'Muñecas — Palmas y dorsos juntas'],
          ['prueba_phalen', 'Prueba de Phalen'],
          ['pronacion_supinacion', 'Pronación y supinación'],
          ['dedos_abrir_cerrar', 'Dedos — Abrir y cerrar puños'],
          ['dedos_tocar_primer', 'Dedos — Tocar primer dedo'],
          ['miembros_inferiores', 'Miembros inferiores'],
        ]} />

        <HCView title="Sensibilidad" data={historia} fields={[
          ['deficit_trastorno', 'Déficit o trastorno'],
          ['sensacion_propioceptiva', 'Sensación propioceptiva'],
          ['sensibilidad_presion', 'Sensibilidad a la presión'],
          ['sensibilidad_combinada', 'Combinada (cortical)'],
        ]} />

        <TablaDIView title="Tono Muscular" subtitle="Escala 0-5: Cero / Indicios / Pobre / Aceptable / Buena / Fisiológica" data={tono} filas={[
          ['brazo', 'Brazo'], ['antebrazo', 'Antebrazo'], ['mano', 'Mano'],
          ['pierna', 'Pierna'], ['muslo', 'Muslo'], ['pie', 'Pie'],
        ]} />

        <TablaDIView title="Reflejos" subtitle="Escala 0-4: Ausente / Vestigial / Fisiológico / Exaltado / Espástico" data={reflejos} filas={[
          ['biceps_c5', 'Bíceps C5'], ['braquio_radial_c6', 'Braquio radial C6'],
          ['triceps_c7', 'Tríceps C7'], ['flexores_c8', 'Flexores seclos C8'],
          ['cuadriceps_l2_4', 'Cuádriceps L2, L3, L4'],
          ['triceps_sural', 'Tríceps Sural L5, L1, S2'],
          ['aquileo', 'Aquíleo'], ['corneal', 'Corneal V, VII'],
          ['nauseoso', 'Nauseoso IX, X'], ['abd_sup', 'Abd Sup T8-T10'],
          ['cremasterico', 'Cremastérico L1, L5'],
          ['anal', 'Anal S3, S4, S5'],
          ['babinski', 'Babinski'], ['chaddock', 'Chaddock'], ['oppenheim', 'Oppenheim'],
        ]} />

        <HCView title="Nervios Craneales" data={historia} fields={[
          ['nc1_olfatorio', 'I. Olfatorio'],
          ['nc2_optico', 'II. Óptico'],
          ['nc3_5_oculomotor', 'III-IV-VI. Oculomotor, Troclear, MOE'],
          ['nc5_trigemino', 'V. Trigémino'],
          ['nc7_facial', 'VII. Facial'],
          ['nc8_auditivo', 'VIII. Auditivo'],
          ['nc9_glosofaringeo', 'IX. Glosofaríngeo'],
          ['nc10_vago', 'X. Vago'],
          ['nc11_accesorio', 'XI. Accesorio'],
          ['nc12_hipogloso', 'XII. Hipogloso'],
        ]} />

        {historia.notas_evaluacion && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notas de evaluación</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{historia.notas_evaluacion}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HCView({ title, data, fields }) {
  const filled = fields.filter(([k]) => data[k] != null && data[k] !== '');
  if (!filled.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</h3>
      <dl className="space-y-2.5">
        {filled.map(([k, label]) => (
          <div key={k}>
            <dt className="text-xs font-medium text-slate-600">{label}</dt>
            <dd className="text-sm text-slate-800 whitespace-pre-wrap mt-0.5">{data[k]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TablaDIView({ title, subtitle, filas, data }) {
  const anyFilled = filas.some(([k]) => data[k] && (data[k].d !== '' || data[k].i !== ''));
  if (!anyFilled) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
      {subtitle && <p className="text-[11px] text-slate-500 mb-2">{subtitle}</p>}
      <table className="w-full text-sm mt-2">
        <thead>
          <tr className="text-xs uppercase text-slate-500 tracking-wider border-b border-slate-200">
            <th className="text-left py-2 font-semibold">Zona / Reflejo</th>
            <th className="text-center py-2 font-semibold w-20">Derecha</th>
            <th className="text-center py-2 font-semibold w-20">Izquierda</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.map(([k, label]) => (
            <tr key={k}>
              <td className="py-2 text-slate-700">{label}</td>
              <td className="py-2 text-center tabular-nums font-medium">{data[k]?.d !== '' && data[k]?.d !== undefined ? data[k].d : '—'}</td>
              <td className="py-2 text-center tabular-nums font-medium">{data[k]?.i !== '' && data[k]?.i !== undefined ? data[k].i : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function hasHistoriaClinicaData(historia, tono, reflejos) {
  const ignored = new Set([
    'id', 'patient_id', 'doctor_id', 'fecha', 'created_at', 'updated_at',
    'tono_muscular', 'reflejos',
  ]);
  const hasText = Object.entries(historia).some(([k, v]) => {
    if (ignored.has(k)) return false;
    return String(v ?? '').trim() !== '';
  });
  const hasTono = Object.values(tono).some(v => v?.d !== '' || v?.i !== '');
  const hasReflejos = Object.values(reflejos).some(v => v?.d !== '' || v?.i !== '');
  return hasText || hasTono || hasReflejos;
}
