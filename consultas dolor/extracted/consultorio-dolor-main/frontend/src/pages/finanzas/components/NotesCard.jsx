export default function NotesCard({ notas }) {
  if (!notas) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card mb-6">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notas</h3>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{notas}</p>
    </div>
  );
}
