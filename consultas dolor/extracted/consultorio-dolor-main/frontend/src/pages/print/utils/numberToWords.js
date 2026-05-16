const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis',
  'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function numeroALetras(n) {
  n = Math.floor(n);
  if (n === 0) return 'cero';
  if (n < 30) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10), u = n % 10;
    return DECENAS[d] + (u ? ' y ' + UNIDADES[u] : '');
  }
  if (n === 100) return 'cien';
  if (n < 1000) {
    const c = Math.floor(n / 100), r = n % 100;
    return CENTENAS[c] + (r ? ' ' + numeroALetras(r) : '');
  }
  if (n < 1000000) {
    const m = Math.floor(n / 1000), r = n % 1000;
    const miles = m === 1 ? 'mil' : numeroALetras(m) + ' mil';
    return miles + (r ? ' ' + numeroALetras(r) : '');
  }
  return n.toString();
}

export function montoEnLetras(n) {
  const entero = Math.floor(n);
  const cent = Math.round((n - entero) * 100);
  const letras = numeroALetras(entero);
  return `${letras} pesos con ${String(cent).padStart(2, '0')}/100`.toUpperCase();
}
