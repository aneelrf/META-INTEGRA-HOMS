import { jsPDF } from 'jspdf';

export interface PrescriptionMedication {
    nombre:    string;
    dosis:     string;
    frecuencia: string;
    duracion:  string;
}

export interface PrescriptionData {
    patientName:   string;
    patientCedula: string;
    date:          string;       // YYYY-MM-DD
    diagnostico:   string;
    medications:   PrescriptionMedication[];
    indicaciones:  string;
    doctorName?:   string;
}

export function generatePrescriptionPdf(data: PrescriptionData): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw  = doc.internal.pageSize.getWidth();
    const m   = 20;
    const cw  = pw - m * 2;
    let   y   = 20;

    const lh10 = 10 * 0.352778 * 1.55;
    const lh9  = 9  * 0.352778 * 1.55;

    const gap  = (mm: number) => { y += mm; };
    const line = (x1: number, x2: number, thick = 0.3) => {
        doc.setDrawColor(200);
        doc.setLineWidth(thick);
        doc.line(x1, y, x2, y);
    };

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('META INTEGRA', pw / 2, y, { align: 'center' });
    gap(lh10);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Instituto Bariátrico y Digestivo — HOMS', pw / 2, y, { align: 'center' });
    gap(lh9 + 2);
    doc.setTextColor(0);

    line(m, pw - m, 0.5);
    gap(5);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('RECETA MÉDICA', pw / 2, y, { align: 'center' });
    gap(lh10 + 4);

    // ── Patient + Date block ─────────────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Paciente:', m, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientName, m + 22, y);

    const dateFormatted = (() => {
        try {
            return new Date(data.date + 'T00:00:00').toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric',
            });
        } catch {
            return data.date;
        }
    })();
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', pw - m - 45, y);
    doc.setFont('helvetica', 'normal');
    doc.text(dateFormatted, pw - m - 30, y);
    gap(lh9 + 1);

    if (data.patientCedula) {
        doc.setFont('helvetica', 'bold');
        doc.text('Cédula/Pasaporte:', m, y);
        doc.setFont('helvetica', 'normal');
        doc.text(data.patientCedula, m + 38, y);
        gap(lh9 + 1);
    }

    gap(2);
    line(m, pw - m);
    gap(5);

    // ── Diagnóstico ──────────────────────────────────────────────────────────
    if (data.diagnostico.trim()) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Diagnóstico:', m, y);
        gap(lh9 + 1);
        doc.setFont('helvetica', 'normal');
        const diagLines = doc.splitTextToSize(data.diagnostico.trim(), cw) as string[];
        doc.text(diagLines, m, y);
        y += diagLines.length * lh9;
        gap(5);
        line(m, pw - m);
        gap(5);
    }

    // ── Medications (Rx) ─────────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Rx', m, y);
    gap(lh10 + 2);

    data.medications.forEach((med, i) => {
        if (!med.nombre.trim()) return;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. ${med.nombre}`, m, y);
        gap(lh9 + 0.5);

        const details: string[] = [];
        if (med.dosis.trim())      details.push(`Dosis: ${med.dosis}`);
        if (med.frecuencia.trim()) details.push(`Frecuencia: ${med.frecuencia}`);
        if (med.duracion.trim())   details.push(`Duración: ${med.duracion}`);

        if (details.length) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(80);
            doc.text(details.join('  ·  '), m + 4, y);
            doc.setTextColor(0);
            gap(lh9 + 1.5);
        }
    });

    gap(3);

    // ── Indicaciones generales ───────────────────────────────────────────────
    if (data.indicaciones.trim()) {
        line(m, pw - m);
        gap(5);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Indicaciones generales:', m, y);
        gap(lh9 + 1);
        doc.setFont('helvetica', 'normal');
        const indLines = doc.splitTextToSize(data.indicaciones.trim(), cw) as string[];
        doc.text(indLines, m, y);
        y += indLines.length * lh9;
        gap(5);
    }

    // ── Doctor signature block ────────────────────────────────────────────────
    const sigY = Math.max(y + 20, doc.internal.pageSize.getHeight() - 55);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(150);
    doc.line(pw / 2 - 30, sigY, pw / 2 + 40, sigY);
    doc.setFontSize(8.5);
    doc.text(data.doctorName || 'Dr. Héctor Sánchez N.', pw / 2 + 5, sigY + 4, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text('Firma y sello del médico', pw / 2 + 5, sigY + 8, { align: 'center' });
    doc.setTextColor(0);

    // ── Save ─────────────────────────────────────────────────────────────────
    const safe = data.patientName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`receta_${safe}_${data.date}.pdf`);
}
