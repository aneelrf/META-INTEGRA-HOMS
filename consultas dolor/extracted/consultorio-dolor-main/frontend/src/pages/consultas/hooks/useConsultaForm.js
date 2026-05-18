import { useEffect, useState } from 'react';
import { getPatient } from '../../pacientes/services/pacientesService.js';
import { createConsultation, getConsultation, updateConsultation } from '../services/consultasService.js';

const EMPTY = {
  motivo_consulta: '',
  antecedentes_relevantes: '',
  examen_fisico: '',
  diagnostico: '',
  plan: '',
  eva: 5,
  notas: '',
};

export function useConsultaForm({ patientId, consultationId }) {
  const isEdit = Boolean(consultationId);
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [bodyMapData, setBodyMapData] = useState(null);
  const [loaded, setLoaded] = useState(!isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getPatient(patientId).then(setPatient); }, [patientId]);

  useEffect(() => {
    if (!isEdit) return;
    getConsultation(consultationId).then(c => {
      setForm({
        motivo_consulta: c.motivo_consulta ?? '',
        antecedentes_relevantes: c.antecedentes_relevantes ?? '',
        examen_fisico: c.examen_fisico ?? '',
        diagnostico: c.diagnostico ?? '',
        plan: c.plan ?? '',
        eva: c.eva ?? 5,
        notas: c.notas ?? '',
      });
      if (c.body_map_data) {
        try { setBodyMapData(JSON.parse(c.body_map_data)); } catch {}
      }
      setLoaded(true);
    });
  }, [isEdit, consultationId]);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        body_map_data: bodyMapData ? JSON.stringify(bodyMapData) : null,
      };
      if (isEdit) {
        await updateConsultation(consultationId, payload);
        return consultationId;
      }
      payload.patient_id = patientId;
      const created = await createConsultation(payload);
      return created.id;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  return {
    patient, form, bodyMapData, loaded, saving, error, isEdit,
    setField, setBodyMapData, save,
  };
}
