import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PatientRegister from './pages/patient/PatientRegister';
import PatientLogin from './pages/patient/PatientLogin';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorRegister from './pages/Doctor/DoctorRegister';
import DoctorLayout from './pages/Doctor/DoctorLayout';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import AllDoctors from './pages/Doctor/AllDoctors';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorSchedule from './pages/Doctor/DoctorSchedule';
import WeeklySchedule from './pages/Doctor/WeeklySchedule';
import SlotDisplay from './pages/Doctor/SlotDisplay';
import DoctorListing from './pages/Doctor/Doctorlisting';
import ShowDoctorDetails from './pages/Doctor/Showdoctordetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<PatientRegister />} />
        <Route path="/login" element={<PatientLogin />} />
        <Route path="/dashboard" element={<PatientDashboard />} />
        
        {/* Doctor Routes - NO LOGIN REQUIRED */}
        <Route path="/doctor/register" element={<DoctorRegister />} />
        <Route path="/doctor/listing" element={<DoctorListing />} />
        <Route path="/doctor/:id" element={<ShowDoctorDetails />} />
        
        {/* Doctor Panel with Sidebar - DIRECT ACCESS, NO AUTH */}
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="doctors" element={<AllDoctors />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="weekly-schedule" element={<WeeklySchedule />} />
          <Route path="slots/:date" element={<SlotDisplay />} />
          <Route path="appointments" element={<div>Appointments Page</div>} />
          <Route path="patients" element={<div>My Patients Page</div>} />
          <Route path="availability" element={<div>Availability Page</div>} />
          <Route path="prescriptions" element={<div>Prescriptions Page</div>} />
          <Route path="settings" element={<div>Settings Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;