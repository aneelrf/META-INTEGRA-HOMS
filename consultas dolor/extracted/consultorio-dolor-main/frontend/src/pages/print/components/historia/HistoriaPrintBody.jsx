import { MUSCULOS_TONO, REFLEJOS_LISTA } from '../../../historia-clinica-form/clinicalHistoryFields.js';
import { calcularEdad } from '../../utils/age.js';
import { DataGrid, HistoriaSection, LabeledLine, TablaDI, v } from './HistoriaPrintHelpers.jsx';

function parseJson(raw) {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export default function HistoriaPrintBody({ paciente, historia }) {
  const tono = parseJson(historia?.tono_muscular);
  const reflejos = parseJson(historia?.reflejos);
  const edad = calcularEdad(paciente.fecha_nacimiento);

  return (
    <>
      <HistoriaSection title="Datos Personales">
        <DataGrid pairs={[
          ['Nombres / apodos', `${paciente.nombre} ${paciente.apodo ? `(${paciente.apodo})` : ''}`],
          ['Apellidos', paciente.apellido],
          ['Nacionalidad', v(paciente.nacionalidad)],
          ['Cédula no.', v(paciente.cedula)],
          ['Edad', edad != null ? `${edad} años` : '—'],
          ['Sexo y género', [paciente.genero, paciente.identidad_genero].filter(Boolean).join(' / ') || '—'],
          ['Estado civil', v(paciente.estado_civil)],
          ['Número de hijos', v(paciente.numero_hijos)],
          ['Celular', v(paciente.telefono)],
          ['Teléfono 1', v(paciente.telefono_2)],
          ['Teléfono 2', v(paciente.telefono_otro)],
          ['Dirección', v(paciente.direccion)],
          ['Familiar o persona quien lo refirió', v(paciente.referente_nombre)],
          ['Teléfono de esa persona', v(paciente.referente_telefono)],
          ['Dirección de esa persona', v(paciente.referente_direccion)],
          ['Lugar de origen', v(paciente.lugar_origen)],
          ['Tipo de sangre del paciente', v(paciente.tipo_sangre)],
          ['Nivel de escolaridad', v(paciente.escolaridad)],
          ['Profesión(es) u oficio(s) actual(es)', v(paciente.ocupacion)],
          ['Profesiones y/u oficios anteriores', v(paciente.profesiones_anteriores)],
        ]} />
      </HistoriaSection>

      {historia && (
        <>
          <HistoriaSection title="Consulta">
            <LabeledLine label="Motivo de consulta (síntomas principales)" value={historia.motivo_consulta} />
            <LabeledLine label="Inicio y desarrollo de los mismos" value={historia.inicio_desarrollo} />
            <LabeledLine label="Distribución espacial" value={historia.distribucion_espacial} />
            <LabeledLine label="Aspectos cualitativos y cuantitativos" value={historia.aspectos_cualitativos_cuantitativos} />
            <LabeledLine label="Evolución temporal" value={historia.evolucion_temporal} />
            <LabeledLine label="Factores provocativos" value={historia.factores_provocativos} />
            <LabeledLine label="Factores paliativos" value={historia.factores_paliativos} />
            <LabeledLine label="Tratamiento actual" value={historia.tratamiento_actual} />
            <LabeledLine label="Efectos socio-familiares secundarios a este problema" value={historia.efectos_socio_familiares} />
          </HistoriaSection>

          <HistoriaSection title="Antecedentes Personales Patológicos">
            <LabeledLine label="Diagnósticos anteriores" value={historia.diagnosticos_anteriores} />
            <LabeledLine label="Factores genéticos y/o congénitos al problema" value={historia.factores_geneticos_congenitos} />
            <LabeledLine label="Factores nutricionales" value={historia.factores_nutricionales} />
            <LabeledLine label="Exposición a sustancias y/o elementos tóxicos" value={historia.exposicion_toxicos} />
            <LabeledLine label="Traumatismos" value={historia.traumatismos} />
            <LabeledLine label="Cirugías" value={historia.cirugias} />
            <LabeledLine label="Transfusiones" value={historia.transfusiones} />
            <LabeledLine label="Alérgicos" value={historia.alergicos} />
            <LabeledLine label="Anestésicos (tipo y duración)" value={historia.anestesicos} />
            <LabeledLine label="ETS/ITS" value={historia.ets_its} />
            <LabeledLine label="Inmunizaciones" value={historia.inmunizaciones} />
            <LabeledLine label="Psiquiátricos y psiquiátricos-familiares" value={historia.psiquiatricos} />
            <LabeledLine label="Hábitos tóxicos (tabaco, alcohol, drogas, café e infusiones)" value={historia.habitos_toxicos} />
          </HistoriaSection>

          <HistoriaSection title="Antecedentes Personales No Patológicos">
            <LabeledLine label="Estado de salud antes de aparecer la sintomatología" value={historia.estado_salud_previo} />
          </HistoriaSection>

          <HistoriaSection title="Antecedentes Sociales">
            <LabeledLine label="Descripción del entorno por el paciente" value={historia.descripcion_entorno} />
          </HistoriaSection>

          <HistoriaSection title="Antecedentes Familiares">
            <LabeledLine label="Familiares directos con la misma problemática" value={historia.familiares_problematica} />
            <LabeledLine label="¿Inciden los familiares en la problemática del paciente?" value={historia.incidencia_familiares} />
            <LabeledLine label="Otros antecedentes a destacar" value={historia.otros_antecedentes_familiares} />
          </HistoriaSection>

          <HistoriaSection title="Revisión por Sistemas">
            <p className="font-semibold mt-1">Constitucional</p>
            <DataGrid cols={3} pairs={[
              ['Tensión arterial', v(historia.tension_arterial)],
              ['Frecuencia cardíaca', v(historia.frecuencia_cardiaca)],
              ['Saturación O₂', v(historia.saturacion_o2)],
            ]} />
            <LabeledLine label="Respiratorio — Auscultación pulmones" value={historia.auscultacion_pulmones} />
            <LabeledLine label="Cardiovascular — Auscultación del corazón" value={historia.auscultacion_corazon} />
            <LabeledLine label="Psiquiátrico — Juicio de percepción" value={historia.juicio_percepcion} />
          </HistoriaSection>

          <HistoriaSection title="Sistema Músculo Esquelético">
            <LabeledLine label="Inspección y/o palpación de dedos y uñas" value={historia.inspeccion_dedos_unas} />
            <LabeledLine label="Examen de las articulaciones, los huesos y los músculos" value={historia.examen_articulaciones} />
            <LabeledLine label="Marcha — movimientos" value={historia.marcha_movimientos} />
            <p className="font-semibold mt-3">Arco de movimiento (ángulo)</p>
            <LabeledLine label="Columna cervical" value={historia.columna_cervical} />
            <LabeledLine label="Columna toracolumbar" value={historia.columna_toracolumbar} />
            <LabeledLine label="Rotación" value={historia.columna_rotacion} />
            <LabeledLine label="Hombros" value={historia.hombros} />
            <LabeledLine label="Codos" value={historia.codos} />
            <LabeledLine label="Muñecas — Movimiento 130-0-130°" value={historia.munecas_movimiento} />
            <LabeledLine label="Muñecas — Palmas y dorsos juntas" value={historia.munecas_palmas_dorsos} />
            <LabeledLine label="Prueba de Phalen" value={historia.prueba_phalen} />
            <LabeledLine label="Pronación y supinación" value={historia.pronacion_supinacion} />
            <LabeledLine label="Dedos — Abrir y cerrar puños" value={historia.dedos_abrir_cerrar} />
            <LabeledLine label="Dedos — Tocar primer dedo contra los demás" value={historia.dedos_tocar_primer} />
            <LabeledLine label="Miembros inferiores" value={historia.miembros_inferiores} />
          </HistoriaSection>

          <HistoriaSection title="Sensibilidad">
            <LabeledLine label="Déficit o trastorno" value={historia.deficit_trastorno} />
            <LabeledLine label="Sensación propioceptiva" value={historia.sensacion_propioceptiva} />
            <LabeledLine label="Sensibilidad a la presión (reticular)" value={historia.sensibilidad_presion} />
            <LabeledLine label="Combinada (cortical)" value={historia.sensibilidad_combinada} />
          </HistoriaSection>

          <HistoriaSection title="Tono Muscular">
            <p className="text-[10px] text-slate-600 mb-1">Escala: 5=Fisiológica, 4=Buena, 3=Aceptable, 2=Pobre, 1=Indicios, 0=Cero</p>
            <TablaDI filas={MUSCULOS_TONO} data={tono} />
          </HistoriaSection>

          <HistoriaSection title="Reflejos">
            <p className="text-[10px] text-slate-600 mb-1">Escala: 0=Ausente, 1=Vestigial, 2=Fisiológico, 3=Exaltado, 4=Espástico</p>
            <TablaDI filas={REFLEJOS_LISTA} data={reflejos} />
          </HistoriaSection>

          <HistoriaSection title="Nervios Craneales">
            <LabeledLine label="I. Olfatorio — Olfato" value={historia.nc1_olfatorio} />
            <LabeledLine label="II. Óptico — Agudeza, campos, percepción y colores" value={historia.nc2_optico} />
            <LabeledLine label="III-IV-VI. Oculomotor, Troclear y Motor Ocular Externo" value={historia.nc3_5_oculomotor} />
            <LabeledLine label="V. Trigémino — Sensibilidad de la cara y masticación" value={historia.nc5_trigemino} />
            <LabeledLine label="VII. Facial — Sensibilidad y expresión de la cara" value={historia.nc7_facial} />
            <LabeledLine label="VIII. Auditivo — Vestibular y coclear" value={historia.nc8_auditivo} />
            <LabeledLine label="IX. Glosofaríngeo" value={historia.nc9_glosofaringeo} />
            <LabeledLine label="X. Vago" value={historia.nc10_vago} />
            <LabeledLine label="XI. Accesorio — Elevación hombros y rotación cabeza" value={historia.nc11_accesorio} />
            <LabeledLine label="XII. Hipogloso — Movimientos de la lengua" value={historia.nc12_hipogloso} />
          </HistoriaSection>

          <HistoriaSection title="Notas de evaluación">
            <p className="whitespace-pre-wrap">{v(historia.notas_evaluacion)}</p>
          </HistoriaSection>
        </>
      )}
    </>
  );
}
