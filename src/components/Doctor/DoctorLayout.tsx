import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../firebase';
import { usePatients } from '../../store/PatientContext';
import { hasAlert, toEsTipo } from '../../services/patientsService';
import {
    Loader2, LayoutDashboard, Users, BarChart2, CalendarDays,
    LogOut, Bell, AlertTriangle, Clock, Settings,
    ChevronLeft, ChevronRight, Sun, Moon, Menu,
} from 'lucide-react';
import DoctorLogin from './DoctorLogin';
import { useTheme } from '../../hooks/useTheme';

const NAV_ITEMS = [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/doctor',               exact: true  },
    { label: 'Pacientes',     icon: Users,           path: '/doctor/pacientes',     exact: false },
    { label: 'Estadísticas',  icon: BarChart2,       path: '/doctor/estadisticas',  exact: false },
    { label: 'Agenda',        icon: CalendarDays,    path: '/doctor/agenda',        exact: false },
    { label: 'Configuración', icon: Settings,        path: '/doctor/configuracion', exact: false },
];

// ─── Nav item with tooltip ────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

function NavItem({
    label, icon: Icon, active, collapsed, onClick,
}: {
    label: string;
    icon: IconComponent;
    active: boolean;
    collapsed: boolean;
    onClick: () => void;
}) {
    return (
        <div className="relative group/item">
            <button
                onClick={onClick}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`
                    relative w-full flex items-center rounded-2xl
                    transition-all duration-200 focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-brand-primary/30 dark:focus-visible:ring-white/50
                    ${collapsed ? 'justify-center p-[11px]' : 'gap-3 px-3.5 py-2.5'}
                    ${active
                        ? 'bg-brand-primary/10 text-brand-primary dark:bg-white/[0.16] dark:text-white shadow-sm ring-1 ring-brand-primary/10 dark:ring-white/10'
                        : 'text-gray-500 dark:text-white/55 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08]'}
                `}
            >
                {/* Active left-edge accent */}
                {active && (
                    <span
                        aria-hidden
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gold"
                    />
                )}
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && (
                    <span className="text-sm font-semibold leading-none truncate">{label}</span>
                )}
                {active && !collapsed && (
                    <span aria-hidden className="ml-auto w-1.5 h-1.5 rounded-full bg-gold/80 flex-shrink-0" />
                )}
            </button>

            {/* Tooltip — only when rail is collapsed */}
            {collapsed && (
                <div
                    aria-hidden
                    className="
                        pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]
                        bg-gray-900/95 text-white text-xs font-semibold
                        px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl
                        opacity-0 group-hover/item:opacity-100
                        transition-opacity duration-150
                    "
                >
                    {label}
                    {/* Arrow */}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95" />
                </div>
            )}
        </div>
    );
}

// ─── Notification bell ────────────────────────────────────────────────────────

function NotificationBell({
    navigate, collapsed,
}: {
    navigate: (p: string) => void;
    collapsed: boolean;
}) {
    const { patients }    = usePatients();
    const [open, setOpen] = useState(false);
    const ref             = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const alerts = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const withAlerts = patients.filter(p => hasAlert(p.answers));

        const byCedula: Record<string, typeof patients> = {};
        patients.forEach(p => {
            const c = String(p.answers['cedula_pasaporte'] || '');
            if (c) {
                if (!byCedula[c]) byCedula[c] = [];
                byCedula[c].push(p);
            }
        });
        const pendingFollowUp = Object.values(byCedula).filter(group => {
            const latest = [...group].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0];
            const tipo = toEsTipo(latest.answers['tipo_consulta_metabolica'] as string);
            return (!tipo || tipo === 'Primera vez') && new Date(latest.createdAt) < thirtyDaysAgo;
        });

        return {
            withAlerts:      withAlerts.length,
            pendingFollowUp: pendingFollowUp.length,
            total:           withAlerts.length + pendingFollowUp.length,
        };
    }, [patients]);

    return (
        <div ref={ref} className="relative group/bell">
            <button
                onClick={() => setOpen(prev => !prev)}
                aria-label="Alertas del sistema"
                className={`
                    relative w-full flex items-center rounded-2xl
                    transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 dark:focus-visible:ring-white/50
                    text-gray-500 dark:text-white/55 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08]
                    ${collapsed ? 'justify-center p-[11px]' : 'gap-3 px-3.5 py-2.5'}
                `}
            >
                <Bell size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-semibold flex-1 text-left">Alertas</span>}
                {alerts.total > 0 && (
                    <span className="flex-shrink-0 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                        {alerts.total}
                    </span>
                )}
            </button>

            {/* Tooltip when collapsed */}
            {collapsed && (
                <div
                    aria-hidden
                    className="
                        pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]
                        bg-gray-900/95 text-white text-xs font-semibold
                        px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl
                        opacity-0 group-hover/bell:opacity-100 transition-opacity duration-150
                    "
                >
                    Alertas {alerts.total > 0 && `(${alerts.total})`}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95" />
                </div>
            )}

            {/* Dropdown — pops to the right when collapsed, above when expanded */}
            {open && (
                <div className={`
                    absolute z-50 bg-card rounded-2xl shadow-2xl border border-bd overflow-hidden w-64
                    ${collapsed
                        ? 'left-full bottom-0 ml-3'
                        : 'left-2 right-2 bottom-full mb-2'}
                `}>
                    <div className="px-4 py-3 border-b border-bd">
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Alertas del sistema</p>
                    </div>
                    {alerts.total === 0 ? (
                        <div className="px-4 py-5 text-center text-xs text-gray-400 dark:text-slate-500">
                            Sin alertas pendientes
                        </div>
                    ) : (
                        <div className="py-1">
                            {alerts.withAlerts > 0 && (
                                <button
                                    onClick={() => { navigate('/doctor/pacientes'); setOpen(false); }}
                                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left"
                                >
                                    <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                            {alerts.withAlerts} paciente{alerts.withAlerts !== 1 ? 's' : ''} con alertas médicas
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Historial con respuestas positivas</p>
                                    </div>
                                </button>
                            )}
                            {alerts.pendingFollowUp > 0 && (
                                <button
                                    onClick={() => { navigate('/doctor/pacientes'); setOpen(false); }}
                                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-yellow-50 dark:hover:bg-yellow-950/40 transition-colors text-left"
                                >
                                    <Clock size={15} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                            {alerts.pendingFollowUp} paciente{alerts.pendingFollowUp !== 1 ? 's' : ''} sin seguimiento
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Primera consulta hace más de 30 días</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DoctorLayout() {
    const { isDark, toggle: toggleTheme } = useTheme();

    const [authUser,    setAuthUser]    = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [collapsed,   setCollapsed]   = useState(false);
    const [mobileOpen,  setMobileOpen]  = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Auto-collapse on tablet / mobile
    useEffect(() => {
        const sync = () => {
            setCollapsed(window.innerWidth < 1024);
            if (window.innerWidth >= 768) setMobileOpen(false);
        };
        sync();
        window.addEventListener('resize', sync);
        return () => window.removeEventListener('resize', sync);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        return onAuthStateChanged(auth, user => {
            setAuthUser(user);
            setAuthLoading(false);
        });
    }, []);

    const handleSignOut = async () => { await signOut(auth); };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-brand-secondary flex flex-col justify-center items-center gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={40} />
                <p className="text-brand-primary font-medium animate-pulse">Verificando sesión...</p>
            </div>
        );
    }

    if (!authUser) return <DoctorLogin />;

    const isActive = (path: string, exact: boolean) =>
        exact
            ? location.pathname === path || location.pathname === path + '/'
            : location.pathname.startsWith(path);

    const navCollapsed = mobileOpen ? false : collapsed;

    return (
        <div className="flex h-screen bg-app-bg overflow-hidden font-sans text-gray-900 dark:text-slate-100">

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ══════════════════════ NAVIGATION RAIL ══════════════════════ */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50
                    md:relative md:inset-auto md:z-auto md:translate-x-0
                    flex-shrink-0 flex flex-col h-screen
                    transition-all duration-300 ease-in-out
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${collapsed ? 'w-[220px] md:w-[72px]' : 'w-[220px]'}
                    bg-card border-r border-bd
                    shadow-xl md:shadow-[1px_0_8px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.25)]
                    overflow-hidden
                `}
                aria-label="Navegación principal"
            >
                {/* ── Gold top stripe ── */}
                <div
                    aria-hidden
                    className="h-[3px] flex-shrink-0 bg-gradient-to-r from-gold via-gold/60 to-transparent"
                />

                {/* ── Logo + collapse toggle ── */}
                <div className={`flex items-center flex-shrink-0 py-4 ${navCollapsed ? 'justify-center px-3' : 'justify-between px-4'}`}>
                    <button
                        onClick={() => navigate('/')}
                        title="Volver al formulario"
                        className="flex items-center hover:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 rounded-lg"
                    >
                        <img
                            src="/META-INTEGRA-HOMS/logo-homs.svg"
                            alt="META Integra"
                            style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
                            className={`object-contain transition-all duration-300 ${navCollapsed ? 'w-9 h-9' : 'w-[130px] h-8'}`}
                        />
                    </button>

                    {!navCollapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            aria-label="Colapsar menú"
                            className="p-1.5 rounded-xl text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 dark:focus-visible:ring-white/40"
                        >
                            <ChevronLeft size={15} />
                        </button>
                    )}
                </div>

                {/* ── Divider ── */}
                <div aria-hidden className="mx-3 border-t border-bd mb-2 flex-shrink-0" />

                {/* ── Nav items ── */}
                <nav
                    className="flex-1 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden
                                [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {NAV_ITEMS.map(item => (
                        <NavItem
                            key={item.path}
                            label={item.label}
                            icon={item.icon}
                            active={isActive(item.path, item.exact)}
                            collapsed={navCollapsed}
                            onClick={() => { navigate(item.path); setMobileOpen(false); }}
                        />
                    ))}
                </nav>

                {/* ── Bottom controls ── */}
                <div className="flex-shrink-0 pb-2">
                    <div aria-hidden className="mx-3 border-t border-bd mt-2 mb-2" />

                    {/* Notifications */}
                    <div className="px-2 mb-1">
                        <NotificationBell navigate={navigate} collapsed={navCollapsed} />
                    </div>

                    {/* Theme toggle */}
                    <div className="px-2 mb-1">
                        <div className="relative group/theme">
                            <button
                                onClick={toggleTheme}
                                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                                className={`
                                    w-full flex items-center rounded-2xl transition-all duration-200
                                    text-gray-400 dark:text-white/40 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08]
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 dark:focus-visible:ring-white/40
                                    ${navCollapsed ? 'justify-center p-[11px]' : 'gap-3 px-3.5 py-2.5'}
                                `}
                            >
                                {isDark
                                    ? <Sun  size={18} className="flex-shrink-0" />
                                    : <Moon size={18} className="flex-shrink-0" />}
                                {!navCollapsed && (
                                    <span className="text-sm font-semibold">
                                        {isDark ? 'Modo claro' : 'Modo oscuro'}
                                    </span>
                                )}
                            </button>
                            {navCollapsed && (
                                <div aria-hidden className="
                                    pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]
                                    bg-gray-900/95 text-white text-xs font-semibold
                                    px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl
                                    opacity-0 group-hover/theme:opacity-100 transition-opacity duration-150
                                ">
                                    {isDark ? 'Modo claro' : 'Modo oscuro'}
                                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logout */}
                    <div className="px-2">
                        <button
                            onClick={handleSignOut}
                            aria-label="Cerrar sesión"
                            className={`
                                w-full flex items-center rounded-2xl transition-all duration-200
                                text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50
                                ${navCollapsed ? 'justify-center p-[11px]' : 'gap-3 px-3.5 py-2.5'}
                            `}
                        >
                            <LogOut size={18} className="flex-shrink-0" />
                            {!navCollapsed && <span className="text-sm font-semibold">Cerrar sesión</span>}
                        </button>
                    </div>
                </div>

                {/* ── Expand tab (visible only when collapsed) ── */}
                {navCollapsed && (
                    <button
                        onClick={() => setCollapsed(false)}
                        aria-label="Expandir menú"
                        className="
                            absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2
                            w-4 h-9 rounded-full z-10
                            bg-card border border-bd
                            flex items-center justify-center
                            text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-surface
                            shadow-md transition-all duration-200
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 dark:focus-visible:ring-white/40
                        "
                    >
                        <ChevronRight size={10} />
                    </button>
                )}
            </aside>

            {/* ══════════════════════ MAIN CONTENT ══════════════════════ */}
            <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                {/* Mobile top bar */}
                <div className="md:hidden flex-shrink-0 h-12 bg-card border-b border-bd flex items-center gap-3 px-4">
                    <button
                        onClick={() => setMobileOpen(true)}
                        aria-label="Abrir menú"
                        className="p-1.5 rounded-xl text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <img
                        src="/META-INTEGRA-HOMS/logo-homs.svg"
                        alt="META Integra"
                        style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
                        className="h-6 w-auto object-contain"
                    />
                </div>
                <Outlet />
            </div>
        </div>
    );
}
