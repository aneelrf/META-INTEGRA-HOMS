import {
    collection, addDoc, updateDoc, deleteDoc,
    doc, query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Interconsulta {
    id: string;
    patientId: string;
    visitId: string;

    // Requesting doctor (solicitante)
    requestingDoctorId: string;
    requestingDoctorName: string;

    // Assigned doctor (receptor)
    assignedDoctorId: string;
    assignedDoctorName: string;

    especialidad: string;
    motivo: string;
    clinicalSummary: string;
    priority: 'normal' | 'alta' | 'urgente';

    estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada' | 'rechazada';

    // Response (filled by assigned doctor)
    responseEvaluation: string;
    responseDiagnosis: string;
    responseRecommendations: string;
    responseConduct: string;
    responseObservations: string;

    // Timestamps
    requestedAt: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    createdBy: string;

    // Legacy fields kept for backward compat
    medico?: string;
    notas?: string;
}

export async function addInterconsulta(
    data: Omit<Interconsulta, 'id'>,
): Promise<string> {
    const ref = await addDoc(collection(db, 'interconsultas'), data);
    return ref.id;
}

export async function updateInterconsulta(
    id: string,
    data: Partial<Omit<Interconsulta, 'id'>>,
): Promise<void> {
    await updateDoc(doc(db, 'interconsultas', id), data);
}

export async function deleteInterconsulta(id: string): Promise<void> {
    await deleteDoc(doc(db, 'interconsultas', id));
}

export function subscribeInterconsultasByVisit(
    visitId: string,
    onData: (items: Interconsulta[]) => void,
): () => void {
    const q = query(
        collection(db, 'interconsultas'),
        where('visitId', '==', visitId),
    );
    return onSnapshot(q, snap => {
        const items = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Interconsulta))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        onData(items);
    }, err => {
        // On permission error: keep last known state (don't clear the list)
        console.warn('[interconsultas] snapshot error:', err.code);
    });
}

export function subscribeInterconsultasByAssignedDoctor(
    doctorId: string,
    onData: (items: Interconsulta[]) => void,
): () => void {
    const q = query(
        collection(db, 'interconsultas'),
        where('assignedDoctorId', '==', doctorId),
    );
    return onSnapshot(q, snap => {
        const items = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Interconsulta))
            .filter(ic => ic.estado === 'pendiente' || ic.estado === 'en_proceso')
            .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
        onData(items);
    });
}

export function subscribeInterconsultasByPatient(
    patientId: string,
    onData: (items: Interconsulta[]) => void,
): () => void {
    const q = query(
        collection(db, 'interconsultas'),
        where('patientId', '==', patientId),
    );
    return onSnapshot(q, snap => {
        const items = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Interconsulta))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        onData(items);
    });
}
