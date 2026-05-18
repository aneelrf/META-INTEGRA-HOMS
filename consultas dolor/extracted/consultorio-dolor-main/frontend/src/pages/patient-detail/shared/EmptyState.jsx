export default function EmptyState({ icon: Icon, text }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-card">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Icon size={20} className="text-slate-400" />
      </div>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
