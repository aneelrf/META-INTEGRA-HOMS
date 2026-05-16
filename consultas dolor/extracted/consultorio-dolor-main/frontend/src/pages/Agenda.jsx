import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DayView, MonthView, WeekView } from './agenda/components/AgendaViews.jsx';
import AppointmentForm from './agenda/components/AppointmentForm.jsx';
import ModeButton from './agenda/components/ModeButton.jsx';
import { addDays, addMonths, endOfMonth, endOfWeek, MESES, startOfMonth, startOfWeek, toISO } from './agenda/utils/agendaDateUtils.js';
import { createAppointment, getAppointments, getPatients, getPendingFollowups, updateAppointmentStatus } from './agenda/services/agendaService.js';

export default function Agenda() {
  const [mode, setMode] = useState('dia'); // 'dia' | 'semana' | 'mes'
  const [cursor, setCursor] = useState(new Date());
  const [appts, setAppts] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', tipo: 'cita', fecha: toISO(new Date()), hora: '', motivo: '' });

  const { desde, hasta } = useMemo(() => {
    if (mode === 'dia') return { desde: toISO(cursor), hasta: toISO(cursor) };
    if (mode === 'semana') return { desde: toISO(startOfWeek(cursor)), hasta: toISO(endOfWeek(cursor)) };
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    return { desde: toISO(startOfWeek(first)), hasta: toISO(endOfWeek(last)) };
  }, [mode, cursor]);

  async function load() {
    const appointments = await getAppointments(desde, hasta);
    setAppts(appointments);
    const pendingFollowups = await getPendingFollowups();
    setFollowups(pendingFollowups);
  }
  useEffect(() => { load(); }, [desde, hasta]);
  useEffect(() => { getPatients().then(setPatients); }, []);

  async function submit(e) {
    e.preventDefault();
    await createAppointment(form);
    setForm({ patient_id: '', tipo: 'cita', fecha: toISO(cursor), hora: '', motivo: '' });
    setShowForm(false);
    load();
  }

  async function cambiarEstado(id, estado) {
    await updateAppointmentStatus(id, estado);
    load();
  }

  function goPrev() {
    if (mode === 'dia') setCursor(addDays(cursor, -1));
    else if (mode === 'semana') setCursor(addDays(cursor, -7));
    else setCursor(addMonths(cursor, -1));
  }
  function goNext() {
    if (mode === 'dia') setCursor(addDays(cursor, 1));
    else if (mode === 'semana') setCursor(addDays(cursor, 7));
    else setCursor(addMonths(cursor, 1));
  }
  function goToday() { setCursor(new Date()); }

  function jumpToDay(date) {
    setCursor(date);
    setMode('dia');
  }

  const titulo = useMemo(() => {
    if (mode === 'dia') {
      return cursor.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (mode === 'semana') {
      const ini = startOfWeek(cursor);
      const fin = endOfWeek(cursor);
      if (ini.getMonth() === fin.getMonth()) {
        return `${ini.getDate()} – ${fin.getDate()} ${MESES[ini.getMonth()]} ${ini.getFullYear()}`;
      }
      return `${ini.getDate()} ${MESES[ini.getMonth()]} – ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
    }
    return `${MESES[cursor.getMonth()].charAt(0).toUpperCase() + MESES[cursor.getMonth()].slice(1)} ${cursor.getFullYear()}`;
  }, [mode, cursor]);

  function openNewCita(fechaInicial) {
    setForm({ patient_id: '', tipo: 'cita', fecha: fechaInicial || toISO(cursor), hora: '', motivo: '' });
    setShowForm(true);
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Agenda</h1>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          <ModeButton active={mode === 'dia'} onClick={() => setMode('dia')}>Día</ModeButton>
          <ModeButton active={mode === 'semana'} onClick={() => setMode('semana')}>Semana</ModeButton>
          <ModeButton active={mode === 'mes'} onClick={() => setMode('mes')}>Mes</ModeButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={goPrev} aria-label="Anterior" className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200">
                <ChevronLeft size={16} />
              </button>
              <button onClick={goNext} aria-label="Siguiente" className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200">
                <ChevronRight size={16} />
              </button>
              <button onClick={goToday} className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-sm font-medium">
                Hoy
              </button>
              <span className="text-sm font-semibold text-slate-700 capitalize ml-2">{titulo}</span>
            </div>
            <button onClick={() => openNewCita()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-sm">
              <Plus size={16} /> Nueva cita
            </button>
          </div>

          {showForm && (
            <AppointmentForm form={form} setForm={setForm} patients={patients} onSubmit={submit} onCancel={() => setShowForm(false)} />
          )}

          {mode === 'dia' && <DayView appts={appts} onEstado={cambiarEstado} />}
          {mode === 'semana' && <WeekView cursor={cursor} appts={appts} onDayClick={jumpToDay} />}
          {mode === 'mes' && <MonthView cursor={cursor} appts={appts} onDayClick={jumpToDay} />}
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center gap-2">
              <CalendarCheck size={16} className="text-amber-600" />
              <span className="text-sm font-semibold text-slate-700">Seguimientos (7 días)</span>
            </div>
            {followups.length === 0 ? (
              <p className="p-6 text-slate-500 text-sm text-center">Sin seguimientos pendientes.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {followups.map(f => (
                  <li key={f.id} className="p-4 text-sm hover:bg-slate-50">
                    <div className="flex justify-between items-start">
                      <span className="font-medium truncate">{f.paciente_nombre}</span>
                      <span className="text-slate-500 text-xs shrink-0 ml-2">{f.fecha}</span>
                    </div>
                    {f.motivo && <div className="text-slate-500 mt-1 text-xs">{f.motivo}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
