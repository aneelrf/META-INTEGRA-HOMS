"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAppointmentCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const nodemailer = __importStar(require("nodemailer"));
admin.initializeApp();
const db = admin.firestore();
// ─── SMTP transporter ─────────────────────────────────────────────────────────
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT) || 587,
        secure: Number(process.env.MAIL_PORT) === 465,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
    });
}
// ─── Email HTML template ──────────────────────────────────────────────────────
function buildEmailHtml(params) {
    const serviceRow = params.service ? `
        <tr>
          <td colspan="2" style="padding:0;border-top:1px solid #e5e7eb;"></td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;width:140px;">Servicio</td>
          <td style="padding:10px 0;color:#111827;font-size:15px;font-weight:600;">${params.service}</td>
        </tr>` : '';
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Confirmación de cita — META Integra</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Calibri,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0A1C40 0%,#142C5E 100%);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">META Integra</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.55);font-size:13px;">Hospital Oncológico HOMS</p>
          </td>
        </tr>

        <!-- Gold stripe -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#ECC350,rgba(236,195,80,0.4),transparent);"></td></tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 6px;color:#0A1C40;font-size:20px;font-weight:700;">
              &#10003; Confirmación de cita
            </h2>
            <p style="margin:0 0 28px;color:#6b7280;font-size:14px;">Su cita ha sido registrada exitosamente.</p>

            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hola <strong>${params.patientName}</strong>,<br/>
              Le confirmamos que su cita ha quedado programada con los siguientes datos:
            </p>

            <!-- Appointment details -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f9fafb;border-radius:12px;padding:8px 24px;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:10px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;width:140px;">Profesional</td>
                <td style="padding:10px 0;color:#111827;font-size:15px;font-weight:600;">${params.doctorName}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0;border-top:1px solid #e5e7eb;"></td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Fecha</td>
                <td style="padding:10px 0;color:#111827;font-size:15px;font-weight:600;">${params.date}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0;border-top:1px solid #e5e7eb;"></td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Hora</td>
                <td style="padding:10px 0;color:#111827;font-size:15px;font-weight:600;">${params.time}</td>
              </tr>
              ${serviceRow}
            </table>

            <!-- Notice -->
            <div style="margin:28px 0 24px;padding:16px 20px;background:#fefce8;border:1px solid #fde68a;border-radius:10px;">
              <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                &#9200; <strong>Por favor, llegue 10 minutos antes de la hora programada.</strong>
              </p>
            </div>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7;">
              Si necesita cancelar o reprogramar su cita, comuníquese con nosotros
              con la mayor anticipación posible.<br/>
              Gracias por confiar en META Integra.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
              Este correo fue enviado automáticamente por META Integra &mdash; Hospital Oncológico HOMS.<br/>
              Por favor no responda a este mensaje.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
// ─── Lookup helpers ───────────────────────────────────────────────────────────
async function getPatientEmail(patientId, patientCedula) {
    var _a;
    if (patientId) {
        try {
            const snap = await db.collection('patients').doc(patientId).get();
            if (snap.exists)
                return String(((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.email) || '').trim();
        }
        catch (err) {
            console.warn('[notifications] Patient doc lookup failed:', err);
        }
    }
    if (patientCedula) {
        try {
            const q = await db.collection('patients')
                .where('cedula_pasaporte', '==', patientCedula)
                .limit(1)
                .get();
            if (!q.empty)
                return String(q.docs[0].data().email || '').trim();
        }
        catch (err) {
            console.warn('[notifications] Patient cedula lookup failed:', err);
        }
    }
    return '';
}
async function getDoctorName(doctorUid) {
    var _a;
    if (!doctorUid)
        return 'su médico';
    try {
        const snap = await db.collection('users').doc(doctorUid).get();
        if (snap.exists)
            return String(((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.nombre) || 'su médico').trim();
    }
    catch { /* best effort */ }
    return 'su médico';
}
function formatDate(isoDate) {
    try {
        return new Date(isoDate + 'T12:00:00').toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
    }
    catch {
        return isoDate;
    }
}
async function recordNotification(data) {
    await db.collection('appointment_notifications').add({
        ...data,
        type: 'appointment_confirmation',
        sentAt: data.status === 'sent' ? admin.firestore.FieldValue.serverTimestamp() : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
// ─── Cloud Function ───────────────────────────────────────────────────────────
exports.onAppointmentCreated = (0, firestore_1.onDocumentCreated)({ document: 'appointments/{appointmentId}', region: 'us-central1' }, async (event) => {
    var _a;
    const appt = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!appt)
        return;
    const appointmentId = event.params.appointmentId;
    const { patientId, patientCedula, patientName, date, time, type, doctorUid } = appt;
    console.log(`[notifications] Processing appointment ${appointmentId} for "${patientName}"`);
    // ── 1. Look up patient email ──────────────────────────────────────────
    const patientEmail = await getPatientEmail(patientId || '', patientCedula || '');
    if (!patientEmail) {
        console.log(`[notifications] No email for "${patientName}" — skipping send.`);
        await recordNotification({
            appointmentId,
            patientName,
            patientCedula: patientCedula || '',
            email: '',
            status: 'no_email',
            errorMessage: 'Paciente sin correo registrado',
        });
        return;
    }
    // ── 2. Look up doctor name ────────────────────────────────────────────
    const doctorName = await getDoctorName(doctorUid || '');
    // ── 3. Send email ─────────────────────────────────────────────────────
    let status = 'failed';
    let errorMessage = '';
    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'META Integra'}" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
            to: patientEmail,
            subject: 'Confirmación de cita — META Integra',
            html: buildEmailHtml({
                patientName,
                doctorName,
                date: formatDate(date),
                time,
                service: type || '',
            }),
        });
        status = 'sent';
        console.log(`[notifications] ✓ Email sent to ${patientEmail} for appointment ${appointmentId}`);
    }
    catch (err) {
        errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[notifications] ✗ Email failed for ${appointmentId}:`, err);
    }
    // ── 4. Record result ──────────────────────────────────────────────────
    await recordNotification({
        appointmentId,
        patientName,
        patientCedula: patientCedula || '',
        email: patientEmail,
        status,
        errorMessage,
    });
});
//# sourceMappingURL=index.js.map