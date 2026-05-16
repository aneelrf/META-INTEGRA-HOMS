import { Building2, Key, Users } from 'lucide-react';

const tabs = [
  { key: 'consultorio', label: 'Consultorio', icon: Building2 },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'password', label: 'Mi contrase?a', icon: Key },
];

export default function AdminTabs({ activeTab, onChange }) {
  return (
    <div className="border-b border-slate-200 mb-6 flex gap-1 overflow-x-auto">
      {tabs.map(t => (
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
