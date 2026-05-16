export const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm';

export function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function Field({ label, children, full }) {
  return (
    <label className={`block ${full ? 'md:col-span-2' : ''}`}>
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
