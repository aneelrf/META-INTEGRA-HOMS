import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Stethoscope, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-slate-50 to-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-brand-200/40 blur-3xl" aria-hidden="true"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-brand-300/30 blur-3xl" aria-hidden="true"></div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30 mb-4">
            <Stethoscope size={28} className="text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Consultorio de Dolor</h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
          <label className="block mb-4">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Correo
            </span>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              autoFocus
              autoComplete="email"
            />
          </label>

          <label className="block mb-6">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 text-white font-medium py-2.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Consultorio de Dolor
        </p>
      </div>
    </div>
  );
}
