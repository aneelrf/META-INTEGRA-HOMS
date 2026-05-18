const styles = {
  pendiente: 'bg-amber-100 text-amber-800',
  parcial: 'bg-sky-100 text-sky-800',
  pagada: 'bg-emerald-100 text-emerald-800',
  anulada: 'bg-slate-200 text-slate-600',
};

export default function InvoiceEstadoBadge({ estado }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${styles[estado] || styles.pendiente}`}>
      {estado}
    </span>
  );
}
