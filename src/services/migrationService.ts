import {
    collection, getDocs, addDoc,
    query, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
    normalizeCedula, saveClinicalMetrics, saveOrUpdateMedicalHistory,
    type PatientV2,
} from './patientServiceV2';
import { hasAlert, toEsTipo } from './patientsService';

export interface MigrationReport {
    patientsCreated: number;
    visitsCreated: number;
    metricsCreated: number;
    historiesCreated: number;
    surveysMovedCount: number;
    skipped: number;
    errors: string[];
}

// ─── migrateLegacyPatients ────────────────────────────────────────────────────

export async function migrateLegacyPatients(
    onProgress?: (msg: string) => void,
): Promise<MigrationReport> {
    const report: MigrationReport = {
        patientsCreated: 0,
        visitsCreated: 0,
        metricsCreated: 0,
        historiesCreated: 0,
        surveysMovedCount: 0,
        skipped: 0,
        errors: [],
    };

    const log = (msg: string) => {
        onProgress?.(msg);
        console.log('[migration]', msg);
    };

    // 1. Load all legacy records (non-survey docs in patients collection)
    log('Cargando pacientes legacy...');
    const legacySnap = await getDocs(collection(db, 'patients'));

    // Separate legacy form submissions from existing V2 patients
    const legacyDocs: { id: string; data: Record<string, any> }[] = [];

    legacySnap.docs.forEach(d => {
        const data = d.data() as Record<string, any>;
        // Skip docs that are already in V2 format (have cedulaNormalized field)
        if (data.cedulaNormalized !== undefined) return;
        // Skip survey docs
        if (data.answers?._isSurvey === true) return;
        // Must have answers object (old format)
        if (!data.answers) return;
        legacyDocs.push({ id: d.id, data });
    });

    log(`Encontrados ${legacyDocs.length} registros legacy para migrar.`);
    if (legacyDocs.length === 0) {
        log('Nada que migrar.');
        return report;
    }

    // 2. Group by normalized cedula
    const groups = new Map<string, typeof legacyDocs>();
    legacyDocs.forEach(item => {
        const raw = String(item.data.answers['cedula_pasaporte'] || '').trim();
        const key = raw ? normalizeCedula(raw) : `__noid__${item.id}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
    });

    log(`Grupos únicos por cédula: ${groups.size}`);

    // 3. Process each group
    for (const [cedulaKey, records] of groups.entries()) {
        try {
            // Sort oldest first so first record = first visit
            const sorted = [...records].sort(
                (a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()
            );
            const first = sorted[0];
            const latest = sorted[sorted.length - 1];
            const latestAnswers = latest.data.answers as Record<string, any>;
            const firstAnswers = first.data.answers as Record<string, any>;

            const raw = String(firstAnswers['cedula_pasaporte'] || '').trim();
            const nombre = String(latestAnswers['nombre'] || firstAnswers['nombre'] || 'Sin nombre').trim();
            const visitType = toEsTipo(latestAnswers['tipo_consulta_metabolica'] as string);
            const motivo = String(latestAnswers['motivo_visita'] || '').trim();
            const now = new Date().toISOString();

            // Check if a V2 patient already exists for this cedula
            let patientId: string | null = null;
            if (raw) {
                const existing = await getDocs(query(
                    collection(db, 'patients'),
                    where('cedulaNormalized', '==', normalizeCedula(raw)),
                ));
                if (!existing.empty) {
                    patientId = existing.docs[0].id;
                    log(`Paciente existente encontrado: ${nombre} (${raw})`);
                }
            }

            // Create V2 patient document if not exists
            if (!patientId) {
                const newPatient: Omit<PatientV2, 'id'> = {
                    cedula_pasaporte: raw,
                    cedulaNormalized: cedulaKey.startsWith('__noid__')
                        ? cedulaKey
                        : normalizeCedula(raw),
                    nombre,
                    telefono: String(latestAnswers['telefono'] || '').trim(),
                    celular: String(latestAnswers['celular'] || '').trim(),
                    email: String(latestAnswers['email'] || '').trim(),
                    fechaNacimiento: String(latestAnswers['fecha_nacimiento'] || '').trim(),
                    sexo: String(latestAnswers['sexo'] || '').trim(),
                    status: 'activo',
                    lastVisitAt: latest.data.createdAt || now,
                    lastVisitType: visitType,
                    lastMotivo: motivo,
                    hasAlertFlag: records.some(r => hasAlert(r.data.answers)),
                    totalVisits: sorted.length,
                    createdAt: first.data.createdAt || now,
                    updatedAt: now,
                    createdBy: 'migration',
                };
                const ref = await addDoc(collection(db, 'patients'), newPatient);
                patientId = ref.id;
                report.patientsCreated++;
                log(`Creado paciente V2: ${nombre} → ${patientId}`);
            }

            // Create patient_visits for each legacy record
            for (const record of sorted) {
                const ans = record.data.answers as Record<string, any>;
                const vType = toEsTipo(ans['tipo_consulta_metabolica'] as string);
                const vMotivo = String(ans['motivo_visita'] || '').trim();
                const lang = String(ans['_language'] || 'es').trim();

                const visitRef = await addDoc(collection(db, 'patient_visits'), {
                    patientId,
                    patientCedula: String(ans['cedula_pasaporte'] || '').trim(),
                    visitDate: record.data.createdAt
                        ? new Date(record.data.createdAt).toLocaleDateString('en-CA')
                        : new Date().toLocaleDateString('en-CA'),
                    visitType: vType,
                    motivoVisita: vMotivo,
                    isFirstVisit: vType === 'Primera vez',
                    source: 'migration',
                    language: lang,
                    answers: ans,
                    createdAt: record.data.createdAt || new Date().toISOString(),
                    createdBy: 'migration',
                    legacyId: record.id,
                });
                report.visitsCreated++;

                // Save clinical metrics for this visit
                const metricId = await saveClinicalMetrics(patientId, visitRef.id, ans);
                if (metricId) report.metricsCreated++;
            }

            // Save medical history from latest record
            await saveOrUpdateMedicalHistory(patientId, latestAnswers, 'migration');
            report.historiesCreated++;

        } catch (err: any) {
            report.errors.push(`Error en grupo ${cedulaKey}: ${err?.message ?? err}`);
            console.error('[migration] error:', err);
        }
    }

    // 4. Migrate survey records from patients → surveys collection
    log('Migrando encuestas...');
    const surveySnap = await getDocs(
        query(collection(db, 'patients'), where('answers._isSurvey', '==', true))
    );
    for (const surveyDoc of surveySnap.docs) {
        try {
            const data = surveyDoc.data();
            await addDoc(collection(db, 'surveys'), {
                ...data.answers,
                createdAt: data.createdAt || new Date().toISOString(),
                migratedFrom: surveyDoc.id,
            });
            report.surveysMovedCount++;
        } catch (err: any) {
            report.errors.push(`Error migrando encuesta ${surveyDoc.id}: ${err?.message ?? err}`);
        }
    }

    log(`Migración completa. Pacientes: ${report.patientsCreated}, Visitas: ${report.visitsCreated}, Métricas: ${report.metricsCreated}, Historias: ${report.historiesCreated}, Encuestas: ${report.surveysMovedCount}, Errores: ${report.errors.length}`);
    return report;
}
