import {
    collection, addDoc, updateDoc, setDoc,
    doc, query, where, orderBy, onSnapshot, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { hasAlert, toEsTipo } from './patientsService';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PatientV2 {
    id: string;
    cedula_pasaporte: string;
    cedulaNormalized: string;
    nombre: string;
    telefono: string;
    celular: string;
    email: string;
    fechaNacimiento: string;
    sexo: string;
    status: 'activo' | 'inactivo';
    // Denormalized fields for fast list rendering
    lastVisitAt: string;
    lastVisitType: string | null;
    lastMotivo: string;
    hasAlertFlag: boolean;
    totalVisits: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    direccion?: string;
    nacionalidad?: string;
    estadoCivil?: string;
    ocupacion?: string;
}

export interface PatientVisit {
    id: string;
    patientId: string;
    patientCedula: string;
    visitDate: string;         // YYYY-MM-DD local
    visitType: string | null;  // normalized Spanish type
    motivoVisita: string;
    isFirstVisit: boolean;
    source: 'form' | 'migration';
    language: string;
    answers: Record<string, any>;
    createdAt: string;
    createdBy: string;
    clinicalNote?: string;
    clinicalNoteUpdatedAt?: string;
    clinicalNoteUpdatedBy?: string;
}

export interface ClinicalMetric {
    id: string;
    patientId: string;
    visitId: string;
    recordedAt: string;  // ISO string
    peso: number | null;        // kg
    imc: number | null;
    systolicBP: number | null;
    diastolicBP: number | null;
    glucosa: number | null;
    hemoglobina: number | null;
    createdAt: string;
}

export interface MedicalHistory {
    id: string;
    patientId: string;
    enfermedades: string;
    enfermedadesSpec: string;
    medicamentos: string;
    medicamentosSpec: string;
    cirugias: string;
    cirugiasSpec: string;
    alergias: string;
    alergiasSpec: string;
    fumador: string;
    alcohol: string;
    antecedentesFamiliares: string;
    antecedentesFamiliaresSpec: string;
    hemorragiasTrombosis: string;
    hemorragiasTrombosisSpec: string;
    updatedAt: string;
    updatedBy: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function normalizeCedula(raw: string): string {
    return String(raw || '').trim().toLowerCase().replace(/[\s\-\._]/g, '');
}

function localIso(): string {
    return new Date().toLocaleDateString('en-CA');
}

function nowIso(): string {
    return new Date().toISOString();
}

export function calculateIMC(pesoKg: number, heightCm: number): number | null {
    if (!pesoKg || !heightCm || heightCm <= 0) return null;
    const m = heightCm / 100;
    return pesoKg / (m * m);
}

function extractPesoKg(answers: Record<string, any>): number | null {
    const peso = answers['peso'];
    if (!peso || typeof peso !== 'object' || !peso.value) return null;
    const kg = Number(peso.value);
    if (isNaN(kg)) return null;
    return peso.unit === 'lb' ? kg / 2.20462 : kg;
}

function extractHeightCm(answers: Record<string, any>): number | null {
    const est = answers['estatura'];
    if (!est || typeof est !== 'object' || !est.value) return null;
    let cm = Number(est.value);
    if (isNaN(cm)) return null;
    if (est.unit === 'ft') cm = cm * 30.48;
    else if (est.unit === 'm') cm = cm * 100;
    return cm;
}

function extractNum(answers: Record<string, any>, key: string): number | null {
    const v = Number(answers[key]);
    return !isNaN(v) && v > 0 ? v : null;
}

// ─── findOrCreatePatient ──────────────────────────────────────────────────────

function resolveVisitType(answers: Record<string, any>): string | null {
    return toEsTipo(answers['tipo_consulta_metabolica'] as string)
        ?? (String(answers['tipo_cirugia_general'] || '').trim() || null);
}

export async function findOrCreatePatient(
    answers: Record<string, any>,
    createdBy = 'patient_form',
): Promise<{ patientId: string; isNew: boolean }> {
    const raw = String(answers['cedula_pasaporte'] || '').trim();
    const cedulaNormalized = normalizeCedula(raw);

    if (cedulaNormalized) {
        const q = query(
            collection(db, 'patients'),
            where('cedulaNormalized', '==', cedulaNormalized),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            return { patientId: snap.docs[0].id, isNew: false };
        }
    }

    const nombre = String(answers['nombre'] || '').trim() || 'Sin nombre';
    const visitType = resolveVisitType(answers);
    const motivo = String(answers['motivo_visita'] || '').trim();
    const now = nowIso();

    const newPatient: Omit<PatientV2, 'id'> = {
        cedula_pasaporte: raw,
        cedulaNormalized: cedulaNormalized || `__noid__${Date.now()}`,
        nombre,
        telefono: String(answers['telefono'] || '').trim(),
        celular: String(answers['celular'] || '').trim(),
        email: String(answers['email'] || '').trim(),
        fechaNacimiento: String(answers['fecha_nacimiento'] || '').trim(),
        sexo: String(answers['sexo'] || '').trim(),
        status: 'activo',
        lastVisitAt: now,
        lastVisitType: visitType,
        lastMotivo: motivo,
        hasAlertFlag: hasAlert(answers),
        totalVisits: 1,
        createdAt: now,
        updatedAt: now,
        createdBy,
    };

    const ref = await addDoc(collection(db, 'patients'), newPatient);
    return { patientId: ref.id, isNew: true };
}

// ─── createMinimalPatient ─────────────────────────────────────────────────────

export async function createMinimalPatient(
    data: { nombre: string; cedula: string; email: string; telefono?: string },
    createdBy: string,
): Promise<{ patientId: string; alreadyExists: boolean }> {
    const cedulaNormalized = normalizeCedula(data.cedula);

    if (cedulaNormalized) {
        const snap = await getDocs(
            query(collection(db, 'patients'), where('cedulaNormalized', '==', cedulaNormalized)),
        );
        if (!snap.empty) return { patientId: snap.docs[0].id, alreadyExists: true };
    }

    const now = nowIso();
    const newPatient: Omit<PatientV2, 'id'> = {
        cedula_pasaporte: data.cedula.trim(),
        cedulaNormalized: cedulaNormalized || `__noid__${Date.now()}`,
        nombre:           data.nombre.trim(),
        email:            data.email.trim(),
        telefono:         data.telefono?.trim() || '',
        celular:          '',
        fechaNacimiento:  '',
        sexo:             '',
        status:           'activo',
        lastVisitAt:      now,
        lastVisitType:    null,
        lastMotivo:       '',
        hasAlertFlag:     false,
        totalVisits:      0,
        createdAt:        now,
        updatedAt:        now,
        createdBy,
    };

    const ref = await addDoc(collection(db, 'patients'), newPatient);
    return { patientId: ref.id, alreadyExists: false };
}

// ─── createPatientVisit ───────────────────────────────────────────────────────

export async function createPatientVisit(
    patientId: string,
    answers: Record<string, any>,
    createdBy = 'patient_form',
): Promise<string> {
    const visitType = toEsTipo(answers['tipo_consulta_metabolica'] as string);
    const motivo = String(answers['motivo_visita'] || '').trim();
    const lang = String(answers['_language'] || 'es').trim();
    const now = nowIso();

    const visit: Omit<PatientVisit, 'id'> = {
        patientId,
        patientCedula: String(answers['cedula_pasaporte'] || '').trim(),
        visitDate: localIso(),
        visitType: resolveVisitType(answers),
        motivoVisita: motivo,
        isFirstVisit: visitType === 'Primera vez',
        source: 'form',
        language: lang,
        answers,
        createdAt: now,
        createdBy,
    };

    const ref = await addDoc(collection(db, 'patient_visits'), visit);
    return ref.id;
}

// ─── saveClinicalMetrics ──────────────────────────────────────────────────────

export async function saveClinicalMetrics(
    patientId: string,
    visitId: string,
    answers: Record<string, any>,
): Promise<string | null> {
    const pesoKg = extractPesoKg(answers);
    const heightCm = extractHeightCm(answers);
    const imc = pesoKg && heightCm ? calculateIMC(pesoKg, heightCm) : null;
    const systolic = extractNum(answers, 'tension_arterial_sistolica');
    const diastolic = extractNum(answers, 'tension_arterial_diastolica');
    const glucosa = extractNum(answers, 'glucosa');
    const hemoglobina = extractNum(answers, 'hemoglobina');

    const hasAny = pesoKg || imc || systolic || diastolic || glucosa || hemoglobina;
    if (!hasAny) return null;

    const now = nowIso();
    const metric: Omit<ClinicalMetric, 'id'> = {
        patientId,
        visitId,
        recordedAt: now,
        peso: pesoKg,
        imc,
        systolicBP: systolic,
        diastolicBP: diastolic,
        glucosa,
        hemoglobina,
        createdAt: now,
    };

    const ref = await addDoc(collection(db, 'clinical_metrics'), metric);
    return ref.id;
}

// ─── saveOrUpdateMedicalHistory ───────────────────────────────────────────────

export async function saveOrUpdateMedicalHistory(
    patientId: string,
    answers: Record<string, any>,
    updatedBy = 'patient_form',
): Promise<void> {
    const now = nowIso();
    const history: Omit<MedicalHistory, 'id'> = {
        patientId,
        enfermedades: String(answers['enfermedades'] || '').trim(),
        enfermedadesSpec: String(answers['enfermedades_spec'] || '').trim(),
        medicamentos: String(answers['medicamentos'] || '').trim(),
        medicamentosSpec: String(answers['medicamentos_spec'] || '').trim(),
        cirugias: String(answers['cirugias'] || '').trim(),
        cirugiasSpec: String(answers['cirugias_spec'] || '').trim(),
        alergias: String(answers['alergias'] || '').trim(),
        alergiasSpec: String(answers['alergias_spec'] || '').trim(),
        fumador: String(answers['fumador'] || '').trim(),
        alcohol: String(answers['alcohol'] || '').trim(),
        antecedentesFamiliares: String(answers['antecedentes_familiares'] || '').trim(),
        antecedentesFamiliaresSpec: String(answers['antecedentes_familiares_spec'] || '').trim(),
        hemorragiasTrombosis: String(answers['hemorragias_trombosis'] || '').trim(),
        hemorragiasTrombosisSpec: String(answers['hemorragias_trombosis_spec'] || '').trim(),
        updatedAt: now,
        updatedBy,
    };

    await setDoc(doc(db, 'medical_history', patientId), history, { merge: true });
}

// ─── updatePatientDenormalized ────────────────────────────────────────────────

export async function updatePatientDenormalized(
    patientId: string,
    answers: Record<string, any>,
): Promise<void> {
    const visitType = resolveVisitType(answers);
    const motivo = String(answers['motivo_visita'] || '').trim();
    const now = nowIso();

    // Read current totalVisits to increment
    const q = query(collection(db, 'patient_visits'), where('patientId', '==', patientId));
    const snap = await getDocs(q);
    const totalVisits = snap.size;

    await updateDoc(doc(db, 'patients', patientId), {
        lastVisitAt: now,
        lastVisitType: visitType,
        lastMotivo: motivo,
        hasAlertFlag: hasAlert(answers),
        totalVisits,
        updatedAt: now,
        // Update personal fields if newer form has them
        ...(answers['nombre']     ? { nombre:          String(answers['nombre']).trim() }          : {}),
        ...(answers['telefono']   ? { telefono:        String(answers['telefono']).trim() }        : {}),
        ...(answers['celular']    ? { celular:         String(answers['celular']).trim() }         : {}),
        ...(answers['email']      ? { email:           String(answers['email']).trim() }           : {}),
        ...(answers['sexo']       ? { sexo:            String(answers['sexo']).trim() }            : {}),
        ...(answers['fecha_nacimiento'] ? { fechaNacimiento: String(answers['fecha_nacimiento']).trim() } : {}),
    });
}

export async function updatePatientData(
    patientId: string,
    data: Partial<Omit<PatientV2, 'id' | 'cedulaNormalized' | 'createdAt' | 'createdBy'>>,
): Promise<void> {
    await updateDoc(doc(db, 'patients', patientId), {
        ...data,
        updatedAt: new Date().toISOString(),
    });
}

export async function saveClinicalNote(
    visitId: string,
    note: string,
    doctorUid: string,
): Promise<void> {
    await updateDoc(doc(db, 'patient_visits', visitId), {
        clinicalNote: note,
        clinicalNoteUpdatedAt: new Date().toISOString(),
        clinicalNoteUpdatedBy: doctorUid,
    });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function subscribePatientsV2(
    onData: (patients: PatientV2[]) => void,
): () => void {
    const q = query(
        collection(db, 'patients'),
        orderBy('lastVisitAt', 'desc'),
    );
    return onSnapshot(q, snap => {
        onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as PatientV2)));
    });
}

export function subscribePatientVisits(
    patientId: string,
    onData: (visits: PatientVisit[]) => void,
): () => void {
    const q = query(
        collection(db, 'patient_visits'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, snap => {
        onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as PatientVisit)));
    });
}

export function subscribeClinicalMetrics(
    patientId: string,
    onData: (metrics: ClinicalMetric[]) => void,
): () => void {
    const q = query(
        collection(db, 'clinical_metrics'),
        where('patientId', '==', patientId),
        orderBy('recordedAt', 'asc'),
    );
    return onSnapshot(q, snap => {
        onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClinicalMetric)));
    });
}

export function subscribeVisitsByDate(
    date: string,
    onData: (visits: PatientVisit[]) => void,
): () => void {
    const q = query(
        collection(db, 'patient_visits'),
        where('visitDate', '==', date),
    );
    return onSnapshot(q, snap => {
        onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as PatientVisit)));
    }, err => console.error('[patientServiceV2] subscribeVisitsByDate error:', err));
}

export function subscribeMedicalHistory(
    patientId: string,
    onData: (history: MedicalHistory | null) => void,
): () => void {
    return onSnapshot(doc(db, 'medical_history', patientId), snap => {
        onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as MedicalHistory) : null);
    });
}
