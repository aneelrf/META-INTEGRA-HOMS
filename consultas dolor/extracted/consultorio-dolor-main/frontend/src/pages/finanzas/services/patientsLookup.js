import { listPatients } from '../../pacientes/services/pacientesService.js';

export function listPatientsForSelect() {
  return listPatients();
}
