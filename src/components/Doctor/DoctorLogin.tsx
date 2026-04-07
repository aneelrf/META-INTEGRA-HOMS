import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function DoctorLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Si el login es exitoso, Firebase cambiará el estado del auth y el Dashboard se renderizará automáticamente
        } catch (err: any) {
            console.error('Error de autenticación:', err);
            setError('Credenciales inválidas. Por favor, verifica tu correo y contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-secondary flex flex-col justify-center items-center p-4">
            
            {/* Header Logo */}
            <div className="mb-10 w-full max-w-sm flex justify-center">
                <img 
                    src="/META-INTEGRA-HOMS/dr-logo.png" 
                    alt="Dr. Héctor Sánchez N." 
                    className="w-full max-w-[280px] h-auto object-contain drop-shadow-sm" 
                />
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md p-8 md:p-10 border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-primary-dark mb-2">Acceso Médico</h1>
                    <p className="text-gray-500 font-medium text-sm">Ingresa tus credenciales para ver los expedientes.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-red-700 font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="dr.ejemplo@correo.com"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Autenticando...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </div>
                </form>
                
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 font-medium">Plataforma Segura META Integra &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
}
