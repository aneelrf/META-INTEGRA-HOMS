import { useMemo, useState } from 'react';

const blankItem = () => ({ descripcion: '', cantidad: 1, precio_unitario: '' });

export function useLineItems(initial = [blankItem()]) {
  const [items, setItems] = useState(initial);

  function update(i, patch) {
    setItems(its => its.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function add() {
    setItems(its => [...its, blankItem()]);
  }
  function remove(i) {
    setItems(its => (its.length > 1 ? its.filter((_, idx) => idx !== i) : its));
  }

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0), 0),
    [items]
  );

  function clean() {
    return items
      .map(it => ({
        descripcion: (it.descripcion || '').trim(),
        cantidad: Number(it.cantidad) || 0,
        precio_unitario: Number(it.precio_unitario) || 0,
      }))
      .filter(it => it.descripcion && it.cantidad > 0 && it.precio_unitario >= 0);
  }

  return { items, update, add, remove, subtotal, clean };
}
