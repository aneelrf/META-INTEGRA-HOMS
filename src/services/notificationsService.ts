import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { EmailResult } from './emailService';

export interface AppointmentNotification {
    appointmentId: string;
    patientName:   string;
    patientCedula: string;
    email:         string;
    type:          'appointment_confirmation';
    status:        'sent' | 'failed' | 'no_email' | 'not_configured';
    errorMessage:  string;
    sentAt:        string | null;
    createdAt:     string;
}

export async function recordAppointmentNotification(
    appointmentId: string,
    patientName:   string,
    patientCedula: string,
    email:         string,
    result:        EmailResult,
): Promise<void> {
    const now = new Date().toISOString();
    const data: Omit<AppointmentNotification, never> = {
        appointmentId,
        patientName,
        patientCedula,
        email,
        type:         'appointment_confirmation',
        status:       result.status,
        errorMessage: result.status === 'failed' ? result.error : '',
        sentAt:       result.status === 'sent' ? now : null,
        createdAt:    now,
    };
    try {
        await addDoc(collection(db, 'appointment_notifications'), data);
    } catch (err) {
        console.error('[notificationsService] Failed to record notification:', err);
    }
}
