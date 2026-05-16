import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { loginUser, logoutUser, subscribeToAuthState } from './authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setUser(null);
      setLoading(false);
    }, 8000);

    const unsubscribe = subscribeToAuthState(
      (nextUser) => {
        clearTimeout(timeoutId);
        setUser(nextUser);
        setLoading(false);
      },
      () => {
        clearTimeout(timeoutId);
        setUser(null);
        setLoading(false);
      },
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  async function login(username, password) {
    const nextUser = await loginUser(username, password);
    setUser(nextUser);
    return nextUser;
  }

  async function logout() {
    await logoutUser();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="p-8 text-red-600">
        No tienes permisos para acceder a esta seccion.
      </div>
    );
  }

  return children;
}
