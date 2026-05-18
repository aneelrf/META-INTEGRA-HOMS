import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import PatientHeader from './patient-detail/PatientHeader.jsx';
import PatientTabs from './patient-detail/PatientTabs.jsx';
import { deletePatient, getPatient } from './patient-detail/services/patientDetailService.js';
import TimelineTab from './patient-detail/tabs/TimelineTab.jsx';
import ClinicalHistoryTab from './patient-detail/tabs/ClinicalHistoryTab.jsx';
import InfoTab from './patient-detail/tabs/InfoTab.jsx';
import ConsultationsTab from './patient-detail/tabs/ConsultationsTab.jsx';
import ProceduresTab from './patient-detail/tabs/ProceduresTab.jsx';
import MedicationsTab from './patient-detail/tabs/MedicationsTab.jsx';
import AccountTab from './patient-detail/tabs/AccountTab.jsx';
import AppointmentsTab from './patient-detail/tabs/AppointmentsTab.jsx';

export default function PacienteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [tab, setTab] = useState('historia');

  useEffect(() => {
    getPatient(id).then(setPatient);
  }, [id]);

  async function eliminar() {
    if (!confirm('¿Eliminar este paciente y toda su información?')) return;
    await deletePatient(id);
    navigate('/pacientes');
  }

  if (!patient) return <div className="p-8 text-slate-500">Cargando...</div>;

  const canWrite = user.role !== 'secretaria';

  return (
    <div className="p-8 max-w-6xl">
      <PatientHeader patient={patient} patientId={id} user={user} onDelete={eliminar} />
      <PatientTabs activeTab={tab} onChange={setTab} />

      <div className="animate-fade-in">
        {tab === 'historia' && <TimelineTab patientId={id} />}
        {tab === 'historia_clinica' && <ClinicalHistoryTab patientId={id} canWrite={canWrite} />}
        {tab === 'info' && <InfoTab patient={patient} patientId={id} />}
        {tab === 'consultas' && <ConsultationsTab patientId={id} canWrite={canWrite} />}
        {tab === 'procedimientos' && <ProceduresTab patientId={id} canWrite={canWrite} />}
        {tab === 'prescripcion' && <MedicationsTab patientId={id} canWrite={canWrite} />}
        {tab === 'cuenta' && <AccountTab patientId={id} />}
        {tab === 'agenda' && <AppointmentsTab patient={patient} />}
      </div>
    </div>
  );
}
