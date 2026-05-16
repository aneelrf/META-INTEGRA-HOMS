import { Link } from 'react-router-dom';

const toneStyles = {
  amber: { border: 'border-amber-200', bg: 'bg-amber-50', icon: 'text-amber-600', count: 'bg-amber-200 text-amber-900' },
  rose: { border: 'border-rose-200', bg: 'bg-rose-50', icon: 'text-rose-600', count: 'bg-rose-200 text-rose-900' },
};

const fallback = { border: 'border-slate-200', bg: 'bg-slate-50', icon: 'text-slate-600', count: 'bg-slate-200 text-slate-700' };

export default function AlertCard({ icon: Icon, tone, title, subtitle, items }) {
  const t = toneStyles[tone] || fallback;
  return (
    <div className={`bg-white rounded-2xl border ${t.border} shadow-card overflow-hidden flex flex-col`}>
      <div className={`p-4 ${t.bg} border-b ${t.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={18} className={t.icon} />
            <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.count}`}>{items.length}</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">{subtitle}</p>
      </div>
      <ul className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
        {items.slice(0, 10).map(item => (
          <li key={item.id}>
            <Link to={item.link} className="p-3 block hover:bg-slate-50 transition">
              <div className="font-medium text-sm text-slate-900 truncate">{item.primary}</div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{item.secondary}</div>
            </Link>
          </li>
        ))}
        {items.length > 10 && (
          <li className="p-3 text-center text-xs text-slate-500">+{items.length - 10} más</li>
        )}
      </ul>
    </div>
  );
}
