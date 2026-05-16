import { Component, type ReactNode } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { PatientProvider } from './store/PatientContext';
import PatientFlow from './components/PatientFlow/PatientFlow';
import DoctorLayout from './components/Doctor/DoctorLayout';
import DashboardHome from './components/Doctor/dashboard/DashboardHome';
import PatientsView from './components/Doctor/patients/PatientsView';
import PatientDetail from './components/Doctor/patients/PatientDetail';
import StatsPage from './components/Doctor/stats/StatsPage';
import AgendaView from './components/Doctor/agenda/AgendaView';
import SettingsPage from './components/Doctor/settings/SettingsPage';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fff0f0', minHeight: '100vh' }}>
          <h2 style={{ color: '#cc0000' }}>Error de aplicación</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#cc0000', fontSize: 13 }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
    <PatientProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<PatientFlow />} />
          <Route path="/doctor" element={<DoctorLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="pacientes" element={<PatientsView />}>
              <Route path=":id" element={<PatientDetail />} />
            </Route>
            <Route path="estadisticas" element={<StatsPage />} />
            <Route path="agenda" element={<AgendaView />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </PatientProvider>
    </ErrorBoundary>
  );
}

export default App;
