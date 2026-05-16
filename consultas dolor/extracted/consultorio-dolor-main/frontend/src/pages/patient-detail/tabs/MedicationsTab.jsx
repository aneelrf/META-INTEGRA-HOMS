import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Pill, Plus, Printer } from 'lucide-react';
import EmptyState from '../shared/EmptyState.jsx';
import { Field, inputCls } from '../shared/FormField.jsx';
import {
  createMedication,
  createMedicationTitration,
  getPatientMedications,
  updateMedicationActive,
} from '../services/patientDetailService.js';
import { emptyMed } from '../utils/forms.js';

export default function MedicacionTab({ patientId, canWrite }) {
  const [meds, setMeds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyMed());
  const [addTitrTo, setAddTitrTo] = useState(null);
  const [titrForm, setTitrForm] = useState({ dosis: '', frecuencia: '', via: '', motivo_cambio: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  async function load() {
    const medications = await getPatientMedications(patientId);
    setMeds(medications);
    setSelectedIds(current => current.filter(id => medications.some(m => m.id === id)));
  }
  useEffect(() => { load(); }, [patientId]);

  async function submit(e) {
    e.preventDefault();
    await createMedication({ ...form, patient_id: patientId });
    setForm(emptyMed());
    setShowForm(false);
    load();
  }

  async function addTitration(e) {
    e.preventDefault();
    await createMedicationTitration(addTitrTo, titrForm);
    setAddTitrTo(null);
    setTitrForm({ dosis: '', frecuencia: '', via: '', motivo_cambio: '' });
    load();
  }

  async function toggleActive(med) {
    await updateMedicationActive(med.id, !med.activo);
    load();
  }

  function toggleSelected(id) {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  const printIds = selectedIds.length ? selectedIds : meds.filter(m => m.activo).map(m => m.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Prescripcion y titulacion</h2>
        <div className="flex gap-2 flex-wrap justify-end">
          {meds.length > 0 && (
            <Link
              to={`/print/prescripcion/${printIds.join(',')}`}
              target="_blank"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                printIds.length ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-100 text-slate-400 pointer-events-none'
              }`}
            >
              <Printer size={16} /> Receta {selectedIds.length ? 'seleccionada' : 'activa'}
            </Link>
          )}
          {canWrite && (
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">
              <Plus size={16} /> Nueva prescripcion
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-card animate-fade-in">
          <Field label="Farmaco *"><input required className={inputCls} value={form.farmaco} onChange={e=>setForm({...form, farmaco:e.target.value})} /></Field>
          <Field label="Es opioide">
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input type="checkbox" className="accent-brand-600" checked={form.es_opioide} onChange={e=>setForm({...form, es_opioide:e.target.checked})} />
              Marcar como opioide
            </label>
          </Field>
          <Field label="Dosis inicial"><input className={inputCls} value={form.dosis_inicial} onChange={e=>setForm({...form, dosis_inicial:e.target.value})} placeholder="ej: 10 mg" /></Field>
          <Field label="Frecuencia"><input className={inputCls} value={form.frecuencia_inicial} onChange={e=>setForm({...form, frecuencia_inicial:e.target.value})} placeholder="ej: c/8h" /></Field>
          <Field label="Via"><input className={inputCls} value={form.via_inicial} onChange={e=>setForm({...form, via_inicial:e.target.value})} placeholder="ej: oral" /></Field>
          <Field full label="Notas"><textarea rows={2} className={inputCls} value={form.notas} onChange={e=>setForm({...form, notas:e.target.value})} /></Field>
          <div className="md:col-span-2 flex gap-2 pt-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium">Cancelar</button>
          </div>
        </form>
      )}

      {meds.length === 0 ? (
        <EmptyState icon={Pill} text="Sin prescripciones registradas." />
      ) : (
        <ul className="space-y-3">
          {meds.map(m => (
            <li key={m.id} className={`bg-white border rounded-xl p-4 shadow-card ${m.activo ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
              <div className="flex justify-between items-start gap-3">
                <label className="pt-1 shrink-0">
                  <input
                    type="checkbox"
                    className="accent-brand-600"
                    checked={selectedIds.includes(m.id)}
                    onChange={() => toggleSelected(m.id)}
                    aria-label={`Seleccionar ${m.farmaco} para receta`}
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 flex items-center gap-2 flex-wrap">
                    {m.farmaco}
                    {m.es_opioide && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        <AlertCircle size={11} /> Opioide
                      </span>
                    )}
                    {!m.activo && <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Suspendido</span>}
                  </div>
                  {m.ultima_titulacion && (
                    <div className="text-sm text-slate-600 mt-1">
                      <span className="font-medium">{m.ultima_titulacion.dosis}</span>
                      {m.ultima_titulacion.frecuencia && ` · ${m.ultima_titulacion.frecuencia}`}
                      {m.ultima_titulacion.via && ` · ${m.ultima_titulacion.via}`}
                      <span className="text-slate-400 ml-2 text-xs">desde {m.ultima_titulacion.fecha}</span>
                    </div>
                  )}
                  {m.notas && <div className="text-sm text-slate-500 mt-1">{m.notas}</div>}
                </div>
                <div className="flex gap-3 text-sm shrink-0">
                  <Link to={`/print/prescripcion/${m.id}`} target="_blank" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium">
                    <Printer size={14} /> Receta
                  </Link>
                  {canWrite && (
                    <>
                      <button onClick={() => setAddTitrTo(addTitrTo === m.id ? null : m.id)} className="text-brand-600 hover:text-brand-700 font-medium">+ Titulacion</button>
                      <button onClick={() => toggleActive(m)} className="text-slate-500 hover:text-slate-900">
                        {m.activo ? 'Suspender' : 'Reactivar'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {addTitrTo === m.id && (
                <form onSubmit={addTitration} className="mt-3 p-3 bg-slate-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-in">
                  <input required placeholder="Nueva dosis" className={inputCls} value={titrForm.dosis} onChange={e=>setTitrForm({...titrForm, dosis:e.target.value})} />
                  <input placeholder="Frecuencia" className={inputCls} value={titrForm.frecuencia} onChange={e=>setTitrForm({...titrForm, frecuencia:e.target.value})} />
                  <input placeholder="Via" className={inputCls} value={titrForm.via} onChange={e=>setTitrForm({...titrForm, via:e.target.value})} />
                  <input placeholder="Motivo de cambio" className={inputCls} value={titrForm.motivo_cambio} onChange={e=>setTitrForm({...titrForm, motivo_cambio:e.target.value})} />
                  <div className="col-span-2 md:col-span-4 flex gap-2">
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm">Agregar</button>
                    <button type="button" onClick={() => setAddTitrTo(null)} className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm">Cancelar</button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
