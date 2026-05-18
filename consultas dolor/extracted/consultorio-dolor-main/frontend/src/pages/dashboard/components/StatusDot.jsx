const colors = {
  pendiente: 'bg-amber-500',
  atendida: 'bg-emerald-500',
  cancelada: 'bg-slate-400',
  noshow: 'bg-slate-400',
};

export default function StatusDot({ estado }) {
  return (
    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
      <span className={`w-2 h-2 rounded-full ${colors[estado] || 'bg-slate-400'}`}></span>
      {estado}
    </div>
  );
}
