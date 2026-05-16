import { AlertTriangle, CalendarX, Pill, TrendingUp } from 'lucide-react';
import AlertCard from './AlertCard.jsx';

export default function AlertsPanel({ alerts }) {
  if (alerts.total === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-rose-600" />
        <h2 className="text-lg font-semibold text-slate-900">Requiere atención</h2>
        <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-semibold">{alerts.total}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alerts.opioides_sin_revision.length > 0 && (
          <AlertCard
            icon={Pill}
            tone="amber"
            title="Opioides sin control"
            subtitle=">90 días sin consulta"
            items={alerts.opioides_sin_revision.map(p => ({
              id: `op-${p.id}`,
              primary: `${p.apellido}, ${p.nombre}`,
              secondary: `${p.opioides} · ${p.dias_sin_revision}d sin revisar`,
              link: `/pacientes/${p.id}`,
            }))}
          />
        )}

        {alerts.seguimientos_vencidos.length > 0 && (
          <AlertCard
            icon={CalendarX}
            tone="rose"
            title="Seguimientos vencidos"
            subtitle="follow-ups pasados sin marcar"
            items={alerts.seguimientos_vencidos.map(s => ({
              id: `sv-${s.id}`,
              primary: s.paciente_nombre,
              secondary: `${s.dias_atraso}d de atraso · ${s.fecha}`,
              link: `/pacientes/${s.patient_id}`,
            }))}
          />
        )}

        {alerts.eva_alto_sin_retorno.length > 0 && (
          <AlertCard
            icon={TrendingUp}
            tone="rose"
            title="Dolor alto sin retorno"
            subtitle="EVA ≥7, no han vuelto"
            items={alerts.eva_alto_sin_retorno.map(p => ({
              id: `ea-${p.id}`,
              primary: `${p.apellido}, ${p.nombre}`,
              secondary: `EVA ${p.eva} · ${p.dias_sin_volver}d sin volver`,
              link: `/pacientes/${p.id}`,
            }))}
          />
        )}
      </div>
    </div>
  );
}
