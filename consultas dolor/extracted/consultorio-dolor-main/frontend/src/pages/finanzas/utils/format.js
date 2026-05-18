export const fmt = n =>
  'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function numeroFactura(invoice) {
  return `FAC-${invoice.fecha.slice(0, 4)}-${String(invoice.id).padStart(5, '0')}`;
}

export function numeroPresupuesto(budget) {
  return `PRES-${budget.fecha.slice(0, 4)}-${String(budget.id).padStart(5, '0')}`;
}

export function numeroRecibo(payment) {
  return `REC-${payment.fecha.slice(0, 4)}-${String(payment.id).padStart(5, '0')}`;
}
