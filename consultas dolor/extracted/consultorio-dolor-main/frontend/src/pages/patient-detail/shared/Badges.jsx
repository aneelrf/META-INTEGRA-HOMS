export function EvaBadge({ value }) {
  const tone = value <= 3 ? 'bg-emerald-100 text-emerald-800' :
               value <= 6 ? 'bg-amber-100 text-amber-800' :
               'bg-rose-100 text-rose-800';
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${tone}`}>EVA {value}</span>;
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

export function BudgetEstadoBadge({ estado }) {
  const styles = {
    borrador: 'bg-slate-100 text-slate-600',
    aprobado: 'bg-brand-100 text-brand-800',
    facturado: 'bg-emerald-100 text-emerald-800',
    cancelado: 'bg-slate-200 text-slate-600',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block ${styles[estado] || styles.borrador}`}>{estado}</span>;
}

export function InvoiceEstadoBadge({ estado }) {
  const styles = {
    pendiente: 'bg-amber-100 text-amber-800',
    parcial: 'bg-sky-100 text-sky-800',
    pagada: 'bg-emerald-100 text-emerald-800',
    anulada: 'bg-slate-200 text-slate-600',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[estado] || styles.pendiente}`}>{estado}</span>;
}

