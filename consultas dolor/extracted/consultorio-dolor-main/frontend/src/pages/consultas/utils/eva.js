export function evaColor(eva) {
  if (eva == null) return '';
  if (eva <= 3) return 'text-emerald-600';
  if (eva <= 6) return 'text-amber-600';
  return 'text-rose-600';
}

export function evaLabel(eva) {
  if (eva == null) return '';
  if (eva === 0) return 'Sin dolor';
  if (eva <= 3) return 'Leve';
  if (eva <= 6) return 'Moderado';
  if (eva <= 8) return 'Severo';
  return 'Máximo';
}
