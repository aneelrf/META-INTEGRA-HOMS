import { useState } from 'react';
import { Activity, BarChart2 } from 'lucide-react';
import ClinicalStats from './ClinicalStats';
import SurveyStats from '../SurveyStats';

type Tab = 'clinicas' | 'encuestas';

export default function StatsPage() {
    const [tab, setTab] = useState<Tab>('clinicas');

    return (
        <div className="flex-1 flex flex-col overflow-hidden">

            {/* Tab bar */}
            <div className="bg-card border-b border-bd px-6 py-3 flex-shrink-0">
                <div className="flex gap-1">
                    {([
                        { key: 'clinicas',  label: 'Estadísticas clínicas', icon: Activity  },
                        { key: 'encuestas', label: 'Encuestas',              icon: BarChart2 },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                tab === key
                                    ? 'bg-brand-primary text-white'
                                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10'
                            }`}
                        >
                            <Icon size={13} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {tab === 'clinicas'  && <ClinicalStats />}
            {tab === 'encuestas' && <SurveyStats onClose={() => {}} isPage />}
        </div>
    );
}
