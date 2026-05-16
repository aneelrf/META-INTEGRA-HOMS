import { Activity, Calendar as CalIcon, ClipboardList, Clock, FileText, Pill, User, Wallet } from 'lucide-react';

const TABS = [
  { key: 'historia', label: 'Cronología', icon: Clock },
  { key: 'historia_clinica', label: 'Historia clínica', icon: ClipboardList },
  { key: 'info', label: 'Información', icon: User },
  { key: 'consultas', label: 'Consultas', icon: FileText },
  { key: 'procedimientos', label: 'Procedimientos', icon: Activity },
  { key: 'prescripcion', label: 'Prescripcion', icon: Pill },
  { key: 'cuenta', label: 'Cuenta', icon: Wallet },
  { key: 'agenda', label: 'Agenda', icon: CalIcon },
];

export default function PatientTabs({ activeTab, onChange }) {
  return (
    <div className="border-b border-slate-200 mb-6 flex gap-1 overflow-x-auto">
      {TABS.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
            activeTab === t.key
              ? 'text-brand-700 border-brand-600'
              : 'text-slate-500 border-transparent hover:text-slate-900'
          }`}
        >
          <t.icon size={16} />
          {t.label}
        </button>
      ))}
    </div>
  );
}
