import { useState } from 'react';
import { Activity, BarChart2 } from 'lucide-react';
import ClinicalStats from './ClinicalStats';
import SurveyStats from '../SurveyStats';

type Tab = 'clinicas' | 'encuestas';

export default function StatsPage() {
    const [tab, setTab] = useState<Tab>('clinicas');

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-app-bg">
            <div className="bg-card border-b border-bd px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-50">Estadísticas</h1>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Análisis clínico y de satisfacción del paciente</p>
                    </div>
                    <div className="flex gap-1 bg-surface border border-bd rounded-xl p-1">
                        {([
                            { key: 'clinicas',  label: 'Clínicas',  icon: Activity  },
                            { key: 'encuestas', label: 'Encuestas', icon: BarChart2 },
                        ] as const).map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    tab === key
                                        ? 'bg-brand-primary text-white shadow-sm'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                                }`}
                            >
                                <Icon size={13} /> {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {tab === 'clinicas'  && <ClinicalStats />}
            {tab === 'encuestas' && <SurveyStats onClose={() => {}} isPage />}
        </div>
    );
}
