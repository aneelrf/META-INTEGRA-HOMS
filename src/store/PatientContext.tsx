import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy
} from 'firebase/firestore';

export interface PatientData {
    id: string;
    createdAt: string;
    answers: Record<string, any>;
}

interface PatientContextType {
    patients: PatientData[];
    savePatient: (data: Record<string, any>) => void;
    deletePatient: (id: string) => void;
    loading: boolean;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
    const [patients, setPatients] = useState<PatientData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen to Firestore collection in real-time
        const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const patientsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PatientData[];

            setPatients(patientsData);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to patients:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const savePatient = async (data: Record<string, any>) => {
        try {
            await addDoc(collection(db, 'patients'), {
                createdAt: new Date().toISOString(),
                answers: data,
            });
        } catch (error) {
            console.error("Error saving patient:", error);
        }
    };

    const deletePatient = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'patients', id));
        } catch (error) {
            console.error("Error deleting patient:", error);
        }
    };

    return (
        <PatientContext.Provider value={{ patients, savePatient, deletePatient, loading }}>
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
