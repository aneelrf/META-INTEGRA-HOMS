export default function PrintActionButton() {
  return (
    <div className="mt-8 text-center no-print">
      <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm">
        Imprimir / Guardar PDF
      </button>
    </div>
  );
}
