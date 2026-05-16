import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pacientes from './pages/Pacientes.jsx';
import PacienteForm from './pages/PacienteForm.jsx';
import PacienteDetail from './pages/PacienteDetail.jsx';
import ConsultaForm from './pages/ConsultaForm.jsx';
import ConsultaDetail from './pages/ConsultaDetail.jsx';
import HistoriaClinicaForm from './pages/HistoriaClinicaForm.jsx';
import Agenda from './pages/Agenda.jsx';
import Admin from './pages/Admin.jsx';
import Procedimientos from './pages/Procedimientos.jsx';
import Finanzas from './pages/Finanzas.jsx';
import InvoiceForm from './pages/InvoiceForm.jsx';
import InvoiceDetail from './pages/InvoiceDetail.jsx';
import BudgetForm from './pages/BudgetForm.jsx';
import BudgetDetail from './pages/BudgetDetail.jsx';
import PrintReceta from './pages/PrintReceta.jsx';
import PrintPrescripcion from './pages/PrintPrescripcion.jsx';
import PrintInforme from './pages/PrintInforme.jsx';
import PrintHistoriaClinica from './pages/PrintHistoriaClinica.jsx';
import PrintFactura from './pages/PrintFactura.jsx';
import PrintRecibo from './pages/PrintRecibo.jsx';
import PrintPresupuesto from './pages/PrintPresupuesto.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<PacienteForm />} />
          <Route path="/pacientes/:id" element={<PacienteDetail />} />
          <Route path="/pacientes/:id/editar" element={<PacienteForm />} />
          <Route path="/pacientes/:patientId/consulta/nueva" element={<ConsultaForm />} />
          <Route path="/pacientes/:patientId/consulta/:consultationId" element={<ConsultaDetail />} />
          <Route path="/pacientes/:patientId/consulta/:consultationId/editar" element={<ConsultaForm />} />
          <Route path="/pacientes/:patientId/historia-clinica" element={<HistoriaClinicaForm />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/procedimientos" element={<Procedimientos />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/finanzas/factura/nueva" element={<InvoiceForm />} />
          <Route path="/finanzas/factura/:id" element={<InvoiceDetail />} />
          <Route path="/finanzas/presupuesto/nuevo" element={<BudgetForm />} />
          <Route path="/finanzas/presupuesto/:id" element={<BudgetDetail />} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="/print/receta/:consultationId" element={<RequireAuth><PrintReceta /></RequireAuth>} />
        <Route path="/print/prescripcion/:medicationId" element={<RequireAuth><PrintPrescripcion /></RequireAuth>} />
        <Route path="/print/informe/:patientId" element={<RequireAuth><PrintInforme /></RequireAuth>} />
        <Route path="/print/historia-clinica/:patientId" element={<RequireAuth><PrintHistoriaClinica /></RequireAuth>} />
        <Route path="/print/factura/:id" element={<RequireAuth><PrintFactura /></RequireAuth>} />
        <Route path="/print/recibo/:id" element={<RequireAuth><PrintRecibo /></RequireAuth>} />
        <Route path="/print/presupuesto/:id" element={<RequireAuth><PrintPresupuesto /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
