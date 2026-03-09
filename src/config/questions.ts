export type QuestionType =
    | 'welcome'
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'yes_no'
    | 'number_with_unit'
    | 'outro';

export type Category = 'Evaluación Inicial' | 'Datos Personales' | 'Historial Médico' | 'Captación' | 'Consentimiento';

export interface QuestionConfig {
    id: string;
    type: QuestionType;
    title: string;
    subtitle?: string;
    category?: Category;
    options?: string[]; // For selects
    unitOptions?: string[]; // For number_with_unit
    requiresSpecification?: boolean; // If yes_no and true, triggers specify screen on 'Si'
    triggerSpecificationOn?: string; // If select and matches this string, triggers specify screen
    placeholder?: string;
}

export const questions: QuestionConfig[] = [
    {
        id: 'welcome',
        type: 'welcome',
        title: 'META Integra',
        subtitle: 'INSTITUTO BARIÁTRICO',
    },
    {
        id: 'fecha_evaluacion',
        type: 'date',
        title: 'Fecha',
        category: 'Evaluación Inicial',
    },
    {
        id: 'peso',
        type: 'number_with_unit',
        title: 'Peso',
        category: 'Evaluación Inicial',
        unitOptions: ['kg', 'lb'],
    },
    {
        id: 'estatura',
        type: 'number_with_unit',
        title: 'Estatura',
        category: 'Evaluación Inicial',
        unitOptions: ['cm', 'ft'],
    },
    {
        id: 'nombre',
        type: 'text',
        title: 'Nombre completo',
        category: 'Datos Personales',
    },
    {
        id: 'edad',
        type: 'number',
        title: 'Edad',
        category: 'Datos Personales',
    },
    {
        id: 'fecha_nacimiento',
        type: 'date',
        title: 'Fecha de nacimiento',
        category: 'Datos Personales',
    },
    {
        id: 'estado_civil',
        type: 'select',
        title: 'Estado civil',
        category: 'Datos Personales',
        options: ['Soltero', 'Casado', 'Unión libre', 'Divorciado', 'Viudo'],
    },
    {
        id: 'nacionalidad',
        type: 'text',
        title: 'Nacionalidad',
        category: 'Datos Personales',
    },
    {
        id: 'cedula_pasaporte',
        type: 'text',
        title: 'Cédula / Pasaporte',
        category: 'Datos Personales',
    },
    {
        id: 'direccion',
        type: 'text',
        title: 'Dirección',
        category: 'Datos Personales',
    },
    {
        id: 'telefono',
        type: 'text',
        title: 'Teléfono',
        category: 'Datos Personales',
    },
    {
        id: 'celular',
        type: 'text',
        title: 'Celular',
        category: 'Datos Personales',
    },
    {
        id: 'email',
        type: 'text',
        title: 'E-mail',
        category: 'Datos Personales',
    },
    {
        id: 'ocupacion',
        type: 'text',
        title: 'Ocupación',
        category: 'Datos Personales',
    },
    {
        id: 'enfermedades',
        type: 'yes_no',
        title: '¿Padece de alguna enfermedad?',
        category: 'Historial Médico',
        requiresSpecification: true,
    },
    {
        id: 'medicamentos',
        type: 'yes_no',
        title: '¿Toma algún medicamento regularmente?',
        category: 'Historial Médico',
        requiresSpecification: true,
    },
    {
        id: 'cirugias',
        type: 'yes_no',
        title: 'Cirugías anteriores:',
        category: 'Historial Médico',
        requiresSpecification: true,
    },
    {
        id: 'alergias',
        type: 'yes_no',
        title: '¿Es usted alérgico/a a algún medicamento?',
        category: 'Historial Médico',
        requiresSpecification: true,
    },
    {
        id: 'fumador',
        type: 'yes_no',
        title: '¿Es fumador?',
        category: 'Historial Médico',
        requiresSpecification: false,
    },
    {
        id: 'alcohol',
        type: 'yes_no',
        title: '¿Consume alcohol?',
        category: 'Historial Médico',
        requiresSpecification: false,
    },
    {
        id: 'antecedentes_familiares',
        type: 'yes_no',
        title: '¿Algún antecedente familiar (padre, madre, herman@s)?',
        category: 'Historial Médico',
        requiresSpecification: true,
    },
    {
        id: 'hemorragias_trombosis',
        type: 'yes_no',
        title: '¿Ha tenido hemorragias o Trombosis?',
        category: 'Historial Médico',
        requiresSpecification: true,
    },
    {
        id: 'captacion',
        type: 'select',
        title: '¿Cómo nos conociste?',
        category: 'Captación',
        options: ['Página web', 'Familia o amigos', 'Publicidad en los medios', 'Redes sociales', 'Otro'],
        triggerSpecificationOn: 'Otro',
    },
    {
        id: 'autorizacion_imagenes',
        type: 'yes_no',
        title: 'Autorización para uso de imágenes:',
        category: 'Consentimiento',
        requiresSpecification: false,
    },
    {
        id: 'motivacion_bariatrica',
        type: 'text',
        title: '¿Qué te motiva a hacerte la cirugía bariátrica?',
        category: 'Consentimiento',
    },
    {
        id: 'outro',
        type: 'outro',
        title: 'Gracias por completar el formulario.',
        subtitle: 'META Integra',
    }
];
