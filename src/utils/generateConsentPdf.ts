import { jsPDF } from 'jspdf';

const MONTHS = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'
];

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} días del mes de ${MONTHS[d.getMonth()]} del año ${d.getFullYear()}`;
}

export function generateConsentPdf(data: {
    signature: string;
    nombre: string;
    cedula: string;
    fecha: string;
}) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 20;
    const cw = pw - m * 2;
    let y = 22;

    const lh = (sz: number) => sz * 0.352778 * 1.55;

    const write = (str: string, opts: {
        bold?: boolean; size?: number; center?: boolean; indent?: number;
    } = {}) => {
        const sz = opts.size ?? 10;
        doc.setFontSize(sz);
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
        const x = opts.center ? pw / 2 : m + (opts.indent ?? 0);
        const maxW = cw - (opts.indent ?? 0);
        const lines = doc.splitTextToSize(str, maxW) as string[];
        const blockH = lines.length * lh(sz);
        if (y + blockH > ph - 20) { doc.addPage(); y = 22; }
        doc.text(lines, x, y, opts.center ? { align: 'center' } : undefined);
        y += blockH + 1.5;
    };

    const gap = (mm: number) => { y += mm; };

    const hline = (x1: number, x2: number) => {
        doc.setDrawColor(150);
        doc.line(x1, y, x2, y);
        gap(1);
    };

    // ── Title ──────────────────────────────────────────────────────────────
    write('AUTORIZACIÓN PARA USO DE IMAGEN', { bold: true, size: 13, center: true });
    gap(5);

    // ── Body ───────────────────────────────────────────────────────────────
    write('Por medio de la presente AUTORIZO a la sociedad HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS), para utilizar las fotografías o videograbaciones que incluyan mi voz e imagen (en cualquier soporte) en el programa televisivo "Bienestar al Día", así como en campañas, promocionales y demás material que consideren pertinentes para la difusión y promoción del HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS), y que se distribuyan en el país o en el extranjero por cualquier medio, ya sea impreso, electrónico o de otro tipo.');
    gap(2);

    write('Asimismo, en el entendido de que derechos a la intimidad, el honor y a la propia imagen es un derecho fundamental en virtud del artículo 44 de la Constitución de la República Dominicana, tengo a bien expresar que esta autorización es libre, voluntaria y totalmente gratuita.');
    gap(2);

    write('Esta autorización se regirá por las normas legales aplicables y en particular por las siguientes:');
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
        write(`${i + 1}-  ${item}`, { indent: 4 });
        gap(1.5);
    });

    gap(3);

    // ── Closing paragraph ──────────────────────────────────────────────────
    const dateLabel = formatDate(data.fecha);
    write(`Firmo libre y voluntariamente la presente autorización en señal de que la he leído y estoy de acuerdo con los términos y condiciones contenidos en la misma. En esta ciudad de Santiago de los Caballeros, provincia de Santiago, República Dominicana, a los ${dateLabel}.`);
    gap(10);

    // ── Signature block ────────────────────────────────────────────────────
    write('Firma autorización:', { bold: true });
    gap(2);

    const sigW = 75;
    const sigH = 28;
    if (y + sigH + 30 > ph - 20) { doc.addPage(); y = 22; }

    doc.addImage(data.signature, 'PNG', m, y, sigW, sigH);
    y += sigH + 2;
    hline(m, m + 85);
    gap(5);

    write('Nombre y Apellido:', { bold: true });
    gap(1);
    write(data.nombre);
    hline(m, m + 85);
    gap(5);

    write('Núm. Cédula o Pasaporte:', { bold: true });
    gap(1);
    write(data.cedula);
    hline(m, m + 85);

    // ── Save ───────────────────────────────────────────────────────────────
    const safe = data.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`autorizacion_imagen_${safe}_${data.fecha}.pdf`);
}
