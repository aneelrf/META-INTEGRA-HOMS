import {
    collection, addDoc, updateDoc, deleteDoc,
    doc, query, where, orderBy, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Consultation {
    id: string;
    patientId: string;        // PatientV2 doc id
    patientCedula: string;
    appointmentId: string;    // linked appointment (empty if standalone)
    doctorUid: string;
    date: string;             // YYYY-MM-DD
    type: string;
    reason: string;           // motivo de consulta médica
    weight?: number;          // kg
    imc?: number;
    systolicBP?: number;      // mmHg
    diastolicBP?: number;     // mmHg
    diagnosis: string;
    treatmentPlan: string;
    recommendations: string;
    nextAppointmentDate: string; // YYYY-MM-DD or empty
    notes: string;
    createdAt: string;        // ISO
    updatedAt: string;        // ISO
}

export type ConsultationInput = Omit<Consultation, 'id'>;

export const CONSULTATION_TYPES = [
    'Primera consulta',
    'Seguimiento post-operatorio',
    'Control de peso',
    'Urgencia',
    'Procedimiento',
    'Otro',
];

export function subscribeConsultationsByPatient(
    patientId: string,
    onData: (consultations: Consultation[]) => void,
): () => void {
    const q = query(
        collection(db, 'consultations'),
        where('patientId', '==', patientId),
        orderBy('date', 'desc'),
    );
    return onSnapshot(q, snap => {
        onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as Consultation)));
    });
}

// Legacy: query by cedula for backward-compat during migration period
export function subscribeConsultations(
    patientCedula: string,
    onData: (consultations: Consultation[]) => void,
): () => void {
    const q = query(
        collection(db, 'consultations'),
        where('patientCedula', '==', patientCedula),
        orderBy('date', 'desc'),
    );
    return onSnapshot(q, snap => {
        onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as Consultation)));
    });
}

export async function addConsultation(data: ConsultationInput): Promise<string> {
    const ref = await addDoc(collection(db, 'consultations'), {
        ...data,
        updatedAt: data.updatedAt || data.createdAt,
    });
    return ref.id;
}

export async function updateConsultation(id: string, data: Partial<ConsultationInput>): Promise<void> {
    await updateDoc(doc(db, 'consultations', id), {
        ...data,
        updatedAt: new Date().toISOString(),
    });
}

export async function deleteConsultation(id: string): Promise<void> {
    await deleteDoc(doc(db, 'consultations', id));
}
