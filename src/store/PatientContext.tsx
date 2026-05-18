import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { db } from '../firebase';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import {
    findOrCreatePatient,
    createPatientVisit,
    saveClinicalMetrics,
    saveOrUpdateMedicalHistory,
    updatePatientDenormalized,
    type PatientV2,
} from '../services/patientServiceV2';

// PatientData — legacy format still used by older components
export interface PatientData {
    id: string;
    createdAt: string;
    answers: Record<string, any>;
}

interface PatientContextType {
    patients:    PatientData[];   // legacy docs, for backward-compat consumers
    patientsV2:  PatientV2[];     // new architecture
    savePatient: (data: Record<string, any>) => Promise<void>;
    deletePatient: (id: string) => Promise<void>;
    loading: boolean;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
    const [patients,   setPatients]   = useState<PatientData[]>([]);
    const [patientsV2, setPatientsV2] = useState<PatientV2[]>([]);
    const [loading,    setLoading]    = useState(true);

    useEffect(() => {
        // One snapshot on the patients collection; split into legacy vs V2 client-side.
        // Legacy docs have { createdAt, answers: { ... } }
        // V2 docs have { cedulaNormalized, ... }
        const unsub = onSnapshot(collection(db, 'patients'), snap => {
            const legacy: PatientData[] = [];
            const v2: PatientV2[] = [];

            snap.docs.forEach(d => {
                const data = d.data() as any;
                if (data.cedulaNormalized !== undefined) {
                    v2.push({ id: d.id, ...data } as PatientV2);
                } else if (data.answers && !data.answers._isSurvey) {
                    legacy.push({
                        id: d.id,
                        createdAt: data.createdAt ?? '',
                        answers: data.answers,
                    });
                }
            });

            setPatients(
                legacy.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            );
            setPatientsV2(
                v2.sort((a, b) =>
                    new Date(b.lastVisitAt).getTime() - new Date(a.lastVisitAt).getTime()
                )
            );
            setLoading(false);
        }, err => {
            console.error('Error listening to patients:', err);
            setLoading(false);
        });

        return unsub;
    }, []);

    const savePatient = async (data: Record<string, any>) => {
        try {
            const { patientId, isNew } = await findOrCreatePatient(data, 'patient_form');
            const visitId = await createPatientVisit(patientId, data, 'patient_form');
            await saveClinicalMetrics(patientId, visitId, data);
            await saveOrUpdateMedicalHistory(patientId, data, 'patient_form');
            if (!isNew) {
                await updatePatientDenormalized(patientId, data);
            }
        } catch (error) {
            console.error('Error saving patient:', error);
            throw error;
        }
    };

    const deletePatient = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'patients', id));
        } catch (error) {
            console.error('Error deleting patient:', error);
            throw error;
        }
    };

    return (
        <PatientContext.Provider value={{ patients, patientsV2, savePatient, deletePatient, loading }}>
            {children}
        </PatientContext.Provider>
    );
}

export function usePatients() {
    const ctx = useContext(PatientContext);
    if (!ctx) throw new Error('usePatients must be used within a PatientProvider');
    return ctx;
}
