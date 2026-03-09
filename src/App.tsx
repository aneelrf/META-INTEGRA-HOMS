import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PatientProvider } from './store/PatientContext';
import PatientFlow from './components/PatientFlow/PatientFlow';
import DoctorDashboard from './components/Doctor/DoctorDashboard';

function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PatientFlow />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
        </Routes>
      </BrowserRouter>
    </PatientProvider>
  );
}

export default App;
