import { FIRESTORE_COLLECTIONS } from '../../../lib/firestoreCollections.js';
import { listPatients } from '../../pacientes/services/pacientesService.js';

function normalizeFirestoreDoc(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    created_at: data.created_at?.toDate?.().toISOString?.() || data.created_at || null,
    updated_at: data.updated_at?.toDate?.().toISOString?.() || data.updated_at || null,
  };
}

async function firestoreApi() {
  const [firestore, { requireFirestore }] = await Promise.all([
    import('firebase/firestore'),
    import('../../../lib/firebase.js'),
  ]);
  return { ...firestore, db: requireFirestore() };
}

export function listProcedures({ desde, hasta, tipo } = {}) {
  return listFirestoreProcedures({ desde, hasta, tipo });
}

async function listFirestoreProcedures({ desde, hasta, tipo } = {}) {
  const { collection, getDocs, db } = await firestoreApi();
  const [snapshot, patients] = await Promise.all([
    getDocs(collection(db, FIRESTORE_COLLECTIONS.procedures)),
    listPatients(),
  ]);

  const patientMap = new Map(patients.map(patient => [String(patient.id), patient]));
  return snapshot.docs
    .map(normalizeFirestoreDoc)
    .filter(proc => !tipo || proc.tipo === tipo)
    .filter(proc => !desde || String(proc.fecha || '').slice(0, 10) >= desde)
    .filter(proc => !hasta || String(proc.fecha || '').slice(0, 10) <= hasta)
    .map(proc => {
      const patient = patientMap.get(String(proc.patient_id));
      return {
        ...proc,
        paciente_nombre: patient ? `${patient.nombre || ''} ${patient.apellido || ''}`.trim() : 'Paciente',
        cedula: patient?.cedula || null,
      };
    })
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
    .slice(0, 200);
}
