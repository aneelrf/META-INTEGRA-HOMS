import { FIRESTORE_COLLECTIONS } from '../../../lib/firestoreCollections.js';

function cleanPayload(payload) {
  const cleaned = {};
  for (const [key, value] of Object.entries(payload)) {
    cleaned[key] = value === undefined ? null : value;
  }
  return cleaned;
}

function normalizeFirestorePatient(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    created_at: data.created_at?.toDate?.().toISOString?.() || data.created_at || null,
    updated_at: data.updated_at?.toDate?.().toISOString?.() || data.updated_at || null,
  };
}

function matchesPatientSearch(patient, query) {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  return [
    patient.nombre,
    patient.apellido,
    patient.cedula,
    patient.direccion,
    patient.referente_nombre,
  ].some(value => String(value || '').toLowerCase().includes(needle));
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

export function listPatients(query) {
  return listFirestorePatients(query);
}

export function getPatient(id) {
  return getFirestorePatient(id);
}

export function createPatient(payload) {
  return createFirestorePatient(payload);
}

export function updatePatient(id, payload) {
  return updateFirestorePatient(id, payload);
}

export function deletePatient(id) {
  return deleteFirestorePatient(id);
}

async function listFirestorePatients(query) {
  const { collection, getDocs, limit, orderBy, query: buildQuery, db } = await firestoreApi();
  const ref = collection(db, FIRESTORE_COLLECTIONS.patients);
  const snapshot = await getDocs(buildQuery(ref, orderBy('updated_at', 'desc'), limit(100)));
  return snapshot.docs
    .map(normalizeFirestorePatient)
    .filter(patient => matchesPatientSearch(patient, query))
    .slice(0, query ? 100 : 50);
}

async function getFirestorePatient(id) {
  const { doc, getDoc, db } = await firestoreApi();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.patients, String(id)));
  if (!snapshot.exists()) throw new Error('Paciente no encontrado');
  return normalizeFirestorePatient(snapshot);
}

async function createFirestorePatient(payload) {
  const { addDoc, collection, serverTimestamp, db } = await firestoreApi();
  const data = cleanPayload(payload);
  const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.patients), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return { ...data, id: ref.id };
}

async function updateFirestorePatient(id, payload) {
  const { doc, serverTimestamp, updateDoc, db } = await firestoreApi();
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.patients, String(id)), {
    ...cleanPayload(payload),
    updated_at: serverTimestamp(),
  });
  return { patient: await getFirestorePatient(id) };
}

async function deleteFirestorePatient(id) {
  const { deleteDoc, doc, db } = await firestoreApi();
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.patients, String(id)));
  return { ok: true };
}
