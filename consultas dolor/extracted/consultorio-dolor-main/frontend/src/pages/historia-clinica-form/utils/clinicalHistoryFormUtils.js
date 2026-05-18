import {
  ANAMNESIS,
  APP,
  ARCOS,
  MUSCULO_INSP,
  MUSCULOS_TONO,
  NERVIOS,
  REFLEJOS_LISTA,
  REVISION,
  SENSIBILIDAD,
  SOCIAL_FAMILIAR,
} from '../clinicalHistoryFields.js';

export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function buildEmptyForm() {
  const keys = [
    'fecha',
    ...ANAMNESIS.map(x => x[0]),
    ...APP.map(x => x[0]),
    ...SOCIAL_FAMILIAR.map(x => x[0]),
    'tension_arterial', 'frecuencia_cardiaca', 'saturacion_o2',
    ...REVISION.map(x => x[0]),
    ...MUSCULO_INSP.map(x => x[0]),
    ...ARCOS.map(x => x[0]),
    ...SENSIBILIDAD.map(x => x[0]),
    ...NERVIOS.map(x => x[0]),
    'notas_evaluacion',
  ];
  const obj = {};
  for (const k of keys) obj[k] = '';
  obj.fecha = hoyISO();
  return obj;
}

export function buildEmptyTono() {
  const o = {};
  for (const [k] of MUSCULOS_TONO) o[k] = { d: '', i: '' };
  return o;
}

export function buildEmptyReflejos() {
  const o = {};
  for (const [k] of REFLEJOS_LISTA) o[k] = { d: '', i: '' };
  return o;
}

export function hasClinicalData(form, tono, reflejos) {
  const hasText = Object.keys(form)
    .filter(k => k !== 'fecha')
    .some(k => String(form[k] ?? '').trim() !== '');
  const hasTono = Object.values(tono).some(v => v?.d !== '' || v?.i !== '');
  const hasReflejos = Object.values(reflejos).some(v => v?.d !== '' || v?.i !== '');
  return hasText || hasTono || hasReflejos;
}

