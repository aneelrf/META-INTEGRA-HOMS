import { FIRESTORE_COLLECTIONS } from '../../../lib/firestoreCollections.js';
import { getAppointments } from '../../agenda/services/agendaService.js';
import { getPatientConsultations as getConsultationsForPatient } from '../../consultas/services/consultasService.js';
import { getPatientFinances as getFinancesForPatient } from '../../finanzas/services/financesService.js';
import { getPatientHistoria as getHistoriaForPatient } from '../../historia-clinica-form/services/clinicalHistoryFormService.js';
import { deletePatient as deletePatientRecord, getPatient as getPatientRecord } from '../../pacientes/services/pacientesService.js';

export function getPatient(patientId) {
  return getPatientRecord(patientId);
}

export function deletePatient(patientId) {
  return deletePatientRecord(patientId);
}

export function getPatientConsultations(patientId) {
  return getConsultationsForPatient(patientId);
}

export function getPatientProcedures(patientId) {
  return getFirestorePatientProcedures(patientId);
}

export function getPatientMedications(patientId) {
  return getFirestorePatientMedications(patientId);
}

export function getPatientMedicationTitrations(patientId) {
  return getFirestorePatientMedicationTitrations(patientId);
}

export function getAppointmentsBetween(desde, hasta) {
  return getAppointments(desde, hasta);
}

export function getPatientAppointments(patientId, desde, hasta) {
  return getAppointmentsBetween(desde, hasta)
    .then(appointments => appointments.filter(a => String(a.patient_id) === String(patientId)));
}

export function getPatientHistoria(patientId) {
  return getHistoriaForPatient(patientId);
}

export function getPatientFinances(patientId) {
  return getFinancesForPatient(patientId);
}

export function createProcedure(payload) {
  return createFirestoreProcedure(payload);
}

export function updateProcedureEvaPost(procedureId, evaPost) {
  return updateFirestoreProcedure(procedureId, { eva_post: evaPost });
}

export function createMedication(payload) {
  return createFirestoreMedication(payload);
}

export function createMedicationTitration(medicationId, payload) {
  return createFirestoreMedicationTitration(medicationId, payload);
}

export function updateMedicationActive(medicationId, active) {
  return updateFirestoreMedication(medicationId, { activo: active });
}

export async function getMedicationsByIds(idsCsv) {
  const ids = String(idsCsv || '').split(',').map(v => v.trim()).filter(Boolean);
  if (!ids.length) return [];

  const medications = (await Promise.all(ids.map(id => getFirestoreMedication(id).catch(() => null)))).filter(Boolean);
  const [patients, titrations] = await Promise.all([
    Promise.all(medications.map(m => getPatientRecord(m.patient_id).catch(() => null))).then(rows => rows.filter(Boolean)),
    getAllFirestoreMedicationTitrations(),
  ]);

  const medsById = new Map(medications.map(m => [String(m.id), m]));
  const patientById = new Map(patients.map(p => [String(p.id), p]));
  const titrByMed = groupByMedication(titrations);

  return ids
    .map(id => medsById.get(id))
    .filter(Boolean)
    .map(med => {
      const patient = patientById.get(String(med.patient_id)) || {};
      const medTitrations = (titrByMed.get(String(med.id)) || []).sort(sortByDateDesc);
      return {
        ...med,
        ...pickPatientFields(patient),
        titrations: medTitrations,
        ultima_titulacion: medTitrations[0] || null,
      };
    });
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

function sortByDateDesc(a, b) {
  const ka = String(a.fecha || a.date || '');
  const kb = String(b.fecha || b.date || '');
  return kb.localeCompare(ka);
}

function pickPatientFields(patient) {
  return {
    nombre: patient.nombre,
    apellido: patient.apellido,
    cedula: patient.cedula,
    fecha_nacimiento: patient.fecha_nacimiento,
    telefono: patient.telefono,
    direccion: patient.direccion,
  };
}

function groupByMedication(titrations) {
  const map = new Map();
  for (const t of titrations) {
    const key = String(t.medication_id);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  return map;
}

async function getFirestorePatientProcedures(patientId) {
  const { collection, getDocs, query, where, db } = await firestoreApi();
  const snapshot = await getDocs(query(
    collection(db, FIRESTORE_COLLECTIONS.procedures),
    where('patient_id', '==', String(patientId)),
  ));
  return snapshot.docs.map(normalizeFirestoreDoc).sort(sortByDateDesc);
}

async function createFirestoreProcedure(payload) {
  const { addDoc, collection, serverTimestamp, db } = await firestoreApi();
  const data = {
    ...payload,
    patient_id: String(payload.patient_id),
    followup_days: payload.followup_days ?? null,
    eva_pre: payload.eva_pre ?? null,
    fecha: payload.fecha || new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.procedures), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  if (data.followup_days && data.followup_days > 0) {
    const followDate = new Date();
    followDate.setDate(followDate.getDate() + Number(data.followup_days));
    await addDoc(collection(db, FIRESTORE_COLLECTIONS.appointments), {
      patient_id: data.patient_id,
      tipo: 'followup',
      fecha: followDate.toISOString().slice(0, 10),
      procedure_id: ref.id,
      motivo: `Seguimiento post-${data.tipo}${data.subtipo ? `: ${data.subtipo}` : ''}`,
      estado: 'pendiente',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }

  return { procedure: { ...data, id: ref.id } };
}

async function updateFirestoreProcedure(procedureId, patch) {
  const { doc, serverTimestamp, updateDoc, db } = await firestoreApi();
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.procedures, String(procedureId)), {
    ...patch,
    updated_at: serverTimestamp(),
  });
  return { ok: true };
}

async function getAllFirestoreMedicationTitrations() {
  const { collection, getDocs, db } = await firestoreApi();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.medicationTitrations));
  return snapshot.docs.map(normalizeFirestoreDoc);
}

async function getFirestorePatientMedications(patientId) {
  const { collection, getDocs, query, where, db } = await firestoreApi();
  const [medSnap, titrations] = await Promise.all([
    getDocs(query(collection(db, FIRESTORE_COLLECTIONS.medications), where('patient_id', '==', String(patientId)))),
    getAllFirestoreMedicationTitrations(),
  ]);

  const titrByMed = groupByMedication(titrations);
  return medSnap.docs
    .map(normalizeFirestoreDoc)
    .map(med => {
      const medTitrations = (titrByMed.get(String(med.id)) || []).sort(sortByDateDesc);
      return {
        ...med,
        es_opioide: !!med.es_opioide,
        activo: med.activo !== false,
        titrations: medTitrations,
        ultima_titulacion: medTitrations[0] || null,
      };
    })
    .sort((a, b) => Number(b.activo) - Number(a.activo) || String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
}

async function getFirestorePatientMedicationTitrations(patientId) {
  const meds = await getFirestorePatientMedications(patientId);
  const rows = [];
  for (const med of meds) {
    for (const t of med.titrations || []) {
      rows.push({
        ...t,
        farmaco: med.farmaco,
        es_opioide: !!med.es_opioide,
      });
    }
  }
  return rows.sort(sortByDateDesc);
}

async function createFirestoreMedication(payload) {
  const { addDoc, collection, serverTimestamp, db } = await firestoreApi();
  const data = {
    patient_id: String(payload.patient_id),
    farmaco: payload.farmaco,
    es_opioide: !!payload.es_opioide,
    activo: true,
    fecha_inicio: payload.fecha_inicio || new Date().toISOString().slice(0, 10),
    fecha_fin: payload.fecha_fin || null,
    notas: payload.notas || null,
  };
  const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.medications), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  if (payload.dosis_inicial) {
    await addDoc(collection(db, FIRESTORE_COLLECTIONS.medicationTitrations), {
      medication_id: ref.id,
      fecha: new Date().toISOString().slice(0, 10),
      dosis: payload.dosis_inicial,
      frecuencia: payload.frecuencia_inicial || null,
      via: payload.via_inicial || null,
      motivo_cambio: 'Inicio',
      notas: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }

  return { id: ref.id };
}

async function createFirestoreMedicationTitration(medicationId, payload) {
  const { addDoc, collection, doc, serverTimestamp, updateDoc, db } = await firestoreApi();
  const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.medicationTitrations), {
    medication_id: String(medicationId),
    fecha: payload.fecha || new Date().toISOString().slice(0, 10),
    dosis: payload.dosis,
    frecuencia: payload.frecuencia || null,
    via: payload.via || null,
    motivo_cambio: payload.motivo_cambio || null,
    notas: payload.notas || null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.medications, String(medicationId)), { updated_at: serverTimestamp() });
  return { id: ref.id };
}

async function updateFirestoreMedication(medicationId, patch) {
  const { doc, serverTimestamp, updateDoc, db } = await firestoreApi();
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.medications, String(medicationId)), {
    ...patch,
    updated_at: serverTimestamp(),
  });
  return { ok: true };
}

async function getFirestoreMedication(id) {
  const { doc, getDoc, db } = await firestoreApi();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.medications, String(id)));
  if (!snapshot.exists()) throw new Error('Prescripcion no encontrada');
  const med = normalizeFirestoreDoc(snapshot);
  return {
    ...med,
    es_opioide: !!med.es_opioide,
    activo: med.activo !== false,
  };
}
