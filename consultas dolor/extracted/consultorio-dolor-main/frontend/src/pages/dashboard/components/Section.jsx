import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Section({ icon: Icon, title, children, link, linkLabel, empty, emptyText }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-brand-600" />
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
        {link && (
          <Link to={link} className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
            {linkLabel}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
      {empty ? <p className="text-sm text-slate-500 py-2">{emptyText}</p> : children}
    </div>
  );
}
