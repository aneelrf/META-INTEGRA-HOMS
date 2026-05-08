import type { Language } from './i18n';

export type QuestionType =
    | 'welcome'
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'yes_no'
    | 'number_with_unit'
    | 'consent_signature'
    | 'outro';

export type Category = 'initial' | 'personal' | 'medical' | 'captation' | 'consent';

export interface QuestionConfig {
    id: string;
    type: QuestionType;
    title: Record<Language, string>;
    subtitle?: Record<Language, string>;
    category?: Category;
    options?: Record<Language, string[]>; // For selects
    unitOptions?: string[]; // For number_with_unit
    requiresSpecification?: boolean; // If yes_no and true, triggers specify screen on 'Si'
    triggerSpecificationOn?: string; // Original value matching id for logic
    placeholder?: Record<Language, string>;
}

export const questions: QuestionConfig[] = [
    {
        id: 'welcome',
        type: 'welcome',
        title: {
            es: 'META Integra',
            en: 'META Integra',
            fr: 'META Integra',
            de: 'META Integra'
        },
        subtitle: {
            es: 'INSTITUTO BARIÁTRICO Y DIGESTIVO',
            en: 'BARIATRIC AND DIGESTIVE INSTITUTE',
            fr: 'INSTITUT BARIATRIQUE ET DIGESTIF',
            de: 'BARIATRISCHES UND DIGESTIVES INSTITUT'
        },
    },
    {
        id: 'fecha_evaluacion',
        type: 'date',
        title: {
            es: 'Fecha',
            en: 'Date',
            fr: 'Date',
            de: 'Datum'
        },
        category: 'initial',
    },
    {
        id: 'peso',
        type: 'number_with_unit',
        title: {
            es: 'Peso',
            en: 'Weight',
            fr: 'Poids',
            de: 'Gewicht'
        },
        category: 'initial',
        unitOptions: ['kg', 'lb'],
    },
    {
        id: 'estatura',
        type: 'number_with_unit',
        title: {
            es: 'Estatura',
            en: 'Height',
            fr: 'Taille',
            de: 'Größe'
        },
        category: 'initial',
        unitOptions: ['cm', 'ft'],
    },
    {
        id: 'nombre',
        type: 'text',
        title: {
            es: 'Nombre completo',
            en: 'Full Name',
            fr: 'Nom complet',
            de: 'Vollständiger Name'
        },
        category: 'personal',
    },
    {
        id: 'edad',
        type: 'number',
        title: {
            es: 'Edad',
            en: 'Age',
            fr: 'Âge',
            de: 'Alter'
        },
        category: 'personal',
    },
    {
        id: 'fecha_nacimiento',
        type: 'date',
        title: {
            es: 'Fecha de nacimiento',
            en: 'Date of Birth',
            fr: 'Date de naissance',
            de: 'Geburtsdatum'
        },
        category: 'personal',
    },
    {
        id: 'estado_civil',
        type: 'select',
        title: {
            es: 'Estado civil',
            en: 'Marital Status',
            fr: 'État civil',
            de: 'Familienstand'
        },
        category: 'personal',
        options: {
            es: ['Soltero', 'Casado', 'Unión libre', 'Divorciado', 'Viudo'],
            en: ['Single', 'Married', 'Domestic Partnership', 'Divorced', 'Widowed'],
            fr: ['Célibataire', 'Marié', 'Union libre', 'Divorcé', 'Veuf'],
            de: ['Ledig', 'Verheiratet', 'Lebensgemeinschaft', 'Geschieden', 'Verwitwet']
        },
    },
    {
        id: 'nacionalidad',
        type: 'text',
        title: {
            es: 'Nacionalidad',
            en: 'Nationality',
            fr: 'Nationalité',
            de: 'Nationalität'
        },
        category: 'personal',
    },
    {
        id: 'cedula_pasaporte',
        type: 'text',
        title: {
            es: 'Cédula / Pasaporte',
            en: 'ID / Passport',
            fr: 'ID / Passeport',
            de: 'Ausweis / Reisepass'
        },
        category: 'personal',
    },
    {
        id: 'direccion',
        type: 'text',
        title: {
            es: 'Dirección',
            en: 'Address',
            fr: 'Adresse',
            de: 'Adresse'
        },
        category: 'personal',
    },
    {
        id: 'telefono',
        type: 'text',
        title: {
            es: 'Teléfono',
            en: 'Phone',
            fr: 'Téléphone',
            de: 'Telefon'
        },
        category: 'personal',
    },
    {
        id: 'celular',
        type: 'text',
        title: {
            es: 'Celular',
            en: 'Cell Phone',
            fr: 'Portable',
            de: 'Mobiltelefon'
        },
        category: 'personal',
    },
    {
        id: 'email',
        type: 'text',
        title: {
            es: 'E-mail',
            en: 'E-mail',
            fr: 'E-mail',
            de: 'E-Mail'
        },
        category: 'personal',
    },
    {
        id: 'ocupacion',
        type: 'text',
        title: {
            es: 'Ocupación',
            en: 'Occupation',
            fr: 'Occupation',
            de: 'Beruf'
        },
        category: 'personal',
    },
    {
        id: 'enfermedades',
        type: 'yes_no',
        title: {
            es: '¿Padece de alguna enfermedad?',
            en: 'Do you suffer from any disease?',
            fr: 'Souffrez-vous d\'une maladie ?',
            de: 'Leiden Sie an einer Krankheit?'
        },
        category: 'medical',
        requiresSpecification: true,
    },
    {
        id: 'medicamentos',
        type: 'yes_no',
        title: {
            es: '¿Toma algún medicamento regularmente?',
            en: 'Do you take any medication regularly?',
            fr: 'Prenez-vous des médicaments régulièrement ?',
            de: 'Nehmen Sie regelmäßig Medikamente ein?'
        },
        category: 'medical',
        requiresSpecification: true,
    },
    {
        id: 'cirugias',
        type: 'yes_no',
        title: {
            es: '¿Cirugías anteriores?',
            en: 'Previous surgeries?',
            fr: 'Chirurgies antérieures ?',
            de: 'Frühere Operationen?'
        },
        category: 'medical',
        requiresSpecification: true,
    },
    {
        id: 'alergias',
        type: 'yes_no',
        title: {
            es: '¿Es usted alérgico/a a algún medicamento?',
            en: 'Are you allergic to any medication?',
            fr: 'Êtes-vous allergique à un médicament ?',
            de: 'Sind Sie allergisch gegen Medikamente?'
        },
        category: 'medical',
        requiresSpecification: true,
    },
    {
        id: 'fumador',
        type: 'yes_no',
        title: {
            es: '¿Es fumador?',
            en: 'Are you a smoker?',
            fr: 'Êtes-vous fumeur ?',
            de: 'Sind Sie Raucher?'
        },
        category: 'medical',
        requiresSpecification: false,
    },
    {
        id: 'fumador_tipo',
        type: 'select',
        title: {
            es: 'Tipo de consumo',
            en: 'Type of consumption',
            fr: 'Type de consommation',
            de: 'Art des Konsums'
        },
        category: 'medical',
        options: {
            es: ['Hookah', 'Vape', 'Cigarro', 'Cigarrillo', 'Otros'],
            en: ['Hookah', 'Vape', 'Cigar', 'Cigarette', 'Others'],
            fr: ['Hookah', 'Vape', 'Cigare', 'Cigarette', 'Autres'],
            de: ['Hookah', 'Vape', 'Zigarre', 'Zigarette', 'Andere']
        },
        triggerSpecificationOn: 'Otros',
    },
    {
        id: 'fumador_frecuencia',
        type: 'text',
        title: {
            es: 'Frecuencia',
            en: 'Frequency',
            fr: 'Fréquence',
            de: 'Häufigkeit'
        },
        category: 'medical',
        placeholder: {
            es: 'Ej: Diario, 3 veces por semana...',
            en: 'E.g.: Daily, 3 times a week...',
            fr: 'Ex : Quotidien, 3 fois par semaine...',
            de: 'Z.B.: Täglich, 3x pro Woche...'
        }
    },
    {
        id: 'alcohol',
        type: 'yes_no',
        title: {
            es: '¿Consume alcohol?',
            en: 'Do you consume alcohol?',
            fr: 'Consommez-vous de l\'alcool ?',
            de: 'Trinken Sie Alkohol?'
        },
        category: 'medical',
        requiresSpecification: false,
    },
    {
        id: 'alcohol_frecuencia',
        type: 'text',
        title: {
            es: 'Frecuencia de consumo',
            en: 'Consumption frequency',
            fr: 'Fréquence de consommation',
            de: 'Konsumhäufigkeit'
        },
        category: 'medical',
        placeholder: {
            es: 'Ej: Diario, fines de semana...',
            en: 'E.g.: Daily, on weekends...',
            fr: 'Ex : Quotidien, le week-end...',
            de: 'Z.B.: Täglich, am Wochenende...'
        }
    },
    {
        id: 'antecedentes_familiares',
        type: 'yes_no',
        title: {
            es: '¿Antecedentes Patológicos? (Ej: Diabetes, HTA, Cáncer)',
            en: 'Pathological Background? (E.g.: Diabetes, HTN, Cancer)',
            fr: 'Antécédents pathologiques ? (Ex : Diabète, HTA, Cancer)',
            de: 'Pathologische Vorgeschichte? (z.B.: Diabetes, Bluthochdruck, Krebs)'
        },
        category: 'medical',
        requiresSpecification: true,
    },
    {
        id: 'hemorragias_trombosis',
        type: 'yes_no',
        title: {
            es: '¿Ha tenido hemorragias o Trombosis?',
            en: 'Have you had hemorrhages or thrombosis?',
            fr: 'Avez-vous eu des hémorragies ou des thromboses ?',
            de: 'Hatten Sie Blutungen oder Thrombosen?'
        },
        category: 'medical',
        requiresSpecification: true,
    },
    {
        id: 'captacion',
        type: 'select',
        title: {
            es: '¿Cómo nos conociste?',
            en: 'How did you hear about us?',
            fr: 'Comment nous avez-vous connus ?',
            de: 'Wie haben Sie von uns erfahren?'
        },
        category: 'captation',
        options: {
            es: ['Página web', 'Familia o amigos', 'Publicidad en los medios', 'Redes sociales', 'Otro'],
            en: ['Website', 'Family or friends', 'Media advertising', 'Social networks', 'Other'],
            fr: ['Site web', 'Famille ou amis', 'Publicité dans les médias', 'Réseaux sociaux', 'Autre'],
            de: ['Webseite', 'Familie oder Freunde', 'Medienwerbung', 'Soziale Netzwerke', 'Andere']
        },
        triggerSpecificationOn: 'Otro', // Logic stays internal (match ES 'Otro' or specific key)
    },
    {
        id: 'autorizacion_imagenes',
        type: 'yes_no',
        title: {
            es: 'Autorización para uso de imágenes:',
            en: 'Authorization for image use:',
            fr: 'Autorisation d\'utilisation d\'images :',
            de: 'Ermächtigung zur Bildnutzung:'
        },
        category: 'consent',
        requiresSpecification: false,
    },
    {
        id: 'autorizacion_firma',
        type: 'consent_signature',
        title: {
            es: 'Autorización para Uso de Imagen',
            en: 'Image Use Authorization',
            fr: 'Autorisation d\'utilisation d\'image',
            de: 'Einwilligung zur Bildnutzung'
        },
        category: 'consent',
    },
    {
        id: 'motivacion_bariatrica',
        type: 'text',
        title: {
            es: '¿Qué te motiva a hacerte la cirugía bariátrica?',
            en: 'What motivates you to have bariatric surgery?',
            fr: 'Qu\'est-ce qui vous motive à subir une chirurgie bariatrique ?',
            de: 'Was motiviert Sie zu einer bariatrischen Operation?'
        },
        category: 'consent',
    },
    {
        id: 'outro',
        type: 'outro',
        title: {
            es: 'Gracias por completar el formulario.',
            en: 'Thank you for completing the form.',
            fr: 'Merci d\'avoir rempli le formulaire.',
            de: 'Vielen Dank für das Ausfüllen des Formulars.'
        },
        subtitle: {
            es: 'META Integra',
            en: 'META Integra',
            fr: 'META Integra',
            de: 'META Integra'
        },
    }
];
