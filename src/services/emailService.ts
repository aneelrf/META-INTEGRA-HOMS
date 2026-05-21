import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;

export interface AppointmentEmailParams {
    toEmail:     string;
    patientName: string;
    doctorName:  string;
    date:        string;   // already formatted (e.g. "miércoles, 21 de mayo de 2026")
    time:        string;   // HH:MM
    service:     string;   // appointment type
}

export type EmailResult =
    | { status: 'sent' }
    | { status: 'no_email' }
    | { status: 'failed'; error: string }
    | { status: 'not_configured' };

export async function sendAppointmentConfirmation(
    params: AppointmentEmailParams,
): Promise<EmailResult> {
    if (!params.toEmail?.trim()) return { status: 'no_email' };

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.warn('[emailService] EmailJS not configured — skipping send.');
        return { status: 'not_configured' };
    }

    try {
        await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            {
                to_email:     params.toEmail,
                patient_name: params.patientName,
                doctor_name:  params.doctorName,
                date:         params.date,
                time:         params.time,
                service:      params.service,
            },
            { publicKey: PUBLIC_KEY },
        );
        return { status: 'sent' };
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : String(err);
        console.error('[emailService] Send error:', err);
        return { status: 'failed', error };
    }
}
