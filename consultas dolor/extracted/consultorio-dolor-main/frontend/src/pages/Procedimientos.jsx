import { useEffect, useState } from 'react';
import ProcedimientosFilters from './procedimientos/components/ProcedimientosFilters.jsx';
import ProcedimientosTable from './procedimientos/components/ProcedimientosTable.jsx';
import { listProcedures } from './procedimientos/services/procedimientosService.js';
import { defaultDateRange } from './procedimientos/utils/dateRange.js';

export default function Procedimientos() {
  const [filters, setFilters] = useState(() => ({ ...defaultDateRange(), tipo: '' }));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listProcedures(filters)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filters]);

  function update(patch) { setFilters(f => ({ ...f, ...patch })); }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Procedimientos</h1>
        <p className="text-sm text-slate-500 mt-1">Listado global — bloqueos, infiltraciones y neuromodulación</p>
      </div>

      <ProcedimientosFilters
        desde={filters.desde}
        hasta={filters.hasta}
        tipo={filters.tipo}
        onChange={update}
        count={items.length}
      />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
        <ProcedimientosTable items={items} loading={loading} />
      </div>
    </div>
  );
}
