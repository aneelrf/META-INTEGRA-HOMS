export const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function sortKeyFrom(dateStr, fallbackTime = '00:00:00') {
  if (!dateStr) return '0000-00-00T00:00:00';
  const s = dateStr.replace(' ', 'T');
  return s.length <= 10 ? `${s}T${fallbackTime}` : s;
}
