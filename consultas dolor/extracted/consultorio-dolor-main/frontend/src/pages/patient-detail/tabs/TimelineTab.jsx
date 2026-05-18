import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, Calendar as CalIcon, Clock, FileText, Pill, Printer, TrendingDown } from 'lucide-react';
import EvaChart from '../../../components/EvaChart.jsx';
import { EvaBadge, StatusBadge } from '../shared/Badges.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import {
  getAppointmentsBetween,
  getPatientConsultations,
  getPatientMedicationTitrations,
  getPatientMedications,
  getPatientProcedures,
} from '../services/patientDetailService.js';
import { MESES_LARGOS, sortKeyFrom } from '../utils/date.js';
import { formatPreVitals } from '../utils/forms.js';

export default function HistoriaTab({ patientId }) {
  const [events, setEvents] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const desde = new Date(); desde.setFullYear(desde.getFullYear() - 5);
        const hasta = new Date(); hasta.setFullYear(hasta.getFullYear() + 1);
        const desdeISO = desde.toISOString().slice(0, 10);
        const hastaISO = hasta.toISOString().slice(0, 10);

        const [consults, procs, meds, titrs, appts] = await Promise.all([
          getPatientConsultations(patientId),
          getPatientProcedures(patientId),
          getPatientMedications(patientId),
          getPatientMedicationTitrations(patientId),
          getAppointmentsBetween(desdeISO, hastaISO),
        ]);

        setConsultations(consults);
        setProcedures(procs);

        const list = [];

        for (const c of consults) {
          list.push({ type: 'consulta', sortKey: sortKeyFrom(c.date), title: c.motivo_consulta || 'Consulta', data: c });
        }

        for (const p of procs) {
          list.push({ type: 'procedimiento', sortKey: sortKeyFrom(p.fecha), title: p.subtipo || p.tipo, tipo: p.tipo, data: p });
        }

        for (const m of meds) {
          list.push({ type: 'medicacion-inicio', sortKey: sortKeyFrom(m.fecha_inicio), title: `Prescripcion: ${m.farmaco}`, data: m });
          if (!m.activo && m.fecha_fin) {
            list.push({ type: 'medicacion-fin', sortKey: sortKeyFrom(m.fecha_fin, '23:59:00'), title: `Prescripcion suspendida: ${m.farmaco}`, data: m });
          }
        }

        // Titulaciones: ocultar el "Inicio" automático (ya contado como medicacion-inicio)
        for (const t of titrs) {
          if (t.motivo_cambio === 'Inicio') continue;
          list.push({ type: 'titulacion', sortKey: sortKeyFrom(t.fecha, '12:00:00'), title: `Titulación: ${t.farmaco}`, data: t });
        }

        for (const a of appts.filter(x => String(x.patient_id) === String(patientId))) {
          list.push({
            type: 'cita',
            sortKey: `${a.fecha}T${a.hora || '00:00'}:00`,
            title: a.motivo || (a.tipo === 'cita' ? 'Cita programada' : a.tipo === 'walkin' ? 'Sin cita' : 'Seguimiento'),
            tipo: a.tipo,
            data: a,
          });
        }

        list.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
        setEvents(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  if (loading) return <div className="text-sm text-slate-500">Cargando historia...</div>;

  const hasChartData = consultations.some(c => c.eva !== null && c.eva !== undefined) || procedures.length > 0;

  if (events.length === 0) return (
    <>
      {hasChartData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card mb-6">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-brand-600" />
            Evolución del dolor (EVA)
          </h3>
          <EvaChart consultations={consultations} procedures={procedures} />
        </div>
      )}
      <EmptyState icon={Clock} text="Aún no hay historia clínica. Empieza con una consulta." />
    </>
  );

  const groups = [];
  let current = null;
  for (const e of events) {
    const d = new Date(e.sortKey);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!current || current.key !== key) {
      current = { key, label: `${MESES_LARGOS[d.getMonth()]} ${d.getFullYear()}`, events: [] };
      groups.push(current);
    }
    current.events.push(e);
  }

  return (
    <div>
      {hasChartData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card mb-6">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-brand-600" />
            Evolución del dolor (EVA)
          </h3>
          <EvaChart consultations={consultations} procedures={procedures} />
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Historia cronológica</h2>
        <div className="text-xs text-slate-500">{events.length} eventos</div>
      </div>

      <div className="space-y-8">
        {groups.map(g => (
          <div key={g.key}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{g.label}</h3>
            <ol className="relative border-l-2 border-slate-200 ml-3 space-y-4">
              {g.events.map((e, idx) => <TimelineEvent key={`${g.key}-${idx}`} event={e} />)}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineEvent({ event }) {
  const cfg = eventConfig(event);
  const Icon = cfg.icon;
  const d = new Date(event.sortKey);
  const dateStr = d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
  const timeStr = event.type === 'cita' && event.data.hora ? event.data.hora : null;

  return (
    <li className="ml-6 relative">
      <span className={`absolute -left-[34px] top-2 flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-slate-50 ${cfg.dot}`}>
        <Icon size={13} className="text-white" strokeWidth={2.5} />
      </span>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 flex-wrap">
              <span className={cfg.badgeText}>{cfg.badge}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 normal-case">{dateStr}{timeStr && ` · ${timeStr}`}</span>
            </div>
            <div className="font-medium text-slate-900 mt-1 capitalize">{event.title}</div>
          </div>
          <TimelineExtras event={event} />
        </div>
        <TimelineBody event={event} />
      </div>
    </li>
  );
}

function eventConfig(event) {
  switch (event.type) {
    case 'consulta':
      return { icon: FileText, dot: 'bg-brand-600', badge: 'Consulta', badgeText: 'text-brand-700' };
    case 'procedimiento':
      return { icon: Activity, dot: 'bg-violet-600', badge: 'Procedimiento', badgeText: 'text-violet-700' };
    case 'medicacion-inicio':
      return {
        icon: Pill,
        dot: event.data.es_opioide ? 'bg-amber-600' : 'bg-emerald-600',
        badge: event.data.es_opioide ? 'Opioide prescrito' : 'Prescripcion iniciada',
        badgeText: event.data.es_opioide ? 'text-amber-700' : 'text-emerald-700',
      };
    case 'medicacion-fin':
      return { icon: Pill, dot: 'bg-slate-400', badge: 'Prescripcion suspendida', badgeText: 'text-slate-500' };
    case 'titulacion':
      return { icon: Pill, dot: 'bg-sky-600', badge: 'Titulación', badgeText: 'text-sky-700' };
    case 'cita': {
      const label = event.tipo === 'followup' ? 'Seguimiento' : event.tipo === 'walkin' ? 'Sin cita' : 'Cita';
      return { icon: CalIcon, dot: 'bg-slate-500', badge: label, badgeText: 'text-slate-600' };
    }
    default:
      return { icon: Clock, dot: 'bg-slate-400', badge: 'Evento', badgeText: 'text-slate-500' };
  }
}

function TimelineExtras({ event }) {
  if (event.type === 'consulta' && event.data.eva !== null && event.data.eva !== undefined) {
    return <EvaBadge value={event.data.eva} />;
  }
  if (event.type === 'cita') {
    return <StatusBadge estado={event.data.estado} />;
  }
  return null;
}

function TimelineBody({ event }) {
  const d = event.data;
  switch (event.type) {
    case 'consulta':
      return (
        <div className="mt-2 text-sm space-y-1">
          {d.diagnostico && <div className="text-slate-700"><span className="font-medium">Dx:</span> {d.diagnostico}</div>}
          {d.plan && <div className="text-slate-500 whitespace-pre-wrap line-clamp-3">{d.plan}</div>}
          <Link to={`/print/receta/${d.id}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-1">
            <Printer size={12} /> Indicaciones PDF
          </Link>
        </div>
      );
    case 'procedimiento': {
      const hasPrePost = d.eva_pre != null || d.eva_post != null;
      const delta = (d.eva_pre != null && d.eva_post != null) ? d.eva_pre - d.eva_post : null;
      return (
        <div className="mt-2 text-sm space-y-0.5 text-slate-600">
          {hasPrePost && (
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {d.eva_pre != null && <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">EVA pre {d.eva_pre}</span>}
              {d.eva_post != null && <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">EVA post {d.eva_post}</span>}
              {delta != null && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-emerald-100 text-emerald-800' : delta < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                  {delta > 0 ? `↓ ${delta}` : delta < 0 ? `↑ ${Math.abs(delta)}` : '= 0'}
                </span>
              )}
            </div>
          )}
          {d.zona && <div>Zona: {d.zona}</div>}
          {(d.farmaco || d.dosis) && <div>{d.farmaco} {d.dosis && `· ${d.dosis}`}</div>}
          {d.guiado_por && <div className="capitalize">Guía: {d.guiado_por}</div>}
          {formatPreVitals(d) && <div><span className="font-medium">Signos vitales pre:</span> {formatPreVitals(d)}</div>}
          {d.resultado && <div className="text-slate-700">Resultado: {d.resultado}</div>}
          {d.complicaciones && (
            <div className="text-red-700 flex items-center gap-1">
              <AlertCircle size={12} /> {d.complicaciones}
            </div>
          )}
        </div>
      );
    }
    case 'titulacion':
      return (
        <div className="mt-1 text-sm text-slate-600">
          <span className="font-medium">{d.dosis}</span>
          {d.frecuencia && ` · ${d.frecuencia}`}
          {d.via && ` · ${d.via}`}
          {d.motivo_cambio && <span className="text-xs text-slate-500 ml-2">({d.motivo_cambio})</span>}
        </div>
      );
    case 'medicacion-inicio':
      return d.notas ? <div className="mt-1 text-sm text-slate-500">{d.notas}</div> : null;
    default:
      return null;
  }
}
