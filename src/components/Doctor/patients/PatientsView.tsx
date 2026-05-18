import { Outlet, useParams } from 'react-router-dom';
import PatientList from './PatientList';
import { Users } from 'lucide-react';

export default function PatientsView() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="flex flex-1 overflow-hidden">
            <PatientList />
            <div className="flex-1 overflow-hidden flex flex-col bg-app-bg">
                {id ? (
                    <Outlet />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 dark:text-slate-500">
                        <div className="p-6 bg-card rounded-3xl shadow-sm border border-bd">
                            <img
                                src="/META-INTEGRA-HOMS/logo-homs.svg"
                                alt="META Integra"
                                className="w-48 h-auto object-contain opacity-80"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400">
                            <Users size={16} strokeWidth={1.5} />
                            Selecciona un paciente para ver sus detalles
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
