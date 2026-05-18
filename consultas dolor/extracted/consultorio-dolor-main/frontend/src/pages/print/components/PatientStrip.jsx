export default function PatientStrip({ label = 'Cliente', nombre, cedula, telefono, direccion }) {
  return (
    <section className="mb-6 bg-slate-50 p-4 rounded-lg">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="font-semibold">{nombre}</div>
      {(cedula || telefono) && (
        <div className="text-sm text-slate-600">
          {cedula && <>Cédula: {cedula}</>}
          {telefono && <> · Tel: {telefono}</>}
        </div>
      )}
      {direccion && <div className="text-sm text-slate-600">{direccion}</div>}
    </section>
  );
}
