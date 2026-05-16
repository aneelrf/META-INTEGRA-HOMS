export default function DocumentHeader({ settings, title, numero, fecha, badge }) {
  return (
    <header className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
      <div>
        <h1 className="text-xl font-bold">{settings?.medico_nombre || 'Dr./Dra. ___'}</h1>
        <p className="text-xs text-slate-600">{settings?.medico_especialidad || 'Anestesiología / Algología'}</p>
        {settings?.medico_exequatur && <p className="text-xs text-slate-600">Exequátur: {settings.medico_exequatur}</p>}
        {(settings?.direccion || settings?.telefono) && (
          <p className="text-xs text-slate-600 mt-1">
            {settings.direccion}{settings.telefono && ` · Tel: ${settings.telefono}`}
          </p>
        )}
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold tracking-wide">{title}</div>
        <div className="font-mono text-sm mt-1">{numero}</div>
        <div className="text-xs text-slate-600 mt-1">{fecha}</div>
        {badge}
      </div>
    </header>
  );
}
