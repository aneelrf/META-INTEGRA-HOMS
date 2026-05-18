import { listBudgets } from './budgetsService.js';
import { listInvoices, listPayments } from './invoicesService.js';

export function getSummary() {
  return getFirebaseSummary();
}

export function getDeudores() {
  return getFirebaseDeudores();
}

export function getPorMes() {
  return getFirebasePorMes();
}

export function getPatientFinances(patientId) {
  return getFirebasePatientFinances(patientId);
}

function monthKey(dateLike) {
  return String(dateLike || '').slice(0, 7);
}

async function getFirebaseSummary() {
  const [invoices, payments] = await Promise.all([
    listInvoices(),
    listPayments(),
  ]);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const total_pendiente = invoices
    .filter(i => i.estado === 'pendiente' || i.estado === 'parcial')
    .reduce((s, i) => s + (Number(i.total || 0) - Number(i.pagado || 0)), 0);

  const mesInvoices = invoices.filter(i => monthKey(i.fecha) === currentMonth && i.estado !== 'anulada');
  const mesPayments = payments.filter(p => monthKey(p.fecha) === currentMonth);

  const patientsWithDebt = new Set(
    invoices
      .filter(i => i.estado === 'pendiente' || i.estado === 'parcial')
      .map(i => String(i.patient_id)),
  );

  return {
    total_pendiente,
    cobrado_global: payments.reduce((s, p) => s + Number(p.monto || 0), 0),
    facturado_mes: mesInvoices.reduce((s, i) => s + Number(i.total || 0), 0),
    facturas_mes: mesInvoices.length,
    cobrado_mes: mesPayments.reduce((s, p) => s + Number(p.monto || 0), 0),
    pagos_mes: mesPayments.length,
    pacientes_con_deuda: patientsWithDebt.size,
  };
}

async function getFirebaseDeudores() {
  const invoices = await listInvoices();
  const byPatient = new Map();

  for (const inv of invoices) {
    if (!(inv.estado === 'pendiente' || inv.estado === 'parcial')) continue;
    const key = String(inv.patient_id);
    const current = byPatient.get(key) || {
      id: inv.patient_id,
      nombre: '',
      apellido: '',
      cedula: inv.cedula || null,
      telefono: null,
      facturas_pendientes: 0,
      deuda: 0,
    };
    current.paciente_nombre = inv.paciente_nombre;
    const [nombre = '', ...rest] = String(inv.paciente_nombre || '').split(' ');
    current.nombre = nombre;
    current.apellido = rest.join(' ');
    current.facturas_pendientes += 1;
    current.deuda += Number(inv.total || 0) - Number(inv.pagado || 0);
    byPatient.set(key, current);
  }

  return Array.from(byPatient.values()).sort((a, b) => b.deuda - a.deuda);
}

async function getFirebasePorMes() {
  const [invoices, payments] = await Promise.all([listInvoices(), listPayments()]);
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return months.map(mes => ({
    mes,
    facturado: invoices
      .filter(i => monthKey(i.fecha) === mes && i.estado !== 'anulada')
      .reduce((s, i) => s + Number(i.total || 0), 0),
    cobrado: payments
      .filter(p => monthKey(p.fecha) === mes)
      .reduce((s, p) => s + Number(p.monto || 0), 0),
  }));
}

async function getFirebasePatientFinances(patientId) {
  const [invoices, budgets, payments] = await Promise.all([
    listInvoices(),
    listBudgets(patientId),
    listPayments({ patientId }),
  ]);

  const patientInvoices = invoices.filter(i => String(i.patient_id) === String(patientId));

  const total_facturado = patientInvoices
    .filter(i => i.estado !== 'anulada')
    .reduce((s, i) => s + Number(i.total || 0), 0);

  const total_pagado = payments.reduce((s, p) => s + Number(p.monto || 0), 0);

  const deuda = patientInvoices
    .filter(i => i.estado === 'pendiente' || i.estado === 'parcial')
    .reduce((s, i) => s + (Number(i.total || 0) - Number(i.pagado || 0)), 0);

  return {
    invoices: patientInvoices.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))),
    payments: payments.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))),
    budgets: budgets.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))),
    summary: { total_facturado, total_pagado, deuda },
  };
}
