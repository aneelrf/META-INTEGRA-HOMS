import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, FileText, Printer, Trash2, XCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import BudgetEstadoBadge from './finanzas/components/BudgetEstadoBadge.jsx';
import ItemsTable from './finanzas/components/ItemsTable.jsx';
import NotesCard from './finanzas/components/NotesCard.jsx';
import {
  convertBudgetToInvoice,
  deleteBudget,
  getBudget,
  updateBudget,
} from './finanzas/services/budgetsService.js';
import { numeroPresupuesto } from './finanzas/utils/format.js';

export default function BudgetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [budget, setBudget] = useState(null);

  async function load() { setBudget(await getBudget(id)); }
  useEffect(() => { load(); }, [id]);

  async function changeEstado(estado) {
    await updateBudget(id, { estado });
    load();
  }

  async function convertir() {
    if (!confirm('¿Convertir este presupuesto en factura? El presupuesto quedará marcado como facturado.')) return;
    const d = await convertBudgetToInvoice(id);
    navigate(`/finanzas/factura/${d.invoice_id}`);
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.')) return;
    await deleteBudget(id);
    navigate('/finanzas');
  }

  if (!budget) return <div className="p-8 text-slate-500">Cargando...</div>;

  const isEditable = budget.estado !== 'facturado' && budget.estado !== 'cancelado';
  const canDelete = user.role === 'admin' || user.role === 'medico';

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link to="/finanzas" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
          <ArrowLeft size={14} /> Volver a Finanzas
        </Link>
        <div className="flex justify-between items-start gap-4 flex-wrap mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 font-mono">{numeroPresupuesto(budget)}</h1>
            <p className="text-sm text-slate-500 mt-1">
              <Link to={`/pacientes/${budget.patient_id}`} className="text-brand-600 hover:text-brand-700">{budget.paciente_nombre}</Link>
              {budget.cedula && <> · {budget.cedula}</>} · {budget.fecha}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {budget.estado === 'borrador' && (
              <button onClick={() => changeEstado('aprobado')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium">
                <Check size={14} /> Aprobar
              </button>
            )}
            {isEditable && (
              <button onClick={convertir} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-sm">
                <FileText size={14} /> Convertir a factura
              </button>
            )}
            <Link to={`/print/presupuesto/${id}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium">
              <Printer size={14} /> Imprimir
            </Link>
            {isEditable && (
              <button onClick={() => changeEstado('cancelado')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">
                <XCircle size={14} /> Cancelar
              </button>
            )}
            {budget.estado !== 'facturado' && canDelete && (
              <button onClick={eliminar} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium">
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-3 items-center">
          <BudgetEstadoBadge estado={budget.estado} />
          {budget.invoice_id && (
            <Link to={`/finanzas/factura/${budget.invoice_id}`} className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full hover:bg-emerald-200">
              facturado como #{budget.invoice_id}
            </Link>
          )}
        </div>
      </div>

      <ItemsTable
        items={budget.items}
        subtotal={budget.subtotal}
        impuesto={budget.impuesto}
        total={budget.total}
        totalLabel="TOTAL ESTIMADO"
      />

      <NotesCard notas={budget.notas} />
    </div>
  );
}
