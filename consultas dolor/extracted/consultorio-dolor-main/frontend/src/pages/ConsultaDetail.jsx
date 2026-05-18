import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, Pencil, Printer, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import BodyMap from '../components/BodyMap.jsx';
import { getPatient } from './pacientes/services/pacientesService.js';
import { Card } from './consultas/components/ConsultasShared.jsx';
import EvaDisplay from './consultas/components/EvaDisplay.jsx';
import EvolucionDetailSection from './consultas/components/EvolucionDetailSection.jsx';
import { deleteConsultation, getConsultation } from './consultas/services/consultasService.js';

export default function ConsultaDetail() {
  const { patientId, consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consulta, setConsulta] = useState(null);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    Promise.all([
      getConsultation(consultationId),
      getPatient(patientId),
    ]).then(([c, p]) => {
      setConsulta(c);
      setPatient(p);
    });
  }, [patientId, consultationId]);

  async function eliminar() {
    if (!confirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.')) return;
    await deleteConsultation(consultationId);
    navigate(`/pacientes/${patientId}`);
  }

  if (!consulta || !patient) return <div className="p-8 text-slate-500">Cargando...</div>;

  const canWrite = user.role !== 'secretaria';
  const hasEva = consulta.eva !== null && consulta.eva !== undefined;

  let bodyMapData = null;
  try { bodyMapData = consulta.body_map_data ? JSON.parse(consulta.body_map_data) : null; } catch {}

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link to={`/pacientes/${patientId}`} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
          <ArrowLeft size={14} /> Volver al paciente
        </Link>
        <div className="flex justify-between items-start gap-4 flex-wrap mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Consulta — <span className="text-slate-600">{patient.nombre} {patient.apellido}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">{new Date(consulta.date).toLocaleString('es-DO')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canWrite && (
              <>
                <Link to={`/pacientes/${patientId}/consulta/${consultationId}/editar`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700">
                  <Pencil size={14} /> Editar
                </Link>
                <button onClick={eliminar} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium">
                  <Trash2 size={14} /> Eliminar
                </button>
              </>
            )}
            <Link to={`/print/receta/${consultationId}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium">
              <Printer size={14} /> Indicaciones PDF
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <EvolucionDetailSection consulta={consulta} />

        {hasEva && <EvaDisplay eva={consulta.eva} />}

        {bodyMapData && (
          <Card icon={Activity} title="Mapa corporal — zonas de dolor">
            <BodyMap value={bodyMapData} readOnly />
          </Card>
        )}

        {consulta.notas && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notas adicionales</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{consulta.notas}</p>
          </div>
        )}
      </div>
    </div>
  );
}
