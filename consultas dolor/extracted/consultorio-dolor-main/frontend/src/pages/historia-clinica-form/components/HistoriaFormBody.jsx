import {
  Activity, Brain, ClipboardList, FileText, Footprints, Hand,
  History, Stethoscope, Users, Zap,
} from 'lucide-react';
import {
  ANAMNESIS, APP, ARCOS, ESCALA_REFLEJOS, ESCALA_TONO,
  MUSCULO_INSP, MUSCULOS_TONO, NERVIOS, REFLEJOS_LISTA,
  REVISION, SENSIBILIDAD, SOCIAL_FAMILIAR,
} from '../clinicalHistoryFields.js';
import { Card, EscalaLegenda, Field, GridDI, inp, LongField } from './FormSection.jsx';

function FieldGroup({ items, form, setField }) {
  return items.map(([k, l]) => (
    <LongField key={k} label={l} value={form[k]} onChange={v => setField(k, v)} />
  ));
}

export default function HistoriaFormBody({ form, tono, reflejos, setField, setTono, setReflejos }) {
  return (
    <>
      <Card icon={FileText} title="Fecha">
        <div className="max-w-xs">
          <input type="date" value={form.fecha || ''} onChange={e => setField('fecha', e.target.value)} className={inp} />
        </div>
      </Card>

      <Card icon={ClipboardList} title="Consulta — Anamnesis del dolor">
        <FieldGroup items={ANAMNESIS} form={form} setField={setField} />
      </Card>

      <Card icon={History} title="Antecedentes Personales Patológicos">
        <FieldGroup items={APP} form={form} setField={setField} />
      </Card>

      <Card icon={Users} title="Antecedentes No Patológicos, Sociales y Familiares">
        <FieldGroup items={SOCIAL_FAMILIAR} form={form} setField={setField} />
      </Card>

      <Card icon={Stethoscope} title="Revisión por Sistemas — Constitucional">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Tensión arterial">
            <input className={inp} value={form.tension_arterial || ''} onChange={e => setField('tension_arterial', e.target.value)} placeholder="ej: 120/80" />
          </Field>
          <Field label="Frecuencia cardíaca">
            <input className={inp} value={form.frecuencia_cardiaca || ''} onChange={e => setField('frecuencia_cardiaca', e.target.value)} placeholder="ej: 72 lpm" />
          </Field>
          <Field label="Saturación O₂">
            <input className={inp} value={form.saturacion_o2 || ''} onChange={e => setField('saturacion_o2', e.target.value)} placeholder="ej: 98%" />
          </Field>
        </div>
        <div className="mt-3 space-y-3">
          <FieldGroup items={REVISION} form={form} setField={setField} />
        </div>
      </Card>

      <Card icon={Activity} title="Sistema Músculo Esquelético">
        <FieldGroup items={MUSCULO_INSP} form={form} setField={setField} />
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 mb-2">Arco de movimiento (ángulo)</h4>
        <FieldGroup items={ARCOS} form={form} setField={setField} />
      </Card>

      <Card icon={Hand} title="Sensibilidad">
        <FieldGroup items={SENSIBILIDAD} form={form} setField={setField} />
      </Card>

      <Card icon={Footprints} title="Tono Muscular">
        <EscalaLegenda items={ESCALA_TONO} max={5} />
        <GridDI filas={MUSCULOS_TONO} data={tono} setData={setTono} max={5} />
      </Card>

      <Card icon={Zap} title="Reflejos">
        <EscalaLegenda items={ESCALA_REFLEJOS} max={4} />
        <GridDI filas={REFLEJOS_LISTA} data={reflejos} setData={setReflejos} max={4} />
      </Card>

      <Card icon={Brain} title="Nervios Craneales">
        <FieldGroup items={NERVIOS} form={form} setField={setField} />
      </Card>

      <Card icon={FileText} title="Notas de evaluación">
        <textarea rows={4} className={inp} value={form.notas_evaluacion || ''} onChange={e => setField('notas_evaluacion', e.target.value)} />
      </Card>
    </>
  );
}
