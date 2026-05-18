import { FIRESTORE_COLLECTIONS } from '../../../lib/firestoreCollections.js';
import { getPatient as getPatientRecord } from '../../pacientes/services/pacientesService.js';

function toFirestorePayload(payload) {
  const data = { ...payload };
  if (data.patient_id !== undefined) data.patient_id = String(data.patient_id);
  return data;
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

function calcItems(items) {
  const mapped = (items || []).map((it, i) => ({
    ...it,
    cantidad: Number(it.cantidad),
    precio_unitario: Number(it.precio_unitario),
    subtotal: Number(it.cantidad) * Number(it.precio_unitario),
    orden: i,
  }));
  const subtotal = mapped.reduce((s, it) => s + it.subtotal, 0);
  return { items: mapped, subtotal };
}

async function firestoreApi() {
  const [firestore, { requireFirestore }] = await Promise.all([
    import('firebase/firestore'),
    import('../../../lib/firebase.js'),
  ]);
  return { ...firestore, db: requireFirestore() };
}

export function getBudget(id) {
  return getFirestoreBudget(id);
}

export function createBudget(payload) {
  return createFirestoreBudget(payload);
}

export function updateBudget(id, payload) {
  return updateFirestoreBudget(id, payload);
}

export function convertBudgetToInvoice(id) {
  return convertFirestoreBudgetToInvoice(id);
}

export function deleteBudget(id) {
  return deleteFirestoreBudget(id);
}

export async function listBudgets(patientId) {
  const { collection, getDocs, query, where, db } = await firestoreApi();
  const ref = collection(db, FIRESTORE_COLLECTIONS.budgets);
  const snap = patientId
    ? await getDocs(query(ref, where('patient_id', '==', String(patientId))))
    : await getDocs(ref);

  const rows = await Promise.all(snap.docs.map(async (docSnap) => {
    const row = normalizeFirestoreDoc(docSnap);
    const patient = await getPatientRecord(row.patient_id).catch(() => null);
    return {
      ...row,
      paciente_nombre: patient ? `${patient.nombre || ''} ${patient.apellido || ''}`.trim() : 'Paciente',
      cedula: patient?.cedula || null,
    };
  }));

  return rows.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
}

async function getFirestoreBudget(id) {
  const { doc, getDoc, db } = await firestoreApi();
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.budgets, String(id)));
  if (!snap.exists()) throw new Error('Presupuesto no encontrado');

  const budget = normalizeFirestoreDoc(snap);
  const patient = await getPatientRecord(budget.patient_id).catch(() => null);
  return {
    ...budget,
    paciente_nombre: patient ? `${patient.nombre || ''} ${patient.apellido || ''}`.trim() : 'Paciente',
    cedula: patient?.cedula || null,
  };
}

async function createFirestoreBudget(payload) {
  const { addDoc, collection, serverTimestamp, db } = await firestoreApi();
  const data = toFirestorePayload(payload);
  const { items, subtotal } = calcItems(data.items);
  const impuesto = Number(data.impuesto || 0);
  const total = subtotal + impuesto;

  const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.budgets), {
    patient_id: data.patient_id,
    fecha: data.fecha || new Date().toISOString().slice(0, 10),
    estado: data.estado || 'borrador',
    impuesto,
    notas: data.notas || null,
    items,
    subtotal,
    total,
    invoice_id: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return { id: ref.id };
}

async function updateFirestoreBudget(id, payload) {
  const { doc, getDoc, serverTimestamp, updateDoc, db } = await firestoreApi();
  const ref = doc(db, FIRESTORE_COLLECTIONS.budgets, String(id));
  const existingSnap = await getDoc(ref);
  if (!existingSnap.exists()) throw new Error('No encontrado');
  const existing = normalizeFirestoreDoc(existingSnap);
  if (existing.estado === 'facturado') throw new Error('Presupuesto ya facturado, no se puede editar');

  const patch = toFirestorePayload(payload);
  const next = {};
  if (patch.fecha !== undefined) next.fecha = patch.fecha;
  if (patch.estado !== undefined) next.estado = patch.estado;
  if (patch.notas !== undefined) next.notas = patch.notas;
  if (patch.impuesto !== undefined) next.impuesto = Number(patch.impuesto || 0);

  if (patch.items) {
    const { items, subtotal } = calcItems(patch.items);
    next.items = items;
    next.subtotal = subtotal;
    next.total = subtotal + Number(next.impuesto ?? existing.impuesto ?? 0);
  } else if (patch.impuesto !== undefined) {
    next.total = Number(existing.subtotal || 0) + Number(next.impuesto || 0);
  }

  await updateDoc(ref, { ...next, updated_at: serverTimestamp() });
  return { ok: true };
}

async function deleteFirestoreBudget(id) {
  const { deleteDoc, doc, getDoc, db } = await firestoreApi();
  const ref = doc(db, FIRESTORE_COLLECTIONS.budgets, String(id));
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().estado === 'facturado') {
    throw new Error('Presupuesto facturado, no se puede eliminar');
  }
  await deleteDoc(ref);
  return { ok: true };
}

async function convertFirestoreBudgetToInvoice(id) {
  const { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc, db } = await firestoreApi();
  const budgetRef = doc(db, FIRESTORE_COLLECTIONS.budgets, String(id));
  const snap = await getDoc(budgetRef);
  if (!snap.exists()) throw new Error('Presupuesto no encontrado');
  const budget = normalizeFirestoreDoc(snap);

  if (budget.estado === 'facturado') throw new Error('Ya fue facturado');
  if (budget.estado === 'cancelado') throw new Error('Presupuesto cancelado');

  const invRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.invoices), {
    patient_id: budget.patient_id,
    budget_id: budget.id,
    fecha: new Date().toISOString().slice(0, 10),
    estado: 'pendiente',
    subtotal: Number(budget.subtotal || 0),
    impuesto: Number(budget.impuesto || 0),
    total: Number(budget.total || 0),
    pagado: 0,
    notas: budget.notas || null,
    items: budget.items || [],
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await updateDoc(budgetRef, {
    estado: 'facturado',
    invoice_id: invRef.id,
    updated_at: serverTimestamp(),
  });

  return { invoice_id: invRef.id };
}
