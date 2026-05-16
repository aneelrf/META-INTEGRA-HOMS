import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Home, Users, Calendar, Activity, Wallet, Settings, LogOut, Stethoscope } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/pacientes', label: 'Pacientes', icon: Users, roles: ['admin', 'medico', 'secretaria'] },
  { to: '/agenda', label: 'Agenda', icon: Calendar, roles: ['admin', 'medico', 'secretaria'] },
  { to: '/procedimientos', label: 'Procedimientos', icon: Activity, roles: ['admin', 'medico'] },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet, roles: ['admin', 'medico', 'secretaria'] },
  { to: '/admin', label: 'Admin', icon: Settings, roles: ['admin'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const initials = (user.fullName || user.email || user.username || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/30">
            <Stethoscope size={20} className="text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">Consultorio</div>
            <div className="text-xs text-slate-400 leading-tight">Terapia del dolor</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-semibold shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-slate-100 font-medium truncate">{user.fullName || user.email || user.username}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
