import { Link } from 'react-router-dom';

const tones = {
  brand: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
};

export default function StatCard({ icon: Icon, label, value, hint, tone = 'brand', link }) {
  const Wrapper = link ? Link : 'div';
  const wrapperProps = link ? { to: link } : {};
  return (
    <Wrapper
      {...wrapperProps}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover hover:border-slate-300 transition block group"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-semibold text-slate-900 mt-2 tabular-nums">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{hint}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]} group-hover:scale-105 transition`}>
          <Icon size={18} />
        </div>
      </div>
    </Wrapper>
  );
}
