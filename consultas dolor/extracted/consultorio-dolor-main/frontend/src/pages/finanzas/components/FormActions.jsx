import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function FormActions({ saving, error, submitLabel, savingLabel = 'Guardando...' }) {
  return (
    <>
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? savingLabel : submitLabel}
        </button>
        <Link to="/finanzas" className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-medium">Cancelar</Link>
      </div>
    </>
  );
}
