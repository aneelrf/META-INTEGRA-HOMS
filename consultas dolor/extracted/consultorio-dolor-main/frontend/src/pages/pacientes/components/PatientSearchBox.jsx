import { Search } from 'lucide-react';

export default function PatientSearchBox({ value, onChange }) {
  return (
    <div className="mb-4 relative max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Buscar por nombre, apellido o cedula..."
        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
      />
    </div>
  );
}
