import { jsPDF } from 'jspdf';

const MONTHS = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
];
const HOMS = 'HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS)';

function todayLabel(): string {
    const d = new Date();
    return `${d.getDate()} días del mes de ${MONTHS[d.getMonth()]} del año ${d.getFullYear()}`;
}

interface Seg { text: string; bold: boolean }
type Word = { text: string; bold: boolean; w: number };

/** Split text into bold/normal segments around every occurrence of HOMS. */
function parseSegs(text: string): Seg[] {
    const parts = text.split(HOMS);
    const out: Seg[] = [];
    parts.forEach((p, i) => {
        if (p) out.push({ text: p, bold: false });
        if (i < parts.length - 1) out.push({ text: HOMS, bold: true });
    });
    return out;
}

/**
 * Tokenise segments into words, merging leading punctuation (,.;:!?)])
 * with the previous word so commas/periods don't float away under justification.
 */
function tokenize(doc: jsPDF, segments: Seg[], sz: number): Word[] {
    doc.setFontSize(sz);
    const words: Word[] = [];

    for (const seg of segments) {
        const tokens = seg.text.split(/\s+/).filter(Boolean);
        for (const tok of tokens) {
            const isPunct = /^[,\.;:!\?\)\]»]/.test(tok);
            if (isPunct && words.length > 0) {
                // Attach to previous word (keeps comma/period next to its word)
                const prev = words[words.length - 1];
                prev.text += tok;
                doc.setFont('helvetica', prev.bold ? 'bold' : 'normal');
                prev.w = doc.getTextWidth(prev.text);
            } else {
                doc.setFont('helvetica', seg.bold ? 'bold' : 'normal');
                words.push({ text: tok, bold: seg.bold, w: doc.getTextWidth(tok) });
            }
        }
    }
    return words;
}

/**
 * Break word list into lines that fit within maxW.
 * Returns lines with their words and the total WORD width (without spaces).
 */
function buildLines(words: Word[], spW: number, maxW: number) {
    const lines: { words: Word[]; wordW: number }[] = [];
    let cur: Word[] = [], cw = 0;

    for (const word of words) {
        const addW = cur.length ? spW + word.w : word.w;
        if (cw + addW > maxW + 0.05 && cur.length) {
            lines.push({ words: cur, wordW: cw - (cur.length - 1) * spW });
            cur = [word]; cw = word.w;
        } else {
            cur.push(word);
            cw = cur.length === 1 ? word.w : cw + spW + word.w;
        }
    }
    if (cur.length) {
        const wordW = cur.reduce((s, w) => s + w.w, 0);
        lines.push({ words: cur, wordW });
    }
    return lines;
}

/**
 * Render segments as fully-justified text.
 * Correct formula: gap = (maxW − totalWordWidth) / (n−1)
 * Last line of paragraph is left-aligned (normal spacing).
 * Returns new y after last rendered line.
 */
function renderJustified(
    doc: jsPDF,
    segments: Seg[],
    x: number,
    maxW: number,
    startY: number,
    sz: number,
    ph: number,
): number {
    doc.setFontSize(sz);
    doc.setFont('helvetica', 'normal');
    const spW = doc.getTextWidth(' ');
    const lh  = sz * 0.352778 * 1.6;

    const words = tokenize(doc, segments, sz);
    const lines = buildLines(words, spW, maxW);

    let y = startY;
    for (let i = 0; i < lines.length; i++) {
        const { words: lw, wordW } = lines[i];
        const isLast = i === lines.length - 1;

        if (y > ph - 20) { doc.addPage(); y = 22; }

        // Correct justification gap: distribute ALL remaining space between words
        const gap = lw.length > 1 && !isLast ? (maxW - wordW) / (lw.length - 1) : spW;

        let xp = x;
        for (let j = 0; j < lw.length; j++) {
            doc.setFont('helvetica', lw[j].bold ? 'bold' : 'normal');
            doc.text(lw[j].text, xp, y);
            if (j < lw.length - 1) xp += lw[j].w + gap;
        }
        y += lh;
    }
    return y;
}

export function generateConsentPdf(data: {
    signature: string;
    nombre: string;
    cedula: string;
    fecha: string;  // kept for type compat, date is always today
}) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw  = doc.internal.pageSize.getWidth();
    const ph  = doc.internal.pageSize.getHeight();
    const m   = 20;
    const cw  = pw - m * 2;
    let   y   = 22;
    const sz  = 10;
    const lh  = sz * 0.352778 * 1.6;

    const gap = (mm: number) => { y += mm; };

    const centered = (text: string, bold = false, size = sz) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, cw) as string[];
        if (y + lines.length * size * 0.352778 * 1.6 > ph - 20) { doc.addPage(); y = 22; }
        doc.text(lines, pw / 2, y, { align: 'center' });
        y += lines.length * size * 0.352778 * 1.6;
    };

    const para = (text: string) => {
        y = renderJustified(doc, parseSegs(text), m, cw, y, sz, ph);
    };

    const boldLine = (text: string) => {
        if (y > ph - 20) { doc.addPage(); y = 22; }
        doc.setFontSize(sz); doc.setFont('helvetica', 'bold');
        doc.text(text, m, y); y += lh;
    };

    const normalLine = (text: string) => {
        if (y > ph - 20) { doc.addPage(); y = 22; }
        doc.setFontSize(sz); doc.setFont('helvetica', 'normal');
        doc.text(text, m, y); y += lh;
    };

    const hline = (x1: number, x2: number) => {
        doc.setDrawColor(150); doc.line(x1, y, x2, y); gap(1);
    };

    // ── Title ──────────────────────────────────────────────────────────────
    centered('AUTORIZACIÓN PARA USO DE IMAGEN', true, 13);
    gap(6);

    // ── Body ───────────────────────────────────────────────────────────────
    para('Por medio de la presente AUTORIZO a la sociedad HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS), para utilizar las fotografías o videograbaciones que incluyan mi voz e imagen (en cualquier soporte) en el programa televisivo "Bienestar al Día", así como en campañas, promocionales y demás material que consideren pertinentes para la difusión y promoción del HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS), y que se distribuyan en el país o en el extranjero por cualquier medio, ya sea impreso, electrónico o de otro tipo.');
    gap(3);

    para('Asimismo, en el entendido de que derechos a la intimidad, el honor y a la propia imagen es un derecho fundamental en virtud del artículo 44 de la Constitución de la República Dominicana, tengo a bien expresar que esta autorización es libre, voluntaria y totalmente gratuita.');
    gap(3);

    para('Esta autorización se regirá por las normas legales aplicables y en particular por las siguientes:');
    gap(2);

    // ── Numbered items ─────────────────────────────────────────────────────
    const items = [
        'El HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS) es libre de utilizar, reproducir, transmitir, retransmitir, mostrar públicamente, crear otras obras derivadas de mi imagen en el programa televisivo "Bienestar al Día", así como en las campañas de promoción que realice por cualquier medio, así como la fijación de mi imagen en cualquier soporte, ya sea videos, graficas, filminas y todo material suplementario del programa, las promociones y campañas, estableciendo que se utilizará única y exclusivamente para estos fines.',
        'Este video/foto podrá ser utilizado con fines educativos, informativos y publicitarios en diferentes escenarios y plataformas del HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS).',
        'Este video/foto podrá ser utilizado en el ámbito nacional e internacional.',
        'Esta autorización no tiene límite de tiempo para su concesión, ni para su explotación, ya sea total o parcial, por lo que esta autorización es concedida por un plazo de tiempo ilimitado.',
        'Autorizo el uso de mi nombre y de los datos personales facilitados para los fines señalados.',
        'Autorizo el uso de cualquier comentario que pudiere haber hecho mientras grababa el video, así como, que tal comentario sea editado con los fines señalados o citado en otros medios.',
        'Autorizo al HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS) a utilizar los Derechos de Autor, Los Derechos Conexos y en general cualquier derecho de propiedad intelectual que tengan que ver con el derecho de imagen.',
        'El HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS) queda exento de cualquier responsabilidad que pueda derivarse directa o indirectamente de la presente actividad y otorgo formal descargo y finiquito legal a su favor con la firma de la presente autorización.',
    ];

    items.forEach((item, i) => {
        doc.setFontSize(sz);
        doc.setFont('helvetica', 'normal');
        const numStr = `${i + 1}-  `;
        const numW   = doc.getTextWidth(numStr);
        if (y + lh > ph - 20) { doc.addPage(); y = 22; }
        doc.text(numStr, m, y);
        y = renderJustified(doc, parseSegs(item), m + numW, cw - numW, y, sz, ph);
        gap(2);
    });

    gap(3);

    // ── Closing paragraph (date = today, automatic) ────────────────────────
    para(`Firmo libre y voluntariamente la presente autorización en señal de que la he leído y estoy de acuerdo con los términos y condiciones contenidos en la misma. En esta ciudad de Santiago de los Caballeros, provincia de Santiago, República Dominicana, a los ${todayLabel()}.`);
    gap(10);

    // ── Signature block ────────────────────────────────────────────────────
    boldLine('Firma autorización:');
    gap(2);

    const sigW = 75, sigH = 28;
    if (y + sigH + 35 > ph - 20) { doc.addPage(); y = 22; }
    doc.addImage(data.signature, 'PNG', m, y, sigW, sigH);
    y += sigH + 2;
    hline(m, m + 85);
    gap(5);

    boldLine('Nombre y Apellido:');
    gap(1);
    normalLine(data.nombre);
    hline(m, m + 85);
    gap(5);

    boldLine('Núm. Cédula o Pasaporte:');
    gap(1);
    normalLine(data.cedula);
    hline(m, m + 85);

    // ── Save ───────────────────────────────────────────────────────────────
    const safe = data.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`autorizacion_imagen_${safe}_${data.fecha}.pdf`);
}
