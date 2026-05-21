import { jsPDF } from 'jspdf';

export interface LicenseData {
    patientName:   string;
    patientCedula: string;
    date:          string;
    fechaInicio:   string;
    diasReposo:    number;
    fechaFin:      string;
    diagnostico:   string;
    indicaciones:  string;
    doctorName?:   string;
}

function fmtDate(iso: string): string {
    try {
        return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
            day: '2-digit', month: 'long', year: 'numeric',
        });
    } catch {
        return iso;
    }
}

export function generateLicensePdf(data: LicenseData): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw  = doc.internal.pageSize.getWidth();
    const ph  = doc.internal.pageSize.getHeight();
    const m   = 20;
    const cw  = pw - m * 2;
    let   y   = 20;

    const lh10 = 10 * 0.352778 * 1.55;
    const lh9  = 9  * 0.352778 * 1.55;

    const gap  = (mm: number) => { y += mm; };
    const hline = (thick = 0.3) => {
        doc.setDrawColor(200); doc.setLineWidth(thick);
        doc.line(m, y, pw - m, y);
    };
    const para = (text: string, sz = 9, indent = 0) => {
        doc.setFontSize(sz); doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, cw - indent) as string[];
        lines.forEach(line => {
            if (y > ph - 25) { doc.addPage(); y = 22; }
            doc.text(line, m + indent, y);
            y += sz * 0.352778 * 1.6;
        });
    };

    // ── Header ─────────────────────────────────────────────────────────────────
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('META INTEGRA', pw / 2, y, { align: 'center' });
    gap(lh10);

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
    doc.text('Instituto Bariátrico y Digestivo — HOMS', pw / 2, y, { align: 'center' });
    gap(lh9 + 2); doc.setTextColor(0);

    hline(0.5); gap(5);

    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('LICENCIA MÉDICA', pw / 2, y, { align: 'center' });
    gap(lh10 + 5);

    // ── Patient block ──────────────────────────────────────────────────────────
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Paciente:', m, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientName, m + 22, y);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de emisión:', pw - m - 55, y);
    doc.setFont('helvetica', 'normal');
    doc.text(fmtDate(data.date), pw - m - 22, y);
    gap(lh9 + 1);

    if (data.patientCedula) {
        doc.setFont('helvetica', 'bold');
        doc.text('Cédula / Pasaporte:', m, y);
        doc.setFont('helvetica', 'normal');
        doc.text(data.patientCedula, m + 38, y);
        gap(lh9 + 1);
    }

    gap(3); hline(); gap(6);

    // ── Certification paragraph ────────────────────────────────────────────────
    const pronoun   = 'el/la';
    const certText  =
        `Por medio de la presente, certifico que ${pronoun} paciente identificado/a anteriormente ` +
        `ha sido evaluado/a en mi consulta médica y se le prescribe REPOSO MÉDICO por ` +
        `${data.diasReposo} ${data.diasReposo === 1 ? 'día' : 'días'} continuos, ` +
        `a partir del ${fmtDate(data.fechaInicio)} hasta el ${fmtDate(data.fechaFin)}.`;

    para(certText, 9);
    gap(6); hline(); gap(6);

    // ── Diagnóstico ────────────────────────────────────────────────────────────
    if (data.diagnostico.trim()) {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('DIAGNÓSTICO:', m, y);
        gap(lh9 + 1);
        para(data.diagnostico.trim());
        gap(5);
    }

    // ── Indicaciones ──────────────────────────────────────────────────────────
    if (data.indicaciones.trim()) {
        hline(); gap(6);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('INDICACIONES:', m, y);
        gap(lh9 + 1);
        para(data.indicaciones.trim());
        gap(5);
    }

    // ── Signature block ────────────────────────────────────────────────────────
    const sigY = Math.max(y + 20, ph - 50);
    const cx   = pw / 2 + 15;
    doc.setDrawColor(150);
    doc.line(cx - 35, sigY, cx + 35, sigY);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text(data.doctorName || 'Dr. Héctor Sánchez N.', cx, sigY + 5, { align: 'center' });
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(120);
    doc.text('Firma y sello del médico', cx, sigY + 9, { align: 'center' });
    doc.setTextColor(0);

    // ── Save ──────────────────────────────────────────────────────────────────
    const safe = data.patientName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`licencia_medica_${safe}_${data.date}.pdf`);
}
