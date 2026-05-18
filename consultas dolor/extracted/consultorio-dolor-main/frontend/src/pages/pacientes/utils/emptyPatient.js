export const EMPTY_PATIENT = {
  nombre: '', apellido: '', apodo: '',
  cedula: '', nacionalidad: '',
  fecha_nacimiento: '',
  genero: '', identidad_genero: '',
  estado_civil: '', numero_hijos: '',
  lugar_origen: '', tipo_sangre: '',
  escolaridad: '',
  ocupacion: '', profesiones_anteriores: '',
  telefono: '', telefono_2: '', telefono_otro: '',
  email: '', direccion: '',
  referente_nombre: '', referente_telefono: '', referente_direccion: '',
  contacto_emergencia_nombre: '', contacto_emergencia_telefono: '',
  antecedentes_personales: '', antecedentes_familiares: '',
  antecedentes_alergicos: '', antecedentes_quirurgicos: '',
  notas: '',
};

export function patientFormToPayload(data) {
  const payload = {};
  for (const k of Object.keys(data)) {
    payload[k] = data[k] === '' ? null : data[k];
  }
  payload.nombre = data.nombre;
  payload.apellido = data.apellido;
  if (data.numero_hijos !== '') payload.numero_hijos = Number(data.numero_hijos);
  return payload;
}
