import { FIRESTORE_COLLECTIONS } from '../../../lib/firestoreCollections.js';
import { getAppointments, getPendingFollowups } from '../../agenda/services/agendaService.js';
import { listPatients } from '../../pacientes/services/pacientesService.js';

export function getFollowups() {
  return getPendingFollowups();
}

export function getTodayAppointments() {
  const today = new Date().toISOString().slice(0, 10);
  return getAppointments(today, today);
}

export function getPatientCount() {
  return listPatients().then(patients => patients.length);
}

export function getAlerts() {
  return getFirebaseAlerts();
}

async function firestoreApi() {
  const [firestore, { requireFirestore }] = await Promise.all([
    import('firebase/firestore'),
    import('../../../lib/firebase.js'),
  ]);
  return { ...firestore, db: requireFirestore() };
}

function normalizeFirestoreDoc(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    created_at: data.created_at?.toDate?.().toISOString?.() || data.created_at || null,
    updated_at: data.updated_at?.toDate?.().toISOString?.() || data.updated_at || null,
  };
}

function daysBetween(startDate, endDate) {
  const start = new Date(String(startDate).slice(0, 10));
  const end = new Date(String(endDate).slice(0, 10));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end - start) / 86400000);
}

function patientName(patient) {
  return `${patient?.nombre || ''} ${patient?.apellido || ''}`.trim() || 'Paciente';
}

function latestByDate(rows, field) {
  return [...rows].sort((a, b) => String(b[field] || '').localeCompare(String(a[field] || '')))[0] || null;
}

function groupByPatient(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = String(row.patient_id);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

async function getFirebaseAlerts() {
  const { collection, getDocs, db } = await firestoreApi();
  const today = new Date().toISOString().slice(0, 10);
  const [patientsSnap, consultationsSnap, medicationsSnap, appointmentsSnap] = await Promise.all([
    getDocs(collection(db, FIRESTORE_COLLECTIONS.patients)),
    getDocs(collection(db, FIRESTORE_COLLECTIONS.consultations)),
    getDocs(collection(db, FIRESTORE_COLLECTIONS.medications)),
    getDocs(collection(db, FIRESTORE_COLLECTIONS.appointments)),
  ]);

  const patients = patientsSnap.docs.map(normalizeFirestoreDoc);
  const consultations = consultationsSnap.docs.map(normalizeFirestoreDoc);
  const medications = medicationsSnap.docs.map(normalizeFirestoreDoc);
  const appointments = appointmentsSnap.docs.map(normalizeFirestoreDoc);
  const patientMap = new Map(patients.map(patient => [String(patient.id), patient]));
  const consultationsByPatient = groupByPatient(consultations);
  const appointmentsByPatient = groupByPatient(appointments);

  const opioidesByPatient = new Map();
  for (const medication of medications) {
    if (medication.activo === false || !medication.es_opioide) continue;
    const key = String(medication.patient_id);
    if (!opioidesByPatient.has(key)) opioidesByPatient.set(key, []);
    opioidesByPatient.get(key).push(medication);
  }

  const opioides_sin_revision = Array.from(opioidesByPatient.entries())
    .map(([patientId, patientMedications]) => {
      const patient = patientMap.get(patientId);
      const latestConsultation = latestByDate(consultationsByPatient.get(patientId) || [], 'date');
      const firstMedicationDate = [...patientMedications]
        .sort((a, b) => String(a.fecha_inicio || '').localeCompare(String(b.fecha_inicio || '')))[0]?.fecha_inicio;
      const referenceDate = latestConsultation?.date || firstMedicationDate;
      const dias_sin_revision = daysBetween(referenceDate, today);
      return {
        id: patientId,
        nombre: patient?.nombre || '',
        apellido: patient?.apellido || '',
        opioides: patientMedications.map(m => m.farmaco).filter(Boolean).join(', '),
        ultima_consulta: latestConsultation?.date || null,
        dias_sin_revision,
      };
    })
    .filter(row => row.dias_sin_revision >= 90)
    .sort((a, b) => b.dias_sin_revision - a.dias_sin_revision);

  const seguimientos_vencidos = appointments
    .filter(appointment => (
      appointment.tipo === 'followup'
      && appointment.estado === 'pendiente'
      && String(appointment.fecha || '') < today
    ))
    .map(appointment => {
      const patient = patientMap.get(String(appointment.patient_id));
      return {
        id: appointment.id,
        fecha: appointment.fecha,
        motivo: appointment.motivo,
        patient_id: appointment.patient_id,
        paciente_nombre: patientName(patient),
        dias_atraso: daysBetween(appointment.fecha, today),
      };
    })
    .sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')));

  const eva_alto_sin_retorno = patients
    .map(patient => {
      const patientId = String(patient.id);
      const latestConsultation = latestByDate(consultationsByPatient.get(patientId) || [], 'date');
      if (!latestConsultation || Number(latestConsultation.eva || 0) < 7) return null;
      const hasFutureAppointment = (appointmentsByPatient.get(patientId) || []).some(appointment => (
        appointment.estado === 'pendiente' && String(appointment.fecha || '') >= today
      ));
      const dias_sin_volver = daysBetween(latestConsultation.date, today);
      if (dias_sin_volver <= 14 || hasFutureAppointment) return null;
      return {
        id: patient.id,
        nombre: patient.nombre || '',
        apellido: patient.apellido || '',
        ultima_consulta: latestConsultation.date,
        eva: latestConsultation.eva,
        dias_sin_volver,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.eva || 0) - Number(a.eva || 0) || String(a.ultima_consulta || '').localeCompare(String(b.ultima_consulta || '')));

  return {
    opioides_sin_revision,
    seguimientos_vencidos,
    eva_alto_sin_retorno,
    total: opioides_sin_revision.length + seguimientos_vencidos.length + eva_alto_sin_retorno.length,
  };
}
