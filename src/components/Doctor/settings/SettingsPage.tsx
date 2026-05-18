import { useState, useEffect } from 'react';
import {
    Settings, Plus, Stethoscope, Briefcase, Edit2, X,
    Eye, EyeOff, Loader2, Save, Users, UserCheck, UserX,
    ShieldCheck, AlertCircle, Link, Clock,
} from 'lucide-react';
import { auth } from '../../../firebase';
import MigrationPanel from '../dashboard/MigrationPanel';
import type { UserProfile, UserRole } from '../../../services/usersService';
import { subscribeUsers, createAppUser, createUserProfileOnly, updateUserProfile } from '../../../services/usersService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ rol }: { rol: UserRole }) {
    return rol === 'medico' ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            <Stethoscope size={9} /> Médico
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Briefcase size={9} /> Administrativo
        </span>
    );
}

function UserAvatar({ profile }: { profile: UserProfile }) {
    const [err, setErr] = useState(false);
    if (profile.photoUrl && !err) {
        return (
            <img src={profile.photoUrl} alt={profile.nombre} onError={() => setErr(true)}
                className="w-10 h-10 rounded-full object-cover border border-bd2 flex-shrink-0" />
        );
    }
    return (
        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-primary text-sm font-bold uppercase">{profile.nombre?.[0] ?? '?'}</span>
        </div>
    );
}

// ─── Role selector ────────────────────────────────────────────────────────────

function RoleSelector({ value, onChange }: { value: UserRole; onChange: (r: UserRole) => void }) {
    return (
        <div className="flex gap-3">
            {(['medico', 'administrativo'] as UserRole[]).map(r => (
                <button key={r} type="button" onClick={() => onChange(r)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        value === r
                            ? r === 'medico' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-amber-500 border-amber-500 text-white'
                            : 'border-bd2 text-gray-500 dark:text-slate-400 bg-surface hover:border-gray-300 dark:hover:border-slate-600'
                    }`}>
                    {r === 'medico' ? <Stethoscope size={14} /> : <Briefcase size={14} />}
                    {r === 'medico' ? 'Médico' : 'Administrativo'}
                </button>
            ))}
        </div>
    );
}

// ─── Photo URL field with preview ─────────────────────────────────────────────

function PhotoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [imgOk, setImgOk] = useState(true);
    return (
        <div>
            <label className="label-xs">URL de foto de perfil</label>
            <input type="text" value={value}
                onChange={e => { onChange(e.target.value); setImgOk(true); }}
                placeholder="/META-INTEGRA-HOMS/dr-hector-sanchez.png"
                className="field" />
            {value && imgOk && (
                <img src={value} alt="preview" onError={() => setImgOk(false)}
                    className="mt-2 w-12 h-12 rounded-full object-cover border border-bd2" />
            )}
        </div>
    );
}

// ─── Create user modal ────────────────────────────────────────────────────────

function CreateUserModal({ onClose }: { onClose: () => void }) {
    const [nombre,       setNombre]       = useState('');
    const [email,        setEmail]        = useState('');
    const [password,     setPassword]     = useState('');
    const [showPass,     setShowPass]     = useState(false);
    const [rol,          setRol]          = useState<UserRole>('medico');
    const [especialidad, setEspecialidad] = useState('');
    const [photoUrl,     setPhotoUrl]     = useState('');
    const [existing,     setExisting]     = useState(false);
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState('');

    const canSubmit = nombre.trim() && email.trim() && (existing || password.trim());

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSaving(true);
        setError('');
        try {
            const profile = { nombre: nombre.trim(), rol, especialidad: especialidad.trim(), photoUrl: photoUrl.trim(), activo: true };
            if (existing) {
                await createUserProfileOnly(email.trim(), profile, auth.currentUser?.uid || '');
            } else {
                await createAppUser(email.trim(), password, profile, auth.currentUser?.uid || '');
            }
            onClose();
        } catch (err: any) {
            const code = err?.code ?? '';
            if (code === 'auth/email-already-in-use') setError('Este correo ya tiene una cuenta. Usa la opción "Ya tiene cuenta".');
            else if (code === 'auth/weak-password')   setError('La contraseña debe tener al menos 6 caracteres.');
            else setError(err.message || 'Error al crear el usuario.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[95vh] overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-bd flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                            <Plus size={16} className="text-brand-primary" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-slate-50">Agregar usuario</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"><X size={20} /></button>
                </div>

                {/* Toggle: new vs existing */}
                <div className="px-6 pt-5 flex-shrink-0">
                    <div className="flex gap-2 p-1 bg-surface rounded-xl">
                        <button type="button" onClick={() => setExisting(false)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                !existing
                                    ? 'bg-card shadow-sm text-gray-900 dark:text-slate-50'
                                    : 'text-gray-500 dark:text-slate-400'
                            }`}>
                            <Plus size={14} /> Nuevo usuario
                        </button>
                        <button type="button" onClick={() => setExisting(true)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                existing
                                    ? 'bg-card shadow-sm text-gray-900 dark:text-slate-50'
                                    : 'text-gray-500 dark:text-slate-400'
                            }`}>
                            <Link size={14} /> Ya tiene cuenta
                        </button>
                    </div>
                    {existing && (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-xl px-3 py-2 border border-amber-100 dark:border-amber-900/60">
                            Se creará un perfil que se enlazará automáticamente la próxima vez que el usuario inicie sesión.
                        </p>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                    <div>
                        <label className="label-xs">Nombre completo *</label>
                        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                            placeholder="Dr. Hector Sánchez" required className="field" />
                    </div>
                    <div>
                        <label className="label-xs">Correo electrónico *</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="doctor@clinica.com" required className="field" />
                    </div>
                    {!existing && (
                        <div>
                            <label className="label-xs">Contraseña *</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres" required className="field pr-10" />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="label-xs">Rol *</label>
                        <RoleSelector value={rol} onChange={setRol} />
                    </div>
                    {rol === 'medico' && (
                        <div>
                            <label className="label-xs">Especialidad</label>
                            <input type="text" value={especialidad} onChange={e => setEspecialidad(e.target.value)}
                                placeholder="ej. Cirugía Metabólica" className="field" />
                        </div>
                    )}
                    <PhotoField value={photoUrl} onChange={setPhotoUrl} />
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/60">
                            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-bd flex justify-end gap-3 flex-shrink-0">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:bg-surface rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit as any} disabled={saving || !canSubmit}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {saving ? 'Guardando...' : 'Agregar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit user modal ──────────────────────────────────────────────────────────

function EditUserModal({ user, onClose }: { user: UserProfile; onClose: () => void }) {
    const [nombre,       setNombre]       = useState(user.nombre);
    const [rol,          setRol]          = useState<UserRole>(user.rol);
    const [especialidad, setEspecialidad] = useState(user.especialidad || '');
    const [photoUrl,     setPhotoUrl]     = useState(user.photoUrl || '');
    const [activo,       setActivo]       = useState(user.activo);
    const [saving,       setSaving]       = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserProfile(user.id, {
                nombre: nombre.trim(), rol,
                especialidad: especialidad.trim(),
                photoUrl: photoUrl.trim(), activo,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[95vh] overflow-hidden">

                <div className="px-6 py-4 border-b border-bd flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                            <Edit2 size={15} className="text-brand-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-slate-50">Editar usuario</h3>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"><X size={20} /></button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                    {user.pendingLink && (
                        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 rounded-xl px-4 py-3">
                            <Clock size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Este perfil se enlazará automáticamente cuando el usuario inicie sesión por primera vez.
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="label-xs">Nombre completo</label>
                        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="field" />
                    </div>
                    <div>
                        <label className="label-xs">Rol</label>
                        <RoleSelector value={rol} onChange={setRol} />
                    </div>
                    {rol === 'medico' && (
                        <div>
                            <label className="label-xs">Especialidad</label>
                            <input type="text" value={especialidad} onChange={e => setEspecialidad(e.target.value)}
                                placeholder="ej. Cirugía Metabólica" className="field" />
                        </div>
                    )}
                    <PhotoField value={photoUrl} onChange={setPhotoUrl} />
                    <div>
                        <label className="label-xs">Estado</label>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setActivo(true)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                    activo ? 'bg-green-500 border-green-500 text-white' : 'border-bd2 text-gray-500 dark:text-slate-400 bg-surface hover:border-gray-300 dark:hover:border-slate-600'
                                }`}>
                                <UserCheck size={14} /> Activo
                            </button>
                            <button type="button" onClick={() => setActivo(false)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                    !activo ? 'bg-gray-500 border-gray-500 text-white' : 'border-bd2 text-gray-500 dark:text-slate-400 bg-surface hover:border-gray-300 dark:hover:border-slate-600'
                                }`}>
                                <UserX size={14} /> Inactivo
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-bd flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:bg-surface rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving || !nombre.trim()}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const [users,       setUsers]       = useState<UserProfile[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [fsError,     setFsError]     = useState<string | null>(null);
    const [showCreate,  setShowCreate]  = useState(false);
    const [editTarget,  setEditTarget]  = useState<UserProfile | null>(null);
    const [showMigrate, setShowMigrate] = useState(false);

    useEffect(() => {
        return subscribeUsers(
            data => { setUsers(data); setLoading(false); setFsError(null); },
            err  => { setFsError(err.message); setLoading(false); },
        );
    }, []);

    const doctors  = users.filter(u => u.rol === 'medico');
    const admins   = users.filter(u => u.rol === 'administrativo');
    const pending  = users.filter(u => u.pendingLink);

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                            <Settings size={20} className="text-brand-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Configuración</h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Gestión de usuarios del sistema</p>
                        </div>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
                        <Plus size={16} /> Agregar usuario
                    </button>
                </div>

                {/* Firestore rules note */}
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl px-5 py-4 flex gap-3 items-start">
                    <ShieldCheck size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Recuerda agregar el correo de cada nuevo usuario a la lista de correos autorizados en las reglas de Firestore (Firebase Console), de lo contrario no podrán acceder al sistema.
                    </p>
                </div>

                {/* Firestore error */}
                {fsError && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 rounded-2xl px-5 py-4 flex gap-3 items-start">
                        <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">Sin acceso a la colección de usuarios</p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                Agrega la regla <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded">match /users/{'{uid}'} {'{ allow read, write: if isAuthorized(); }'}</code> en Firebase Console → Firestore → Reglas.
                            </p>
                        </div>
                    </div>
                )}

                {/* Summary cards */}
                {!fsError && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total usuarios',  value: users.length,    icon: <Users size={18} className="text-blue-600" />,       bg: 'bg-blue-50 dark:bg-blue-950/40' },
                            { label: 'Médicos',          value: doctors.length,  icon: <Stethoscope size={18} className="text-blue-600" />,  bg: 'bg-blue-50 dark:bg-blue-950/40' },
                            { label: 'Administrativos', value: admins.length,   icon: <Briefcase size={18} className="text-amber-600" />,   bg: 'bg-amber-50 dark:bg-amber-950/40' },
                            { label: 'Pendientes',       value: pending.length,  icon: <Clock size={18} className="text-orange-500" />,      bg: 'bg-orange-50 dark:bg-orange-950/40' },
                        ].map(c => (
                            <div key={c.label} className="bg-card rounded-2xl border border-bd shadow-sm p-5 flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>{c.icon}</div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{c.value}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{c.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* User list */}
                <div className="bg-card rounded-2xl border border-bd shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-bd flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-brand-primary" />
                            <h2 className="font-semibold text-gray-800 dark:text-slate-200">Usuarios registrados</h2>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{users.length} usuario{users.length !== 1 ? 's' : ''}</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 size={28} className="animate-spin text-brand-primary" />
                        </div>
                    ) : fsError ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400 dark:text-slate-500">
                            <AlertCircle size={32} strokeWidth={1} />
                            <p className="text-sm">No se pueden cargar los usuarios</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-slate-500">
                            <Users size={36} strokeWidth={1} />
                            <p className="text-sm">Aún no hay usuarios registrados</p>
                            <button onClick={() => setShowCreate(true)}
                                className="text-xs text-brand-primary font-semibold hover:underline">
                                Agregar el primero
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-bd">
                            {users.map(u => (
                                <div key={u.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/5 dark:hover:bg-white/5 transition-colors group">
                                    <UserAvatar profile={u} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{u.nombre}</p>
                                            <RoleBadge rol={u.rol} />
                                            {u.pendingLink && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300">
                                                    <Clock size={9} /> Pendiente de primer acceso
                                                </span>
                                            )}
                                            {!u.activo && !u.pendingLink && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface text-gray-500 dark:text-slate-400">
                                                    Inactivo
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{u.email}</p>
                                        {u.especialidad && (
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{u.especialidad}</p>
                                        )}
                                    </div>
                                    <button onClick={() => setEditTarget(u)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 hover:text-brand-primary hover:bg-brand-primary/5 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                        <Edit2 size={13} /> Editar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Migration tool */}
                <div className="bg-card rounded-2xl border border-bd shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-bd flex items-center gap-2">
                        <Settings size={16} className="text-brand-primary" />
                        <h2 className="font-semibold text-gray-800 dark:text-slate-200">Herramientas del sistema</h2>
                    </div>
                    <div className="px-6 py-5 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Migrar base de datos</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                Migra los registros de la arquitectura legacy a la arquitectura V2.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowMigrate(true)}
                            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-bd2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:bg-surface transition-colors"
                        >
                            Ejecutar migración
                        </button>
                    </div>
                </div>

            </div>

            {showCreate  && <CreateUserModal onClose={() => setShowCreate(false)} />}
            {editTarget  && <EditUserModal   user={editTarget} onClose={() => setEditTarget(null)} />}
            {showMigrate && <MigrationPanel  onClose={() => setShowMigrate(false)} />}
        </div>
    );
}
