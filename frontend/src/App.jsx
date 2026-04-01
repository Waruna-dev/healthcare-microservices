import { BrowserRouter, Routes, Route } from 'react-router-dom';

// --- Patient Pages ---
import Home from './pages/Home';
import PatientRegister from './pages/patient/PatientRegister';
import PatientLogin from './pages/patient/PatientLogin';
import PatientDashboard from './pages/patient/PatientDashboard'; 
import PatientProfile from './pages/patient/PatientProfile'; 

// --- Admin Pages (NEW) ---
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Home />} />

        {/* Patient Routes */}
        <Route path="/register" element={<PatientRegister />} />
        <Route path="/login" element={<PatientLogin />} />
        <Route path="/dashboard" element={<PatientDashboard />} /> 
        <Route path="/profile" element={<PatientProfile />} /> 

        {/* Admin Routes (NEW) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;