export const TIPO_CONSULTA_ES: Record<string, string> = {
    'Primera vez': 'Primera vez',
    'First visit': 'Primera vez',
    'Première consultation': 'Primera vez',
    'Erstbesuch': 'Primera vez',
    'Seguimiento 1er mes quirúrgico': 'Seguimiento 1er mes quirúrgico',
    '1st surgical month follow-up': 'Seguimiento 1er mes quirúrgico',
    'Suivi 1er mois chirurgical': 'Seguimiento 1er mes quirúrgico',
    'Nachsorge 1. Monat nach OP': 'Seguimiento 1er mes quirúrgico',
    'Seguimiento 2do mes quirúrgico': 'Seguimiento 2do mes quirúrgico',
    '2nd surgical month follow-up': 'Seguimiento 2do mes quirúrgico',
    'Suivi 2ème mois chirurgical': 'Seguimiento 2do mes quirúrgico',
    'Nachsorge 2. Monat nach OP': 'Seguimiento 2do mes quirúrgico',
    'Seguimiento 4to mes quirúrgico': 'Seguimiento 4to mes quirúrgico',
    '4th surgical month follow-up': 'Seguimiento 4to mes quirúrgico',
    'Suivi 4ème mois chirurgical': 'Seguimiento 4to mes quirúrgico',
    'Nachsorge 4. Monat nach OP': 'Seguimiento 4to mes quirúrgico',
    'Seguimiento 1 año quirúrgico': 'Seguimiento 1 año quirúrgico',
    '1-year surgical follow-up': 'Seguimiento 1 año quirúrgico',
    'Suivi 1 an chirurgical': 'Seguimiento 1 año quirúrgico',
    'Nachsorge 1 Jahr nach OP': 'Seguimiento 1 año quirúrgico',
};

export const TIPO_SHORT: Record<string, string> = {
    'Primera vez': '1ª vez',
    'Seguimiento 1er mes quirúrgico': 'Seg. 1er mes',
    'Seguimiento 2do mes quirúrgico': 'Seg. 2do mes',
    'Seguimiento 4to mes quirúrgico': 'Seg. 4to mes',
    'Seguimiento 1 año quirúrgico': 'Seg. 1 año',
};

export const TIPO_ORDER: Record<string, number> = {
    'Primera vez': 0,
    'Seguimiento 1er mes quirúrgico': 1,
    'Seguimiento 2do mes quirúrgico': 2,
    'Seguimiento 4to mes quirúrgico': 3,
    'Seguimiento 1 año quirúrgico': 4,
};

export const MOTIVO_METABOLICO = new Set([
    'Cirugía Metabólica', 'Metabolic Surgery', 'Chirurgie Métabolique', 'Metabolische Chirurgie',
]);

export const MEDICAL_FIELDS = [
    { id: 'enfermedades',         label: 'Enfermedades',          specId: 'enfermedades_spec' },
    { id: 'medicamentos',         label: 'Medicamentos',          specId: 'medicamentos_spec' },
    { id: 'cirugias',             label: 'Cirugías previas',      specId: 'cirugias_spec' },
    { id: 'alergias',             label: 'Alergias',              specId: 'alergias_spec' },
    { id: 'fumador',              label: 'Fumador',               specId: undefined },
    { id: 'alcohol',              label: 'Alcohol',               specId: undefined },
    { id: 'antecedentes_familiares', label: 'Ant. patológicos',   specId: 'antecedentes_familiares_spec' },
    { id: 'hemorragias_trombosis',   label: 'Hemorragias/Trombosis', specId: 'hemorragias_trombosis_spec' },
];

const YES_VALUES = new Set(['sí', 'si', 'yes', 'oui', 'ja']);

export function isYesStr(val: any): boolean {
    return typeof val === 'string' && YES_VALUES.has(val.toLowerCase());
}

export function hasAlert(answers: Record<string, any>): boolean {
    return Object.keys(answers).some(k => k !== 'autorizacion_imagenes' && isYesStr(answers[k]));
}

export function toEsTipo(ans: string | undefined): string | null {
    return ans ? (TIPO_CONSULTA_ES[ans] ?? null) : null;
}

export function isFollowUp(answers: Record<string, any>): boolean {
    const tipo = toEsTipo(answers['tipo_consulta_metabolica']);
    return tipo !== null && tipo !== 'Primera vez';
}

export function calcPesoKg(peso: any): number | null {
    if (!peso || typeof peso !== 'object' || !peso.value) return null;
    const kg = Number(peso.value);
    if (isNaN(kg)) return null;
    return peso.unit === 'lb' ? kg / 2.20462 : kg;
}

export function calcIMC(peso: any, estatura: any): number | null {
    const kg = calcPesoKg(peso);
    if (!kg || !estatura || typeof estatura !== 'object' || !estatura.value) return null;
    let cm = Number(estatura.value);
    if (isNaN(cm)) return null;
    if (estatura.unit === 'ft') cm = cm * 30.48;
    else if (estatura.unit === 'm') cm = cm * 100;
    const m = cm / 100;
    if (m <= 0) return null;
    return kg / (m * m);
}

