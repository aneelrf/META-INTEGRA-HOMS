export function defaultDateRange() {
  const today = new Date();
  const ago30 = new Date();
  ago30.setDate(ago30.getDate() - 30);
  return {
    desde: ago30.toISOString().slice(0, 10),
    hasta: today.toISOString().slice(0, 10),
  };
}
