function ContactLine({ settings, size }) {
  if (!settings?.direccion && !settings?.telefono) return null;
  return (
    <p className={`${size} text-slate-600 mt-1`}>
      {settings.direccion}{settings.telefono && ` · Tel: ${settings.telefono}`}
    </p>
  );
}

export default function MedicoHeader({ settings, variant = 'left' }) {
  if (variant === 'center') {
    return (
      <header className="border-b-2 border-slate-900 pb-3 mb-4">
        <div className="text-center">
          <h1 className="text-lg font-bold">{settings?.medico_nombre || 'Dr./Dra. ___'}</h1>
          <p className="text-[10px] text-slate-600">{settings?.medico_especialidad || 'Anestesiología / Algología'}</p>
          <ContactLine settings={settings} size="text-[10px]" />
        </div>
      </header>
    );
  }
  return (
    <header className="border-b-2 border-slate-900 pb-4 mb-6">
      <h1 className="text-2xl font-bold">{settings?.medico_nombre || 'Dr./Dra. ___'}</h1>
      <p className="text-sm text-slate-600">{settings?.medico_especialidad || 'Anestesiología / Algología'}</p>
      {settings?.medico_exequatur && <p className="text-sm text-slate-600">Exequátur: {settings.medico_exequatur}</p>}
      <ContactLine settings={settings} size="text-sm" />
    </header>
  );
}
