export default function PrintLayout({ children, dense = false }) {
  const padding = dense ? 'p-10 text-[12px] leading-relaxed' : 'p-12';
  return (
    <div className={`min-h-screen bg-white text-slate-900 max-w-3xl mx-auto print:p-0 ${padding}`}>
      {children}
    </div>
  );
}
