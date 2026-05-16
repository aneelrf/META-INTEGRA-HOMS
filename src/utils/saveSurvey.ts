import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface SurveyPayload {
    cedula: string;
    nombre: string;
    tipoConsulta: string;
    motivoVisita: string;
    motivoVisitaEncuesta: string;
    facilidadCita: number;
    amabilidadPersonal: number;
    tratoMedico: number;
    comodidadEspera: number;
    informacionOrientacion: number;
    puntualidad: number;
    publicidadInstitucional: number;
    experienciaGeneral: number;
    recomendaria: string;
    calificacionGeneral: string;
    origen: string;
    createdAt: string;
}

export async function saveSurvey(data: SurveyPayload): Promise<void> {
    await addDoc(collection(db, 'surveys'), {
        ...data,
        createdAt: data.createdAt,
    });
}
