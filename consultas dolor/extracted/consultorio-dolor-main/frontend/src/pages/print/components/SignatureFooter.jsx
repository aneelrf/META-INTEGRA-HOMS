export default function SignatureFooter({ settings, label = 'Firma y sello', dense = false }) {
  const labelSize = dense ? 'text-[11px]' : 'text-sm';
  const nameSize = dense ? 'text-[10px]' : 'text-xs';
  const margin = dense ? 'mt-12' : 'mt-16';
  return (
    <footer className={`${margin} pt-8`}>
      <div className="border-t-2 border-slate-900 pt-2 w-64 ml-auto text-center">
        <p className={labelSize}>{label}</p>
        <p className={`${nameSize} text-slate-600 mt-1`}>{settings?.medico_nombre || ''}</p>
      </div>
    </footer>
  );
}
