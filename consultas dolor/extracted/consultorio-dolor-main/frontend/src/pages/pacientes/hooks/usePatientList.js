import { useEffect, useState } from 'react';
import { listPatients } from '../services/pacientesService.js';

export function usePatientList(query) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      listPatients(query)
        .then(setPatients)
        .catch(() => setPatients([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  return { patients, loading };
}
