import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, CalendarCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import StatCard from './dashboard/components/StatCard.jsx';
import Section from './dashboard/components/Section.jsx';
import StatusDot from './dashboard/components/StatusDot.jsx';
import AlertsPanel from './dashboard/components/AlertsPanel.jsx';
import { buildGreeting } from './dashboard/utils/greeting.js';
import {
  getAlerts,
  getFollowups,
  getPatientCount,
  getTodayAppointments,
} from './dashboard/services/dashboardService.js';

const EMPTY_ALERTS = {
  opioides_sin_revision: [],
  seguimientos_vencidos: [],
  eva_alto_sin_retorno: [],
  total: 0,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [followups, setFollowups] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  const [patientCount, setPatientCount] = useState(null);
  const [alerts, setAlerts] = useState(EMPTY_ALERTS);

  useEffect(() => {
    getFollowups().then(setFollowups).catch(() => {});
    getTodayAppointments().then(setTodayAppts).catch(() => {});
    getPatientCount().then(setPatientCount).catch(() => {});
    getAlerts().then(setAlerts).catch(() => {});
  }, []);

  const { firstName, greeting, dateStr } = buildGreeting(user.fullName);
  const pending = todayAppts.filter(a => a.estado === 'pendiente').length;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">{greeting}, {firstName}</h1>
        <p className="text-slate-500 mt-1 capitalize">{dateStr}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Calendar}
          label="Citas hoy"
          value={todayAppts.length}
          hint={pending > 0 ? `${pending} pendiente${pending > 1 ? 's' : ''}` : 'ninguna pendiente'}
          tone="brand"
          link="/agenda"
        />
        <StatCard
          icon={CalendarCheck}
          label="Seguimientos (7 días)"
          value={followups.length}
          hint={followups.length === 0 ? 'al día' : 'por atender'}
          tone="amber"
          link="/agenda"
        />
        <StatCard
          icon={Users}
          label="Pacientes"
          value={patientCount ?? '—'}
          hint="en el sistema"
          tone="slate"
          link="/pacientes"
        />
        <StatCard
          icon={AlertTriangle}
          label="Alertas"
          value={alerts.total}
          hint={alerts.total === 0 ? 'nada urgente' : 'requieren atención'}
          tone={alerts.total === 0 ? 'emerald' : 'rose'}
        />
      </div>

      <AlertsPanel alerts={alerts} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section
          icon={Clock}
          title="Hoy en agenda"
          link="/agenda"
          linkLabel="Ver agenda"
          empty={todayAppts.length === 0}
          emptyText="Sin citas programadas para hoy."
        >
          <ul className="divide-y divide-slate-100">
            {todayAppts.map(a => (
              <li key={a.id} className="py-3 flex justify-between items-center text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-500 font-mono text-xs w-12 shrink-0">{a.hora ?? '--:--'}</span>
                  <span className="truncate">{a.paciente_nombre}</span>
                </div>
                <StatusDot estado={a.estado} />
              </li>
            ))}
          </ul>
        </Section>

        <Section
          icon={CalendarCheck}
          title="Seguimientos próximos 7 días"
          link="/agenda"
          linkLabel="Ver todos"
          empty={followups.length === 0}
          emptyText="Sin seguimientos pendientes."
        >
          <ul className="divide-y divide-slate-100">
            {followups.map(f => (
              <li key={f.id} className="py-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{f.paciente_nombre}</span>
                  <span className="text-slate-500 text-xs shrink-0 ml-2">{f.fecha}</span>
                </div>
                {f.motivo && <div className="text-xs text-slate-500 mt-0.5 truncate">{f.motivo}</div>}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
