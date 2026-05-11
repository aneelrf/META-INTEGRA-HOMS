import { jsPDF } from 'jspdf';
import { consentContent, getConsentDateLabel } from '../config/consentContent';

const HOMS = 'HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS)';

interface Seg { text: string; bold: boolean }
type Word = { text: string; bold: boolean; w: number };

function parseSegs(text: string): Seg[] {
    const parts = text.split(HOMS);
    const out: Seg[] = [];
    parts.forEach((p, i) => {
        if (p) out.push({ text: p, bold: false });
        if (i < parts.length - 1) out.push({ text: HOMS, bold: true });
    });
    return out;
}

function tokenize(doc: jsPDF, segments: Seg[], sz: number): Word[] {
    doc.setFontSize(sz);
    const words: Word[] = [];
    for (const seg of segments) {
        const tokens = seg.text.split(/\s+/).filter(Boolean);
        for (const tok of tokens) {
            const isPunct = /^[,\.;:!\?\)\]»]/.test(tok);
            if (isPunct && words.length > 0) {
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
    fecha: string;
    language?: string;
}) {
    const lang = data.language || 'es';
    const content = consentContent[lang] ?? consentContent['es'];
    const dateLabel = getConsentDateLabel(lang);

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
    centered(content.docTitle, true, 13);
    gap(6);

    // ── Body ───────────────────────────────────────────────────────────────
    para(content.intro1);
    gap(3);
    para(content.intro2);
    gap(3);
    para(content.intro3);
    gap(2);

    // ── Numbered items ─────────────────────────────────────────────────────
    content.items.forEach((item, i) => {
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

    // ── Closing paragraph ──────────────────────────────────────────────────
    para(content.getClosing(dateLabel));
    gap(10);

    // ── Signature block ────────────────────────────────────────────────────
    boldLine(`${content.signatureLabel}:`);
    gap(2);

    const sigW = 75, sigH = 28;
    if (y + sigH + 35 > ph - 20) { doc.addPage(); y = 22; }
    doc.addImage(data.signature, 'PNG', m, y, sigW, sigH);
    y += sigH + 2;
    hline(m, m + 85);
    gap(5);

    boldLine(`${content.nameLabel}:`);
    gap(1);
    normalLine(data.nombre);
    hline(m, m + 85);
    gap(5);

    boldLine(`${content.idLabel}:`);
    gap(1);
    normalLine(data.cedula);
    hline(m, m + 85);

    // ── Save ───────────────────────────────────────────────────────────────
    const safe = data.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`autorizacion_imagen_${safe}_${data.fecha}.pdf`);
}
