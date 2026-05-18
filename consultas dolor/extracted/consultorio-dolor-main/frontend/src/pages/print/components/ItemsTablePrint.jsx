import { fmt } from '../../finanzas/utils/format.js';

export default function ItemsTablePrint({ items, subtotal, impuesto, total, totalLabel = 'TOTAL', extraRows }) {
  return (
    <table className="w-full mb-4 text-sm">
      <thead>
        <tr className="border-b-2 border-slate-900">
          <th className="text-left py-2">Descripción</th>
          <th className="text-right py-2 w-20">Cant.</th>
          <th className="text-right py-2 w-32">P. Unit.</th>
          <th className="text-right py-2 w-32">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {items.map(it => (
          <tr key={it.id} className="border-b border-slate-200">
            <td className="py-2">{it.descripcion}</td>
            <td className="py-2 text-right tabular-nums">{it.cantidad}</td>
            <td className="py-2 text-right tabular-nums">{fmt(it.precio_unitario)}</td>
            <td className="py-2 text-right tabular-nums">{fmt(it.subtotal)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3} className="py-2 text-right text-slate-600">Subtotal</td>
          <td className="py-2 text-right tabular-nums">{fmt(subtotal)}</td>
        </tr>
        {impuesto > 0 && (
          <tr>
            <td colSpan={3} className="py-2 text-right text-slate-600">Impuesto</td>
            <td className="py-2 text-right tabular-nums">{fmt(impuesto)}</td>
          </tr>
        )}
        <tr className="border-t-2 border-slate-900 font-bold text-base">
          <td colSpan={3} className="py-3 text-right">{totalLabel}</td>
          <td className="py-3 text-right tabular-nums">{fmt(total)}</td>
        </tr>
        {extraRows}
      </tfoot>
    </table>
  );
}
