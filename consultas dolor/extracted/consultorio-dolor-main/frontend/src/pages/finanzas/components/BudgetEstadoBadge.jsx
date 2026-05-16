const styles = {
  borrador: 'bg-slate-100 text-slate-600',
  aprobado: 'bg-brand-100 text-brand-800',
  facturado: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-slate-200 text-slate-600',
};

export default function BudgetEstadoBadge({ estado }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${styles[estado] || styles.borrador}`}>
      {estado}
    </span>
  );
}
