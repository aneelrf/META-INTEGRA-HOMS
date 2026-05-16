import { useEffect, useState } from 'react';
import { Activity, AlertCircle, Plus } from 'lucide-react';
import EmptyState from '../shared/EmptyState.jsx';
import { Field, inputCls } from '../shared/FormField.jsx';
import {
  createProcedure,
  getPatientConsultations,
  getPatientProcedures,
  updateProcedureEvaPost,
} from '../services/patientDetailService.js';
import { emptyProcedure, formatPreVitals } from '../utils/forms.js';

export default function ProcedimientosTab({ patientId, canWrite }) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProcedure());
  const [latestEva, setLatestEva] = useState(null);
  const [evaPostFor, setEvaPostFor] = useState(null);
  const [evaPostValue, setEvaPostValue] = useState('');

  async function load() {
    const procedures = await getPatientProcedures(patientId);
    setItems(procedures);
  }
  useEffect(() => {
    load();
    getPatientConsultations(patientId).then(consultations => {
      const withEva = consultations.filter(c => c.eva != null);
      setLatestEva(withEva.length ? withEva[0].eva : null);
    });
  }, [patientId]);

  function openForm() {
    setForm({ ...emptyProcedure(), eva_pre: latestEva != null ? String(latestEva) : '' });
    setShowForm(true);
  }

  async function submit(e) {
    e.preventDefault();
    const payload = { ...form, patient_id: patientId };
    payload.followup_days = payload.followup_days ? Number(payload.followup_days) : null;
    payload.eva_pre = payload.eva_pre !== '' ? Number(payload.eva_pre) : null;
    for (const key of [
      'pre_tension_arterial',
      'pre_frecuencia_cardiaca',
      'pre_frecuencia_respiratoria',
      'pre_saturacion_o2',
      'pre_temperatura',
      'pre_glucemia',
    ]) {
      payload[key] = payload[key] || null;
    }
    await createProcedure(payload);
    setShowForm(false);
    setForm(emptyProcedure());
    load();
  }

  async function saveEvaPost(e, procId) {
    e.preventDefault();
    if (evaPostValue === '') return;
    await updateProcedureEvaPost(procId, Number(evaPostValue));
    setEvaPostFor(null);
    setEvaPostValue('');
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Procedimientos intervencionistas</h2>
        {canWrite && (
          <button onClick={openForm} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">
            <Plus size={16} /> Nuevo procedimiento
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-card animate-fade-in">
          <Field label="Tipo *"><select required className={inputCls} value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}>
            <option value="bloqueo">Bloqueo</option>
            <option value="infiltracion">Infiltración</option>
            <option value="neuromodulacion">Neuromodulación</option>
          </select></Field>
          <Field label="Subtipo / descripción"><input className={inputCls} value={form.subtipo} onChange={e=>setForm({...form, subtipo:e.target.value})} placeholder="ej: bloqueo epidural lumbar" /></Field>
          <Field label="Zona"><input className={inputCls} value={form.zona} onChange={e=>setForm({...form, zona:e.target.value})} /></Field>
          <Field label="Guiado por"><select className={inputCls} value={form.guiado_por} onChange={e=>setForm({...form, guiado_por:e.target.value})}>
            <option value="">—</option>
            <option value="ecografia">Ecografía</option>
            <option value="fluoroscopia">Fluoroscopia</option>
            <option value="ninguno">Ninguno</option>
          </select></Field>
          <Field label="Fármaco"><input className={inputCls} value={form.farmaco} onChange={e=>setForm({...form, farmaco:e.target.value})} /></Field>
          <Field label="Dosis"><input className={inputCls} value={form.dosis} onChange={e=>setForm({...form, dosis:e.target.value})} /></Field>
          <Field full label="Técnica"><input className={inputCls} value={form.tecnica} onChange={e=>setForm({...form, tecnica:e.target.value})} /></Field>
          <Field full label="Complicaciones"><input className={inputCls} value={form.complicaciones} onChange={e=>setForm({...form, complicaciones:e.target.value})} /></Field>
          <Field full label="Resultado"><input className={inputCls} value={form.resultado} onChange={e=>setForm({...form, resultado:e.target.value})} /></Field>
          <Field label="Días hasta seguimiento"><input type="number" min="0" className={inputCls} value={form.followup_days} onChange={e=>setForm({...form, followup_days:e.target.value})} placeholder="ej: 14" /></Field>
          <Field label="EVA antes del procedimiento (0-10)">
            <input type="number" min="0" max="10" className={inputCls} value={form.eva_pre} onChange={e=>setForm({...form, eva_pre:e.target.value})} placeholder={latestEva != null ? `Última consulta: ${latestEva}` : '0-10'} />
          </Field>
          <div className="md:col-span-2 border-t border-slate-100 pt-3 mt-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Signos vitales pre-procedimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="TA"><input className={inputCls} value={form.pre_tension_arterial} onChange={e=>setForm({...form, pre_tension_arterial:e.target.value})} placeholder="120/80" /></Field>
              <Field label="FC"><input className={inputCls} value={form.pre_frecuencia_cardiaca} onChange={e=>setForm({...form, pre_frecuencia_cardiaca:e.target.value})} placeholder="72 lpm" /></Field>
              <Field label="FR"><input className={inputCls} value={form.pre_frecuencia_respiratoria} onChange={e=>setForm({...form, pre_frecuencia_respiratoria:e.target.value})} placeholder="16 rpm" /></Field>
              <Field label="SpO2"><input className={inputCls} value={form.pre_saturacion_o2} onChange={e=>setForm({...form, pre_saturacion_o2:e.target.value})} placeholder="98%" /></Field>
              <Field label="Temp."><input className={inputCls} value={form.pre_temperatura} onChange={e=>setForm({...form, pre_temperatura:e.target.value})} placeholder="36.5 C" /></Field>
              <Field label="Glucemia"><input className={inputCls} value={form.pre_glucemia} onChange={e=>setForm({...form, pre_glucemia:e.target.value})} placeholder="mg/dL" /></Field>
            </div>
          </div>
          <Field full label="Notas"><textarea rows={2} className={inputCls} value={form.notas} onChange={e=>setForm({...form, notas:e.target.value})} /></Field>
          <div className="md:col-span-2 flex gap-2 pt-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium">Cancelar</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Activity} text="Sin procedimientos registrados." />
      ) : (
        <ul className="space-y-2">
          {items.map(p => {
            const delta = (p.eva_pre != null && p.eva_post != null) ? p.eva_pre - p.eva_post : null;
            return (
              <li key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500">{new Date(p.fecha).toLocaleString('es-DO')}</div>
                    <div className="font-medium mt-1 capitalize text-slate-900">
                      {p.tipo}{p.subtipo ? ' · ' + p.subtipo : ''}
                    </div>

                    {(p.eva_pre != null || p.eva_post != null) && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {p.eva_pre != null && <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">EVA pre {p.eva_pre}</span>}
                        {p.eva_post != null && <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">EVA post {p.eva_post}</span>}
                        {delta != null && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-emerald-100 text-emerald-800' : delta < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                            {delta > 0 ? `↓ ${delta} puntos` : delta < 0 ? `↑ ${Math.abs(delta)} puntos` : 'sin cambio'}
                          </span>
                        )}
                      </div>
                    )}

                    {p.zona && <div className="text-sm text-slate-600 mt-1">Zona: {p.zona}</div>}
                    {(p.farmaco || p.dosis) && <div className="text-sm text-slate-600">{p.farmaco} {p.dosis && `· ${p.dosis}`}</div>}
                    {p.guiado_por && <div className="text-sm text-slate-600 capitalize">Guía: {p.guiado_por}</div>}
                    {formatPreVitals(p) && (
                      <div className="text-xs text-slate-600 mt-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                        <span className="font-semibold">Signos vitales pre:</span> {formatPreVitals(p)}
                      </div>
                    )}
                    {p.resultado && <div className="text-sm text-slate-700 mt-1">Resultado: {p.resultado}</div>}
                    {p.complicaciones && (
                      <div className="text-sm text-red-700 mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> Complicaciones: {p.complicaciones}
                      </div>
                    )}
                    {p.notas && <div className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{p.notas}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {p.followup_days > 0 && (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full whitespace-nowrap">
                        seguimiento {p.followup_days}d
                      </span>
                    )}
                    {canWrite && p.eva_post == null && (
                      <button
                        onClick={() => { setEvaPostFor(p.id); setEvaPostValue(''); }}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap"
                      >
                        + Registrar EVA post
                      </button>
                    )}
                  </div>
                </div>

                {evaPostFor === p.id && (
                  <form onSubmit={e => saveEvaPost(e, p.id)} className="mt-3 p-3 bg-slate-50 rounded-lg flex gap-2 items-end animate-fade-in">
                    <label className="flex-1">
                      <span className="text-xs font-medium text-slate-600 mb-1 block">EVA post-procedimiento (0-10)</span>
                      <input type="number" min="0" max="10" required autoFocus className={inputCls} value={evaPostValue} onChange={e=>setEvaPostValue(e.target.value)} />
                    </label>
                    <button type="submit" className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">Guardar</button>
                    <button type="button" onClick={() => setEvaPostFor(null)} className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm font-medium">Cancelar</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
