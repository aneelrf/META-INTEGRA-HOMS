import { useEffect, useState } from 'react';
import { createPatient, getPatient, updatePatient } from '../services/pacientesService.js';
import { EMPTY_PATIENT, patientFormToPayload } from '../utils/emptyPatient.js';

export function usePacienteForm(id) {
  const isEdit = Boolean(id);
  const [data, setData] = useState(EMPTY_PATIENT);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getPatient(id).then(p => {
      const loaded = {};
      for (const k of Object.keys(EMPTY_PATIENT)) loaded[k] = p[k] ?? '';
      setData(loaded);
    });
  }, [id, isEdit]);

  function set(k, v) { setData(d => ({ ...d, [k]: v })); }

  async function save() {
    setSaving(true); setError('');
    try {
      const payload = patientFormToPayload(data);
      if (isEdit) {
        await updatePatient(id, payload);
        return id;
      }
      const created = await createPatient(payload);
      return created.id;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  return { data, set, save, saving, error, isEdit };
}
