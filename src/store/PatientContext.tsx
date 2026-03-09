import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface PatientData {
    id: string;
    createdAt: string;
    answers: Record<string, any>;
}

interface PatientContextType {
    patients: PatientData[];
    savePatient: (data: Record<string, any>) => void;
    deletePatient: (id: string) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
    const [patients, setPatients] = useState<PatientData[]>(() => {
        const saved = localStorage.getItem('meta-integra-patients');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('meta-integra-patients', JSON.stringify(patients));
    }, [patients]);

    const savePatient = (data: Record<string, any>) => {
        const newPatient: PatientData = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            answers: data,
        };
        setPatients((prev) => [newPatient, ...prev]);
    };

    const deletePatient = (id: string) => {
        setPatients((prev) => prev.filter(p => p.id !== id));
    };

    return (
        <PatientContext.Provider value={{ patients, savePatient, deletePatient }}>
            {children}
        </PatientContext.Provider>
    );
}

export function usePatients() {
    const context = useContext(PatientContext);
    if (context === undefined) {
        throw new Error('usePatients must be used within a PatientProvider');
    }
    return context;
}
