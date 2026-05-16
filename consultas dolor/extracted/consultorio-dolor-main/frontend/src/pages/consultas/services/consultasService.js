import { FIRESTORE_COLLECTIONS } from '../../../lib/firestoreCollections.js';

function toFirestorePayload(payload) {
  const data = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) data[key] = value;
  }
  if (data.patient_id !== undefined) data.patient_id = String(data.patient_id);
  if (!data.date) data.date = new Date().toISOString();
  return data;
}

function normalizeFirestoreConsultation(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    created_at: data.created_at?.toDate?.().toISOString?.() || data.created_at || null,
    updated_at: data.updated_at?.toDate?.().toISOString?.() || data.updated_at || null,
  };
}

function sortConsultationsDesc(a, b) {
  return String(b.date || '').localeCompare(String(a.date || ''));
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

export function getConsultation(id) {
  return getFirestoreConsultation(id);
}

export function getPatientConsultations(patientId) {
  return getFirestorePatientConsultations(patientId);
}

export function createConsultation(payload) {
  return createFirestoreConsultation(payload);
}

export function updateConsultation(id, payload) {
  return updateFirestoreConsultation(id, payload);
}

export function deleteConsultation(id) {
  return deleteFirestoreConsultation(id);
}

async function getFirestoreConsultation(id) {
  const { doc, getDoc, db } = await firestoreApi();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.consultations, String(id)));
  if (!snapshot.exists()) throw new Error('Consulta no encontrada');
  return normalizeFirestoreConsultation(snapshot);
}

async function getFirestorePatientConsultations(patientId) {
  const { collection, getDocs, query, where, db } = await firestoreApi();
  const snapshot = await getDocs(query(
    collection(db, FIRESTORE_COLLECTIONS.consultations),
    where('patient_id', '==', String(patientId)),
  ));

  return snapshot.docs
    .map(normalizeFirestoreConsultation)
    .sort(sortConsultationsDesc);
}

async function createFirestoreConsultation(payload) {
  const { addDoc, collection, serverTimestamp, db } = await firestoreApi();
  const data = toFirestorePayload(payload);
  const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.consultations), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return { ...data, id: ref.id };
}

async function updateFirestoreConsultation(id, payload) {
  const { doc, serverTimestamp, updateDoc, db } = await firestoreApi();
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.consultations, String(id)), {
    ...toFirestorePayload(payload),
    updated_at: serverTimestamp(),
  });
  return { consultation: await getFirestoreConsultation(id) };
}

async function deleteFirestoreConsultation(id) {
  const { deleteDoc, doc, db } = await firestoreApi();
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.consultations, String(id)));
  return { ok: true };
}
