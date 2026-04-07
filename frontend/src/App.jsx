import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout";

import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactSupport from "./pages/ContactSupport";
import Features from "./pages/Features";
import Integration from "./pages/Integration";
import Security from "./pages/Security";

// --- Patient Pages ---
import PatientRegister from "./pages/patient/PatientRegister";
import PatientLogin from "./pages/patient/PatientLogin";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProfile from "./pages/patient/PatientProfile";
import AllAppointments from "./pages/patient/AllAppointments";

// --- Doctor Pages ---
import DoctorRegister from "./pages/Doctor/DoctorRegister";
import DoctorLayout from "./pages/Doctor/DoctorLayout";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import AllDoctors from "./pages/Doctor/AllDoctors";
import DoctorProfile from "./pages/Doctor/DoctorProfile";
import DoctorProfileEdit from "./pages/Doctor/Doctorprofile_edit";
import DoctorSchedule from "./pages/Doctor/DoctorSchedule";
import WeeklySchedule from "./pages/Doctor/WeeklySchedule";
import SlotDisplay from "./pages/Doctor/SlotDisplay";
import DoctorListing from "./pages/Doctor/Doctorlisting";
import ShowDoctorDetails from "./pages/Doctor/Showdoctordetails";
import DoctorAppointmentDetail from "./pages/Doctor/DoctorAppointmentDetail";
import DoctorAppointments from "./pages/Doctor/DoctorAppointments";

// --- Admin Pages ---
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

// --- Payment Pages ---
import PaymentPage from "./pages/payment/PaymentPage";
import PaymentDashboard from "./pages/payment/paymentAdminDashboard";

// --- Other ---
import AppointmentBook from "./components/appointment/AppointmentBooking";
import TelemedicineRoom from "./pages/telemedicine/TelemedicineRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes (Navbar + Footer) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/support" element={<ContactSupport />} />
          <Route path="/features" element={<Features />} />
          <Route path="/security" element={<Security />} />
          <Route path="/integration" element={<Integration />} />
          <Route path="/doctor/listing" element={<DoctorListing />} />
        </Route>

        {/* Patient Routes */}
        <Route path="/register" element={<PatientRegister />} />
        <Route path="/login" element={<PatientLogin />} />
        <Route path="/dashboard" element={<PatientDashboard />} />
        <Route path="/profile" element={<PatientProfile />} />
        <Route path="/appointments/all" element={<AllAppointments />} />
        <Route path="/appointments/book/:id" element={<AppointmentBook />} />
        <Route path="/telemedicine/:id" element={<TelemedicineRoom />} />

        {/* Doctor Public Routes */}
        <Route path="/doctor/register" element={<DoctorRegister />} />
        <Route path="/doctor/:id" element={<ShowDoctorDetails />} />

        {/* Doctor Panel (with Sidebar Layout) */}
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="doctors" element={<AllDoctors />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="edit-profile/:doctorId" element={<DoctorProfileEdit />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="weekly-schedule" element={<WeeklySchedule />} />
          <Route path="slots/:date" element={<SlotDisplay />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="appointments/:id" element={<DoctorAppointmentDetail />} />
          <Route path="patients" element={<div>My Patients Page</div>} />
          <Route path="availability" element={<div>Availability Page</div>} />
          <Route path="prescriptions" element={<div>Prescriptions Page</div>} />
          <Route path="settings" element={<div>Settings Page</div>} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Payment Routes */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/:appointmentId" element={<PaymentPage />} />
        <Route path="/payment/dashboard" element={<PaymentDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;