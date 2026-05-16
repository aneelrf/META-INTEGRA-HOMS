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

function invoiceEstado(total, pagado, oldEstado) {
  if (oldEstado === 'anulada') return 'anulada';
  if (pagado >= total) return 'pagada';
  if (pagado > 0) return 'parcial';
  return 'pendiente';
}

async function firestoreApi() {
  const [firestore, { requireFirestore }] = await Promise.all([
    import('firebase/firestore'),
    import('../../../lib/firebase.js'),
  ]);
  return { ...firestore, db: requireFirestore() };
}

export function listInvoices() {
  return listFirestoreInvoices();
}

export function getInvoice(id) {
  return getFirestoreInvoice(id);
}

export function createInvoice(payload) {
  return createFirestoreInvoice(payload);
}

export function addPayment(invoiceId, payload) {
  return addFirestorePayment(invoiceId, payload);
}

export function deletePayment(invoiceId, paymentId) {
  return deleteFirestorePayment(invoiceId, paymentId);
}

export function voidInvoice(id) {
  return voidFirestoreInvoice(id);
}

export function deleteInvoice(id) {
  return deleteFirestoreInvoice(id);
}

export async function listPayments({ patientId, desde, hasta } = {}) {
  const { collection, getDocs, db } = await firestoreApi();
  const [payments, invoices, patients] = await Promise.all([
    getDocs(collection(db, FIRESTORE_COLLECTIONS.payments)).then(s => s.docs.map(normalizeFirestoreDoc)),
    listFirestoreInvoices(),
    getDocs(collection(db, FIRESTORE_COLLECTIONS.patients)).then(s => s.docs.map(normalizeFirestoreDoc)),
  ]);

  const invMap = new Map(invoices.map(i => [String(i.id), i]));
  const patMap = new Map(patients.map(p => [String(p.id), p]));

  return payments
    .filter(p => !patientId || String(p.patient_id) === String(patientId))
    .filter(p => !desde || String(p.fecha || '').slice(0, 10) >= desde)
    .filter(p => !hasta || String(p.fecha || '').slice(0, 10) <= hasta)
    .map(p => {
      const inv = invMap.get(String(p.invoice_id));
      const pat = patMap.get(String(p.patient_id));
      return {
        ...p,
        paciente_nombre: pat ? `${pat.nombre || ''} ${pat.apellido || ''}`.trim() : 'Paciente',
        cedula: pat?.cedula || null,
        invoice_fecha: inv?.fecha || null,
      };
    })
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
}

async function listFirestoreInvoices() {
  const { collection, getDocs, db } = await firestoreApi();
  const [snap, patients] = await Promise.all([
    getDocs(collection(db, FIRESTORE_COLLECTIONS.invoices)),
    getDocs(collection(db, FIRESTORE_COLLECTIONS.patients)),
  ]);

  const patientMap = new Map(patients.docs.map(d => [d.id, normalizeFirestoreDoc(d)]));
  return snap.docs
    .map(normalizeFirestoreDoc)
    .map(inv => {
      const p = patientMap.get(String(inv.patient_id));
      return {
        ...inv,
        paciente_nombre: p ? `${p.nombre || ''} ${p.apellido || ''}`.trim() : 'Paciente',
        cedula: p?.cedula || null,
      };
    })
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
    .slice(0, 200);
}

async function getFirestoreInvoice(id) {
  const { collection, doc, getDoc, getDocs, query, where, db } = await firestoreApi();
  const ref = doc(db, FIRESTORE_COLLECTIONS.invoices, String(id));
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Factura no encontrada');
  const invoice = normalizeFirestoreDoc(snap);

  const [patient, payments] = await Promise.all([
    getPatientRecord(invoice.patient_id).catch(() => null),
    getDocs(query(collection(db, FIRESTORE_COLLECTIONS.payments), where('invoice_id', '==', String(invoice.id)))),
  ]);

  return {
    ...invoice,
    paciente_nombre: patient ? `${patient.nombre || ''} ${patient.apellido || ''}`.trim() : 'Paciente',
    cedula: patient?.cedula || null,
    direccion: patient?.direccion || null,
    telefono: patient?.telefono || null,
    items: invoice.items || [],
    payments: payments.docs.map(normalizeFirestoreDoc).sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))),
  };
}

async function createFirestoreInvoice(payload) {
  const { addDoc, collection, serverTimestamp, db } = await firestoreApi();
  const data = toFirestorePayload(payload);
  const { items, subtotal } = calcItems(data.items);
  const impuesto = Number(data.impuesto || 0);
  const total = subtotal + impuesto;

  const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.invoices), {
    patient_id: data.patient_id,
    budget_id: data.budget_id ? String(data.budget_id) : null,
    fecha: data.fecha || new Date().toISOString().slice(0, 10),
    estado: 'pendiente',
    subtotal,
    impuesto,
    total,
    pagado: 0,
    notas: data.notas || null,
    items,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return { id: ref.id };
}

async function addFirestorePayment(invoiceId, payload) {
  const { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc, db } = await firestoreApi();
  const invRef = doc(db, FIRESTORE_COLLECTIONS.invoices, String(invoiceId));
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error('Factura no encontrada');
  const invoice = normalizeFirestoreDoc(invSnap);
  if (invoice.estado === 'anulada') throw new Error('Factura anulada');

  const paymentRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.payments), {
    invoice_id: String(invoice.id),
    patient_id: String(invoice.patient_id),
    fecha: payload.fecha || new Date().toISOString(),
    monto: Number(payload.monto),
    metodo: payload.metodo || null,
    referencia: payload.referencia || null,
    notas: payload.notas || null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  const payments = await listPayments({}).then(rows => rows.filter(p => String(p.invoice_id) === String(invoice.id)));
  const pagado = payments.reduce((s, p) => s + Number(p.monto || 0), 0);
  const estado = invoiceEstado(Number(invoice.total || 0), pagado, invoice.estado);
  await updateDoc(invRef, { pagado, estado, updated_at: serverTimestamp() });

  return { id: paymentRef.id };
}

async function deleteFirestorePayment(invoiceId, paymentId) {
  const { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, db } = await firestoreApi();
  const invRef = doc(db, FIRESTORE_COLLECTIONS.invoices, String(invoiceId));
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error('Factura no encontrada');
  const invoice = normalizeFirestoreDoc(invSnap);

  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.payments, String(paymentId)));

  const paySnap = await getDocs(query(collection(db, FIRESTORE_COLLECTIONS.payments), where('invoice_id', '==', String(invoice.id))));
  const pagado = paySnap.docs.map(normalizeFirestoreDoc).reduce((s, p) => s + Number(p.monto || 0), 0);
  const estado = invoiceEstado(Number(invoice.total || 0), pagado, invoice.estado);
  await updateDoc(invRef, { pagado, estado, updated_at: serverTimestamp() });

  return { ok: true };
}

async function voidFirestoreInvoice(id) {
  const { doc, serverTimestamp, updateDoc, db } = await firestoreApi();
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.invoices, String(id)), {
    estado: 'anulada',
    updated_at: serverTimestamp(),
  });
  return { ok: true };
}

async function deleteFirestoreInvoice(id) {
  const { deleteDoc, doc, db } = await firestoreApi();
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.invoices, String(id)));
  return { ok: true };
}
