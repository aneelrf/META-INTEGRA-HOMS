import {
    collection, addDoc, updateDoc, deleteDoc,
    doc, query, where, orderBy, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

export interface Appointment {
    id: string;
    patientId: string;   // PatientV2 document id (empty string for legacy)
    patientName: string;
    patientCedula: string;
    date: string;       // YYYY-MM-DD
    time: string;       // HH:MM
    type: string;
    status: AppointmentStatus;
    notes: string;
    doctorUid: string;
    createdAt: string;
}

export type AppointmentInput = Omit<Appointment, 'id'>;

export const APPOINTMENT_TYPES = [
    'Primera vez',
    'Seguimiento 1er mes quirúrgico',
    'Seguimiento 2do mes quirúrgico',
    'Seguimiento 4to mes quirúrgico',
    'Seguimiento 1 año quirúrgico',
    'Entrega de resultados',
    'Otro',
];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
    pendiente:   'Pendiente',
    confirmada:  'Confirmada',
    completada:  'Completada',
    cancelada:   'Cancelada',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
    pendiente:  'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmada: 'bg-blue-100 text-blue-700 border-blue-200',
    completada: 'bg-green-100 text-green-700 border-green-200',
    cancelada:  'bg-red-100 text-red-600 border-red-200',
};

export const STATUS_CYCLE: Record<AppointmentStatus, AppointmentStatus> = {
    pendiente:  'confirmada',
    confirmada: 'completada',
    completada: 'cancelada',
    cancelada:  'pendiente',
};

export function subscribeAppointmentsRange(
    dateFrom: string,
    dateTo: string,
    onData: (appointments: Appointment[]) => void,
): () => void {
    // Range query on 'date' with secondary orderBy('time') would require a composite
    // Firestore index. Sort by time client-side to avoid that requirement.
    const q = query(
        collection(db, 'appointments'),
        where('date', '>=', dateFrom),
        where('date', '<=', dateTo),
        orderBy('date', 'asc'),
    );
    return onSnapshot(q, snap => {
        const appts = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Appointment))
            .sort((a, b) => a.date !== b.date
                ? a.date.localeCompare(b.date)
                : a.time.localeCompare(b.time));
        onData(appts);
    }, err => console.error('[appointmentsService] onSnapshot error:', err));
}

export async function addAppointment(data: AppointmentInput): Promise<string> {
    const ref = await addDoc(collection(db, 'appointments'), data);
    return ref.id;
}

export async function updateAppointment(id: string, data: Partial<AppointmentInput>): Promise<void> {
    await updateDoc(doc(db, 'appointments', id), data);
}

export async function deleteAppointment(id: string): Promise<void> {
    await deleteDoc(doc(db, 'appointments', id));
}
