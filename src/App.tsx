import { HashRouter, Routes, Route } from 'react-router-dom';
import { PatientProvider } from './store/PatientContext';
import PatientFlow from './components/PatientFlow/PatientFlow';
import DoctorDashboard from './components/Doctor/DoctorDashboard';

function App() {
  return (
    <PatientProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<PatientFlow />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
        </Routes>
      </HashRouter>
    </PatientProvider>
  );
}

export default App;
