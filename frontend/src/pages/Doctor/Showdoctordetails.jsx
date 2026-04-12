import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Bell, User, Settings, LogOut, X, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { resolveDoctorIdForApi } from '../../utils/doctorId';

const API_BASE = 'http://localhost:5025/api/doctors';
const AVAILABILITY_API = 'http://localhost:5025/api/doctors/availability';

// Sample fallback data
const SAMPLE_DOCTOR = {
  _id: '4',
  name: 'Dr. Kamal Fernando',
  specialty: 'Orthopedics',
  qualifications: ['MBBS', 'MS Ortho', 'Fellowship in Sports Medicine'],
  experience: 15,
  consultationFee: 3000,
  gender: 'male',
  rating: 4.6,
  reviewCount: 143,
  patientsCount: 2400,
  isAvailable: true,
  email: 'kamal.fernando@hospital.com',
  address: 'Nawaloka Hospital, Colombo 03',
  licenseNumber: 'LIC-20948',
  bio: 'Expert in joint replacement, sports injuries and minimally invasive spine surgery. Over 15 years of experience in orthopedic care, having treated thousands of patients across Sri Lanka and abroad. Committed to evidence-based and patient-centered treatment approaches.',
  specializations: ['Joint Replacement', 'Sports Injuries', 'Spine Surgery', 'Fracture Care', 'Arthroscopy', 'Knee & Hip'],
  availability: [
    { day: 'Monday', time: '9:00 AM – 1:00 PM', open: true },
    { day: 'Tuesday', time: '2:00 PM – 6:00 PM', open: true },
    { day: 'Wednesday', time: '', open: false },
    { day: 'Thursday', time: '9:00 AM – 1:00 PM', open: true },
    { day: 'Friday', time: '10:00 AM – 4:00 PM', open: true },
    { day: 'Saturday', time: '9:00 AM – 12:00 PM', open: true },
    { day: 'Sunday', time: '', open: false },
  ],
  profileImage: 'https://randomuser.me/api/portraits/men/52.jpg',
};

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState({ name: 'John Doe', email: 'patient@example.com' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const patient = userData.patient || userData;
        setUser(patient);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        
        // Fetch doctor details
        const doctorRes = await fetch(`${API_BASE}/${id}`);
        if (!doctorRes.ok) throw new Error('Doctor not found');
        const doctorData = await doctorRes.json();
        
        if (doctorData.success && doctorData.doctor) {
          setDoctor(doctorData.doctor);
          
          // Fetch doctor's availability/schedule
          try {
            const scheduleRes = await fetch(`${AVAILABILITY_API}/my?doctorId=${doctorData.doctor._id}`);
            const scheduleData = await scheduleRes.json();
            
            if (scheduleData.success && scheduleData.availability) {
              const activeSchedule = scheduleData.availability.find(s => s.isActive === true);
              if (activeSchedule) {
                setSchedule({
                  price: activeSchedule.price,
                  startTime: activeSchedule.startTime,
                  endTime: activeSchedule.endTime,
                  slotDuration: activeSchedule.slotDuration,
                  availabilityStatus: activeSchedule.availabilityStatus,
                  breakStart: activeSchedule.breakStart,
                  breakEnd: activeSchedule.breakEnd
                });
              }
            }
          } catch (scheduleError) {
            console.error('Error fetching schedule:', scheduleError);
          }
        } else {
          // Fallback to sample data
          setDoctor(SAMPLE_DOCTOR);
        }
      } catch (error) {
        console.error('Error fetching doctor:', error);
        setDoctor(SAMPLE_DOCTOR);
        setError('Unable to connect to server. Showing sample data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorData();
  }, [id]);

  const handleBookAppointment = () => {
    navigate(`/doctor/appointments/book/${doctor._id}`, { state: { doctor, schedule } });
  };

  const handleSendMessage = () => {
    alert('Messaging feature coming soon!');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('appointments');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  const initials = doctor.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="bg-surface min-h-screen font-body text-on-surface antialiased flex flex-col relative overflow-hidden">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-elevated flex items-center gap-3 font-bold text-sm backdrop-blur-md border ${
          toast.type === 'success' 
            ? 'bg-primary/90 text-white border-white/20' 
            : 'bg-error/90 text-white border-white/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          {toast.message}
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-24 border-b border-outline-variant/30 shadow-ambient">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-extrabold text-primary font-headline tracking-tighter hover:opacity-80 transition-opacity">
              CareSync
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-headline font-semibold text-sm text-on-surface-variant">
              <Link 
                to="/patient/dashboard" 
                className={`${location.pathname === '/patient/dashboard' ? 'text-primary border-b-2 border-primary pb-1' : ''} hover:text-primary cursor-pointer transition-colors`}
              >
                Dashboard
              </Link>
              <Link 
                to="/doctor/listing" 
                className={`${location.pathname === '/doctor/listing' ? 'text-primary border-b-2 border-primary pb-1' : ''} hover:text-primary cursor-pointer transition-colors`}
              >
                Specialists
              </Link>
              <Link 
                to="/appointments/all" 
                className={`${location.pathname === '/appointments/all' ? 'text-primary border-b-2 border-primary pb-1' : ''} hover:text-primary cursor-pointer transition-colors`}
              >
                Appointments
              </Link>
              <Link 
                to="/prescriptions" 
                className={`${location.pathname === '/prescriptions' ? 'text-primary border-b-2 border-primary pb-1' : ''} flex items-center gap-2 hover:text-primary cursor-pointer transition-colors`}
              >
                <FileText size={16} />
                Prescriptions
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-all">
              <Bell size={20} />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary transition-all flex items-center justify-center bg-primary-container text-primary font-bold shadow-sm hover:shadow-md"
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0) || <User size={20} />
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-surface-container-lowest rounded-2xl shadow-elevated border border-outline-variant/30 overflow-hidden z-50">
                  <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low/50">
                    <p className="font-bold text-on-surface truncate">{user.name}</p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{user.email || 'Patient Account'}</p>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <Link 
                      to="/profile" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Settings size={18} /> Account Settings
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-error-container/50 text-sm font-bold text-error transition-colors w-full text-left"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors mb-6 group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Doctors
        </button>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
          
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {doctor.profilePicture ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                    <img
                      src={doctor.profilePicture}
                      alt={doctor.name}
                      className="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover border-4 border-white shadow-xl ring-4 ring-blue-100 ring-opacity-50 transform transition-all duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-transparent to-white opacity-10 pointer-events-none"></div>
                  </div>
                ) : null}
                <div className={`w-40 h-40 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center text-white text-4xl md:text-5xl font-bold border-4 border-white shadow-xl ring-4 ring-blue-100 ring-opacity-50 ${doctor.profilePicture ? 'hidden' : 'flex'} transition-all duration-300`}>
                  {initials}
                </div>
                <span className={`absolute bottom-3 right-3 w-6 h-6 rounded-full border-3 border-white shadow-lg transform transition-all duration-300 ${
                  doctor.isAvailable ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${doctor.isAvailable ? 'bg-white' : 'bg-white'} animate-pulse`}></div>
                </span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {doctor.name}
                </h1>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    {doctor.specialty}
                  </span>
                  {doctor.qualifications?.map((q, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                      {q}
                    </span>
                  ))}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4" viewBox="0 0 24 24" fill={star <= Math.round(doctor.rating) ? '#F59E0B' : '#E5E7EB'}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {doctor.rating} · {doctor.reviewCount} reviews
                  </span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-2 border border-gray-100 rounded-xl overflow-hidden">
                  <div className="p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Experience</p>
                    <p className="text-base font-bold text-gray-800">{doctor.experience} yrs</p>
                  </div>
                  <div className="p-3 text-center border-l border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Patients</p>
                    <p className="text-base font-bold text-gray-800">
                      {doctor.patientsCount >= 1000 ? `${(doctor.patientsCount/1000).toFixed(1)}k+` : doctor.patientsCount || '—'}
                    </p>
                  </div>
                  <div className="p-3 text-center border-l border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Reviews</p>
                    <p className="text-base font-bold text-gray-800">{doctor.reviewCount}</p>
                  </div>
                  <div className={`p-3 text-center border-l border-gray-100 ${doctor.isAvailable ? 'bg-blue-50' : ''}`}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Status</p>
                    <p className={`text-sm font-bold ${doctor.isAvailable ? 'text-blue-600' : 'text-gray-500'}`}>
                      {doctor.isAvailable ? 'Available' : 'Busy'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg">
                  👤
                </div>
                <h3 className="text-lg font-semibold text-gray-800">About</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
            </div>

            {/* Specializations */}
            {doctor.specializations?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg">
                    🏥
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Specializations</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {doctor.specializations.map((spec, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg">
                  📋
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Gender</span>
                  <span className="text-sm font-semibold text-gray-700 capitalize">{doctor.gender}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">License No.</span>
                  <span className="text-sm font-semibold text-gray-700">{doctor.licenseNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-semibold text-blue-600">{doctor.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Location</span>
                  <span className="text-sm font-semibold text-gray-700 text-right">{doctor.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Booking CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg">
              <p className="text-xs text-blue-100 uppercase tracking-wider mb-1">Consultation Fee</p>
              <p className="text-3xl font-bold text-white mb-2">
                LKR{schedule?.price?.toLocaleString() || doctor.consultationFee?.toLocaleString() || 'N/A'}
                <span className="text-sm font-medium text-blue-200"> / session</span>
              </p>
              
              {/* Schedule Info */}
              {schedule && schedule.startTime && (
                <div className="mb-4 p-3 bg-white/10 rounded-xl">
                  <div className="flex items-center gap-2 text-white/90 text-xs mb-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Working Hours: {schedule.startTime} - {schedule.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{schedule.slotDuration} min appointments</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleBookAppointment}
                disabled={!doctor.isAvailable}
                className={`w-full py-3 rounded-xl font-semibold transition-all mb-3 ${
                  doctor.isAvailable
                    ? 'bg-white text-blue-600 hover:shadow-lg transform hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                📅 Book Appointment
              </button>
              <button
                onClick={handleSendMessage}
                className="w-full py-3 bg-white/10 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                💬 Send Message
              </button>
            </div>

            {/* Availability Schedule */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg">
                  🗓️
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Weekly Availability</h3>
              </div>
              <div className="space-y-2">
                {doctor.availability?.map(({ day, time, open }) => (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-700 w-24">{day}</span>
                    {open ? (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {time}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 p-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-medium text-gray-700">{doctor.experience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Languages</span>
                  <span className="font-medium text-gray-700">English, Sinhala, Tamil</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Response Time</span>
                  <span className="font-medium text-gray-700">Within 24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DoctorProfile;