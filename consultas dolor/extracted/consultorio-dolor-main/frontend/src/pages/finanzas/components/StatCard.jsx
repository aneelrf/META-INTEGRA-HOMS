const tones = {
  brand: 'bg-brand-50 text-brand-700',
  rose: 'bg-rose-50 text-rose-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  slate: 'bg-slate-100 text-slate-700',
};

export default function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-xl font-semibold text-slate-900 mt-2 tabular-nums truncate">{value}</p>
          <p className="text-xs text-slate-500 mt-1 truncate">{hint}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]} shrink-0`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
