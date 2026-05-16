import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import AdminTabs from './admin/components/AdminTabs.jsx';
import ConsultorioTab from './admin/tabs/ConsultorioTab.jsx';
import PasswordTab from './admin/tabs/PasswordTab.jsx';
import UsuariosTab from './admin/tabs/UsuariosTab.jsx';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('consultorio');
  const isAdmin = user.role === 'admin';

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6">Administración</h1>
      <AdminTabs activeTab={tab} onChange={setTab} />

      <div className="animate-fade-in">
        {tab === 'consultorio' && <ConsultorioTab isAdmin={isAdmin} />}
        {tab === 'usuarios' && <UsuariosTab isAdmin={isAdmin} />}
        {tab === 'password' && <PasswordTab />}
      </div>
    </div>
  );
}
