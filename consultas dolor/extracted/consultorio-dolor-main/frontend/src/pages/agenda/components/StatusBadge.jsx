export function tipoLabel(tipo) {
  if (tipo === 'walkin') return 'Sin cita';
  if (tipo === 'followup') return 'Seguimiento';
  return 'Cita';
}

export function estadoPill(estado) {
  const map = {
    pendiente: 'bg-amber-100 text-amber-800',
    atendida: 'bg-emerald-100 text-emerald-800',
    cancelada: 'bg-slate-100 text-slate-500 line-through',
    noshow: 'bg-slate-100 text-slate-500',
  };
  return map[estado] || 'bg-slate-100 text-slate-600';
}

export function StatusBadge({ estado }) {
  const styles = {
    pendiente: 'bg-amber-100 text-amber-800',
    atendida: 'bg-emerald-100 text-emerald-800',
    cancelada: 'bg-slate-100 text-slate-600',
    noshow: 'bg-slate-100 text-slate-600',
  };
  const dots = {
    pendiente: 'bg-amber-500',
    atendida: 'bg-emerald-500',
    cancelada: 'bg-slate-400',
    noshow: 'bg-slate-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wide px-2.5 py-1 rounded-full ${styles[estado] || styles.cancelada}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[estado] || dots.cancelada}`}></span>
      {estado}
    </span>
  );
}

