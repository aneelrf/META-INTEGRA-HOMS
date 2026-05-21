import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PrescriptionMedication } from '../utils/generatePrescriptionPdf';

export interface Prescription {
    id: string;
    patientId: string;
    patientCedula: string;
    patientName: string;
    doctorUid: string;
    date: string;
    diagnostico: string;
    medications: PrescriptionMedication[];
    indicaciones: string;
    createdAt: string;
}

export type PrescriptionInput = Omit<Prescription, 'id'>;

export function subscribePrescriptionsByPatient(
    patientId: string,
    onData: (prescriptions: Prescription[]) => void,
): () => void {
    const q = query(
        collection(db, 'prescriptions'),
        where('patientId', '==', patientId),
    );
    return onSnapshot(q, snap => {
        const list = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Prescription))
            .sort((a, b) => b.date.localeCompare(a.date));
        onData(list);
    });
}

export async function addPrescription(data: PrescriptionInput): Promise<string> {
    const ref = await addDoc(collection(db, 'prescriptions'), data);
    return ref.id;
}

export async function updatePrescription(id: string, data: Partial<PrescriptionInput>): Promise<void> {
    await updateDoc(doc(db, 'prescriptions', id), data);
}

export async function deletePrescription(id: string): Promise<void> {
    await deleteDoc(doc(db, 'prescriptions', id));
}
