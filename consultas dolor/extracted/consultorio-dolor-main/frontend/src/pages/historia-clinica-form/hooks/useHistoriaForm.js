import { useEffect, useState } from 'react';
import {
  createHistoria,
  getPatient,
  getPatientHistoria,
  updateHistoria,
} from '../services/clinicalHistoryFormService.js';
import {
  buildEmptyForm,
  buildEmptyReflejos,
  buildEmptyTono,
  hasClinicalData,
  hoyISO,
} from '../utils/clinicalHistoryFormUtils.js';

export function useHistoriaForm(patientId) {
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(buildEmptyForm());
  const [tono, setTono] = useState(buildEmptyTono());
  const [reflejos, setReflejos] = useState(buildEmptyReflejos());
  const [historiaId, setHistoriaId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const p = await getPatient(patientId);
      setPatient(p);
      const historia = await getPatientHistoria(patientId);
      if (historia) {
        setHistoriaId(historia.id);
        const empty = buildEmptyForm();
        const next = {};
        for (const k of Object.keys(empty)) next[k] = historia[k] ?? '';
        setForm(next);
        if (historia.tono_muscular) {
          try { setTono({ ...buildEmptyTono(), ...JSON.parse(historia.tono_muscular) }); } catch {}
        }
        if (historia.reflejos) {
          try { setReflejos({ ...buildEmptyReflejos(), ...JSON.parse(historia.reflejos) }); } catch {}
        }
      }
      setLoaded(true);
    })();
  }, [patientId]);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true); setError('');
    try {
      const payload = { ...form, patient_id: patientId };
      payload.tono_muscular = JSON.stringify(tono);
      payload.reflejos = JSON.stringify(reflejos);
      if (!hasClinicalData(form, tono, reflejos)) {
        setError('Agrega al menos un dato clinico antes de guardar la historia.');
        setSaving(false);
        return false;
      }
      for (const k of Object.keys(payload)) {
        if (payload[k] === '') payload[k] = null;
      }
      if (!payload.fecha) payload.fecha = hoyISO();

      if (historiaId) {
        await updateHistoria(historiaId, payload);
      } else {
        const res = await createHistoria(payload);
        setHistoriaId(res.id);
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    patient, form, tono, reflejos, historiaId,
    loaded, saving, error,
    setField, setTono, setReflejos, save,
  };
}
