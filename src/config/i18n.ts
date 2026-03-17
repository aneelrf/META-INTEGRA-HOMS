export const i18n = {
    es: {
        next: 'Continuar',
        back: 'Atrás',
        finish: 'Finalizar',
        specify: 'Especifique',
        loading: 'Sincronizando con la nube...',
        weight: 'Peso',
        height: 'Estatura',
        select_option: 'Selecciona una opción',
        thank_you: 'Gracias por completar el formulario.',
        restart_in: 'Reiniciando en {{seconds}} segundos...',
        copy_summary: 'Copiar Resumen',
        copied: '¡Copiado!',
        categories: {
            initial: 'Evaluación Inicial',
            personal: 'Datos Personales',
            medical: 'Historial Médico',
            captation: 'Captación',
            consent: 'Consentimiento'
        }
    },
    en: {
        next: 'Next',
        back: 'Back',
        finish: 'Finish',
        specify: 'Please specify',
        loading: 'Syncing with cloud...',
        weight: 'Weight',
        height: 'Height',
        select_option: 'Select an option',
        thank_you: 'Thank you for completing the form.',
        restart_in: 'Restarting in {{seconds}} seconds...',
        copy_summary: 'Copy Summary',
        copied: 'Copied!',
        categories: {
            initial: 'Initial Evaluation',
            personal: 'Personal Data',
            medical: 'Medical History',
            captation: 'Referral',
            consent: 'Consent'
        }
    },
    fr: {
        next: 'Suivant',
        back: 'Retour',
        finish: 'Terminer',
        specify: 'Veuillez préciser',
        loading: 'Synchronisation...',
        weight: 'Poids',
        height: 'Taille',
        select_option: 'Sélectionnez une option',
        thank_you: 'Merci d\'avoir rempli le formulaire.',
        restart_in: 'Redémarrage dans {{seconds}} secondes...',
        copy_summary: 'Copier le résumé',
        copied: 'Copié !',
        categories: {
            initial: 'Évaluation Initiale',
            personal: 'Données Personnelles',
            medical: 'Historique Médical',
            captation: 'Référencement',
            consent: 'Consentement'
        }
    },
    de: {
        next: 'Weiter',
        back: 'Zurück',
        finish: 'Abschließen',
        specify: 'Bitte angeben',
        loading: 'Synchronisierung...',
        weight: 'Gewicht',
        height: 'Größe',
        select_option: 'Option wählen',
        thank_you: 'Vielen Dank für das Ausfüllen des Formulars.',
        restart_in: 'Neustart in {{seconds}} Sekunden...',
        copy_summary: 'Zusammenfassung kopieren',
        copied: 'Kopiert!',
        categories: {
            initial: 'Erstbewertung',
            personal: 'Persönliche Daten',
            medical: 'Medizinische Vorgeschichte',
            captation: 'Empfehlung',
            consent: 'Zustimmung'
        }
    }
};

export type Language = keyof typeof i18n;
