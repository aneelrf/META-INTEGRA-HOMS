import { FIRESTORE_COLLECTIONS } from '../../../lib/firestoreCollections.js';
import { listPatients } from '../../pacientes/services/pacientesService.js';

function toFirestoreAppointmentPayload(payload) {
  return {
    patient_id: String(payload.patient_id),
    tipo: payload.tipo || 'cita',
    fecha: payload.fecha,
    hora: payload.hora || null,
    motivo: payload.motivo || null,
    notas: payload.notas || null,
    procedure_id: payload.procedure_id || null,
    estado: payload.estado || 'pendiente',
  };
}

function normalizeFirestoreAppointment(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    created_at: data.created_at?.toDate?.().toISOString?.() || data.created_at || null,
    updated_at: data.updated_at?.toDate?.().toISOString?.() || data.updated_at || null,
  };
}

async function firestoreApi() {
  const [
    firestore,
    { requireFirestore },
  ] = await Promise.all([
    import('firebase/firestore'),
    import('../../../lib/firebase.js'),
  ]);

  return { ...firestore, db: requireFirestore() };
}

function addPatientInfo(appointments, patients) {
  const patientMap = new Map(patients.map(patient => [String(patient.id), patient]));
  return appointments.map(appointment => {
    const patient = patientMap.get(String(appointment.patient_id));
    return {
      ...appointment,
      paciente_nombre: patient ? `${patient.nombre || ''} ${patient.apellido || ''}`.trim() : 'Paciente',
      cedula: patient?.cedula || null,
    };
  });
}

function sortAppointments(a, b) {
  const byDate = String(a.fecha || '').localeCompare(String(b.fecha || ''));
  if (byDate !== 0) return byDate;
  return String(a.hora || '').localeCompare(String(b.hora || ''));
}

export function getAppointments(desde, hasta) {
  return getFirestoreAppointments(desde, hasta);
}

export function getPendingFollowups() {
  return getFirestorePendingFollowups();
}

export function getPatients() {
  return listPatients();
}

export function createAppointment(payload) {
  return createFirestoreAppointment(payload);
}

export function updateAppointmentStatus(id, estado) {
  return updateFirestoreAppointmentStatus(id, estado);
}

async function getAllFirestoreAppointments() {
  const { collection, getDocs, db } = await firestoreApi();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.appointments));
  return snapshot.docs.map(normalizeFirestoreAppointment);
}

async function getFirestoreAppointments(desde, hasta = desde) {
  const [appointments, patients] = await Promise.all([
    getAllFirestoreAppointments(),
    listPatients(),
  ]);

  return addPatientInfo(
    appointments
      .filter(appointment => appointment.fecha >= desde && appointment.fecha <= hasta)
      .sort(sortAppointments),
    patients,
  );
}

async function getFirestorePendingFollowups() {
  const today = new Date();
  const cutoff = new Date();
  cutoff.setDate(today.getDate() + 7);
  const todayISO = today.toISOString().slice(0, 10);
  const cutoffISO = cutoff.toISOString().slice(0, 10);

  const [appointments, patients] = await Promise.all([
    getAllFirestoreAppointments(),
    listPatients(),
  ]);

  return addPatientInfo(
    appointments
      .filter(appointment => (
        appointment.tipo === 'followup'
        && appointment.estado === 'pendiente'
        && appointment.fecha >= todayISO
        && appointment.fecha <= cutoffISO
      ))
      .sort(sortAppointments),
    patients,
  );
}

async function createFirestoreAppointment(payload) {
  const { addDoc, collection, serverTimestamp, db } = await firestoreApi();
  const data = toFirestoreAppointmentPayload(payload);
  const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.appointments), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return { appointment: { ...data, id: ref.id } };
}

async function updateFirestoreAppointmentStatus(id, estado) {
  const { doc, serverTimestamp, updateDoc, db } = await firestoreApi();
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.appointments, String(id)), {
    estado,
    updated_at: serverTimestamp(),
  });
  return { ok: true };
}
