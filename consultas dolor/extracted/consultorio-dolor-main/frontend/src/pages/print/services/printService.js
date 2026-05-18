import { getClinicSettings } from '../../../services/clinicSettingsService.js';
import { getConsultation as getConsultationRecord, getPatientConsultations as getConsultationsForPatient } from '../../consultas/services/consultasService.js';
import { getBudget as getBudgetRecord } from '../../finanzas/services/budgetsService.js';
import { getPatientHistoria as getHistoriaForPatient } from '../../historia-clinica-form/services/clinicalHistoryFormService.js';
import { getInvoice as getInvoiceRecord, listInvoices, listPayments } from '../../finanzas/services/invoicesService.js';
import { getPatient as getPatientRecord } from '../../pacientes/services/pacientesService.js';
import {
  getMedicationsByIds as getMedicationsByIdsRecord,
  getPatientMedications as getPatientMedicationsRecord,
  getPatientProcedures as getPatientProceduresRecord,
} from '../../patient-detail/services/patientDetailService.js';

export function getSettings() {
  return getClinicSettings();
}

export function getPatient(id) {
  return getPatientRecord(id);
}

export function getConsultation(id) {
  return getConsultationRecord(id);
}

export function getInvoice(id) {
  return getInvoiceRecord(id);
}

export function getBudget(id) {
  return getBudgetRecord(id);
}

export function getHistoria(patientId) {
  return getHistoriaForPatient(patientId);
}

export function getMedicationsByIds(ids) {
  return getMedicationsByIdsRecord(ids);
}

export function getPatientConsultations(patientId) {
  return getConsultationsForPatient(patientId);
}

export function getPatientProcedures(patientId) {
  return getPatientProceduresRecord(patientId);
}

export function getPatientMedications(patientId) {
  return getPatientMedicationsRecord(patientId);
}

export function getPaymentById(id) {
  return listPayments().then(rows => rows.find(p => String(p.id) === String(id)) || null);
}

export function getInvoicesIndex() {
  return listInvoices();
}
