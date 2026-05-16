export function buildGreeting(fullName, now = new Date()) {
  const firstName = fullName.split(' ')[0];
  const h = now.getHours();
  const greeting = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const dateStr = now.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });
  return { firstName, greeting, dateStr };
}
