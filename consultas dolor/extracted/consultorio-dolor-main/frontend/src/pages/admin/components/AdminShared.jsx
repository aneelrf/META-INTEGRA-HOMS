import { Key } from 'lucide-react';

export const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm';

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export function PermissionDenied() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-3">
        <Key size={20} className="text-slate-500" />
      </div>
      <p className="text-slate-600">Solo los administradores pueden ver esta sección.</p>
    </div>
  );
}

