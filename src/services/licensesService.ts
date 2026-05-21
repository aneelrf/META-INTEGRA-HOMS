import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface MedicalLicense {
    id:            string;
    patientId:     string;
    patientName:   string;
    patientCedula: string;
    doctorUid:     string;
    date:          string;
    fechaInicio:   string;
    diasReposo:    number;
    fechaFin:      string;
    diagnostico:   string;
    indicaciones:  string;
    createdAt:     string;
}

export type MedicalLicenseInput = Omit<MedicalLicense, 'id'>;

export function subscribeLicensesByPatient(
    patientId: string,
    onData: (licenses: MedicalLicense[]) => void,
): () => void {
    const q = query(
        collection(db, 'medical_licenses'),
        where('patientId', '==', patientId),
    );
    return onSnapshot(q, snap => {
        const list = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as MedicalLicense))
            .sort((a, b) => b.date.localeCompare(a.date));
        onData(list);
    }, err => console.error('[licensesService] onSnapshot error:', err));
}

export async function addLicense(data: MedicalLicenseInput): Promise<string> {
    const ref = await addDoc(collection(db, 'medical_licenses'), data);
    return ref.id;
}

export async function updateLicense(id: string, data: Partial<MedicalLicenseInput>): Promise<void> {
    await updateDoc(doc(db, 'medical_licenses', id), data);
}

export async function deleteLicense(id: string): Promise<void> {
    await deleteDoc(doc(db, 'medical_licenses', id));
}
