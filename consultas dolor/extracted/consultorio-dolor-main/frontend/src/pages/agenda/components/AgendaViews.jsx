import { useMemo } from 'react';
import { Calendar as CalIcon, Check, UserX, X } from 'lucide-react';
import { addDays, DIAS_CORTOS, endOfMonth, endOfWeek, startOfMonth, startOfWeek, toISO } from '../utils/agendaDateUtils.js';
import { estadoPill, StatusBadge, tipoLabel } from './StatusBadge.jsx';

export function DayView({ appts, onEstado }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      {appts.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <CalIcon size={20} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">Sin citas programadas para esta fecha.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {appts.map(a => (
            <li key={a.id} className="p-4 flex justify-between items-center gap-3 flex-wrap hover:bg-slate-50 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-slate-500 font-mono text-sm w-14">{a.hora || '--:--'}</span>
                  <span className="font-medium text-slate-900">{a.paciente_nombre}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tipoLabel(a.tipo)}</span>
                </div>
                {a.motivo && <div className="text-sm text-slate-500 mt-1 ml-[76px]">{a.motivo}</div>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge estado={a.estado} />
                {a.estado === 'pendiente' && (
                  <div className="flex gap-1">
                    <button onClick={() => onEstado(a.id, 'atendida')} title="Marcar atendida" className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700">
                      <Check size={14} />
                    </button>
                    <button onClick={() => onEstado(a.id, 'noshow')} title="No-show" className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                      <UserX size={14} />
                    </button>
                    <button onClick={() => onEstado(a.id, 'cancelada')} title="Cancelar" className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WeekView({ cursor, appts, onDayClick }) {
  const ini = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ini, i));
  const todayISO = toISO(new Date());

  const byDay = useMemo(() => {
    const map = {};
    for (const a of appts) (map[a.fecha] ||= []).push(a);
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
    }
    return map;
  }, [appts]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {days.map((d, i) => (
          <div key={i} className="px-3 py-2 text-center border-r last:border-r-0 border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{DIAS_CORTOS[i]}</div>
            <div className={`text-sm font-semibold mt-0.5 ${toISO(d) === todayISO ? 'text-brand-700' : 'text-slate-700'}`}>
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-[480px]">
        {days.map((d, i) => {
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const dayAppts = byDay[iso] || [];
          return (
            <button
              key={i}
              onClick={() => onDayClick(d)}
              className={`p-2 border-r last:border-r-0 border-slate-100 text-left hover:bg-slate-50 transition flex flex-col gap-1 ${isToday ? 'bg-brand-50/30' : ''}`}
            >
              {dayAppts.length === 0 ? (
                <span className="text-[11px] text-slate-300">—</span>
              ) : (
                <>
                  {dayAppts.slice(0, 8).map(a => (
                    <div key={a.id} className={`text-[11px] px-1.5 py-0.5 rounded ${estadoPill(a.estado)} truncate`}>
                      <span className="font-mono">{(a.hora || '').slice(0, 5) || '—'}</span> {a.paciente_nombre.split(' ')[0]}
                    </div>
                  ))}
                  {dayAppts.length > 8 && (
                    <div className="text-[11px] text-slate-500 px-1">+{dayAppts.length - 8} más</div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MonthView({ cursor, appts, onDayClick }) {
  const first = startOfMonth(cursor);
  const last = endOfMonth(cursor);
  const gridStart = startOfWeek(first);
  const gridEnd = endOfWeek(last);

  const days = [];
  for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) days.push(new Date(d));

  const todayISO = toISO(new Date());
  const currentMonth = cursor.getMonth();

  const byDay = useMemo(() => {
    const map = {};
    for (const a of appts) (map[a.fecha] ||= []).push(a);
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
    }
    return map;
  }, [appts]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DIAS_CORTOS.map(d => (
          <div key={d} className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center border-r last:border-r-0 border-slate-200">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const isCurrent = d.getMonth() === currentMonth;
          const dayAppts = byDay[iso] || [];
          return (
            <button
              key={i}
              onClick={() => onDayClick(d)}
              className={`min-h-[92px] p-1.5 border-r last:border-r-0 border-b border-slate-100 text-left hover:bg-slate-50 transition flex flex-col ${
                !isCurrent ? 'bg-slate-50/60 opacity-60' : ''
              } ${isToday ? 'bg-brand-50/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${isToday ? 'w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center' : isCurrent ? 'text-slate-700' : 'text-slate-400'}`}>
                  {d.getDate()}
                </span>
                {dayAppts.length > 0 && !isToday && (
                  <span className="text-[10px] text-slate-500">{dayAppts.length}</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayAppts.slice(0, 3).map(a => (
                  <div key={a.id} className={`text-[10px] px-1 py-0.5 rounded ${estadoPill(a.estado)} truncate`}>
                    {(a.hora || '').slice(0, 5) || ''} {a.paciente_nombre.split(' ')[0]}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-[10px] text-slate-500 px-1">+{dayAppts.length - 3}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

