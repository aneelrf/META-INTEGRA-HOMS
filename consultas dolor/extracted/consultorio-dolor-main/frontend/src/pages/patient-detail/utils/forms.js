export function calcularEdad(fechaNac) {
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export function emptyProcedure() {
  return {
    tipo: 'bloqueo',
    subtipo: '',
    zona: '',
    farmaco: '',
    dosis: '',
    tecnica: '',
    guiado_por: '',
    complicaciones: '',
    resultado: '',
    notas: '',
    followup_days: '',
    eva_pre: '',
    pre_tension_arterial: '',
    pre_frecuencia_cardiaca: '',
    pre_frecuencia_respiratoria: '',
    pre_saturacion_o2: '',
    pre_temperatura: '',
    pre_glucemia: '',
  };
}

export function formatPreVitals(p) {
  const parts = [
    p.pre_tension_arterial && `TA ${p.pre_tension_arterial}`,
    p.pre_frecuencia_cardiaca && `FC ${p.pre_frecuencia_cardiaca}`,
    p.pre_frecuencia_respiratoria && `FR ${p.pre_frecuencia_respiratoria}`,
    p.pre_saturacion_o2 && `SpO2 ${p.pre_saturacion_o2}`,
    p.pre_temperatura && `Temp ${p.pre_temperatura}`,
    p.pre_glucemia && `Glu ${p.pre_glucemia}`,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function emptyMed() {
  return { farmaco: '', es_opioide: false, dosis_inicial: '', frecuencia_inicial: '', via_inicial: '', notas: '' };
}
