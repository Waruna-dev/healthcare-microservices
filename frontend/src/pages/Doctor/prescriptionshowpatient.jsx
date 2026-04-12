import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, Calendar, User, ArrowLeft, Search, Filter, Download, Eye, Bell, Settings, LogOut, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

const PrescriptionShowPatient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [user, setUser] = useState({ name: 'John Doe', email: 'patient@example.com' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchPrescriptions();
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
  }, []);

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

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // Get patient info from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setPrescriptions([]);
        setFilteredPrescriptions([]);
        setLoading(false);
        return;
      }

      const userData = JSON.parse(storedUser);
      const patient = userData.patient || userData;
      const patientEmail = patient.email;

      // Fetch prescriptions from backend
      const response = await fetch(`http://localhost:5025/api/prescriptions/patient/${patientEmail}`);
      const data = await response.json();

      if (data.success && data.prescriptions) {
        setPrescriptions(data.prescriptions);
        setFilteredPrescriptions(data.prescriptions);
      } else {
        setPrescriptions([]);
        setFilteredPrescriptions([]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
      setFilteredPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = prescriptions.filter(prescription =>
      prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPrescriptions(filtered);
  }, [searchTerm, prescriptions]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadPDF = (prescription) => {
    try {
      // Get patient info
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : {};
      const patient = userData.patient || userData;

      // Generate HTML content for the prescription
      let medicinesHtml = '';
      if (prescription.medicines && prescription.medicines.length > 0) {
        medicinesHtml = prescription.medicines.map((med, index) => 
          '<div class="medication">' +
          '<div class="med-name">' + (index + 1) + '. ' + med.name + '</div>' +
          '<div class="med-details">' +
          '<strong>Dosage:</strong> ' + med.dosage + '<br>' +
          '<strong>Frequency:</strong> ' + med.frequency + '<br>' +
          '<strong>Duration:</strong> ' + med.duration +
          (med.instructions ? '<br><strong>Instructions:</strong> ' + med.instructions : '') +
          '</div>' +
          '</div>'
        ).join('');
      }

      const htmlContent = '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
        '<title>Medical Prescription - ' + prescription.diagnosis + '</title>' +
        '<style>' +
        'body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }' +
        '.header { text-align: center; border-bottom: 2px solid #2980b9; padding-bottom: 20px; margin-bottom: 30px; }' +
        '.title { font-size: 24px; font-weight: bold; color: #2980b9; margin-bottom: 10px; }' +
        '.section { margin-bottom: 25px; }' +
        '.section-title { font-size: 16px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; border-bottom: 1px solid #ecf0f1; padding-bottom: 5px; }' +
        '.info-row { margin-bottom: 8px; font-size: 12px; }' +
        '.medication { margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #3498db; }' +
        '.med-name { font-weight: bold; font-size: 14px; }' +
        '.med-details { font-size: 11px; color: #555; }' +
        '.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center; font-size: 10px; color: #7f8c8d; }' +
        '</style>' +
        '</head>' +
        '<body>' +
        '<div class="header">' +
        '<div class="title">Medical Prescription</div>' +
        '<div>CareSync Medical System</div>' +
        '</div>' +

        '<div class="section">' +
        '<div class="section-title">Doctor Information</div>' +
        '<div class="info-row"><strong>Doctor:</strong> Dr. ' + prescription.doctorName + '</div>' +
        '<div class="info-row"><strong>Specialty:</strong> ' + (prescription.specialty || 'General Practice') + '</div>' +
        '<div class="info-row"><strong>Date:</strong> ' + formatDate(prescription.createdAt || prescription.date) + '</div>' +
        '</div>' +

        '<div class="section">' +
        '<div class="section-title">Patient Information</div>' +
        '<div class="info-row"><strong>Name:</strong> ' + (patient.name || 'Patient') + '</div>' +
        '<div class="info-row"><strong>Email:</strong> ' + (patient.email || 'patient@example.com') + '</div>' +
        '</div>' +

        '<div class="section">' +
        '<div class="section-title">Diagnosis</div>' +
        '<div class="info-row">' + prescription.diagnosis + '</div>' +
        (prescription.symptoms ? '<div style="margin-top: 10px;"><strong>Symptoms:</strong> ' + prescription.symptoms + '</div>' : '') +
        '</div>' +

        (medicinesHtml ? 
        '<div class="section">' +
        '<div class="section-title">Prescribed Medications</div>' +
        medicinesHtml +
        '</div>' : '') +

        (prescription.notes ? 
        '<div class="section">' +
        '<div class="section-title">Doctor\'s Notes</div>' +
        '<div class="info-row">' + prescription.notes + '</div>' +
        '</div>' : '') +

        (prescription.followUpDate ? 
        '<div class="section">' +
        '<div class="section-title">Follow-up Information</div>' +
        '<div class="info-row"><strong>Follow-up Date:</strong> ' + formatDate(prescription.followUpDate) + '</div>' +
        (prescription.followUpNotes ? '<div class="info-row"><strong>Notes:</strong> ' + prescription.followUpNotes + '</div>' : '') +
        '</div>' : '') +

        '<div class="footer">' +
        '<div>Generated by CareSync Medical System</div>' +
        '<div>Date: ' + new Date().toLocaleDateString() + '</div>' +
        '</div>' +
        '</body>' +
        '</html>';

      // Create a blob from the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set download attributes
      const fileName = `prescription_${patient.name || 'patient'}_${formatDate(prescription.createdAt || prescription.date).replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating prescription:', error);
      alert('Failed to generate prescription. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

      {/* Main Content */}
      <div className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
                <p className="text-gray-500 mt-1">View and manage your medical prescriptions</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by doctor name, diagnosis, or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Prescriptions List */}
          <div className="space-y-6">
            {filteredPrescriptions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={40} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">No prescriptions available</h3>
                <p className="text-gray-500 text-sm">You don't have any prescriptions yet. They will appear here when doctors create them for you.</p>
              </div>
            ) : (
              filteredPrescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Prescription Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{prescription.diagnosis}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            {prescription.doctorName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(prescription.createdAt || prescription.date)}
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {prescription.specialty || 'General Practice'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white rounded-lg transition-colors">
                          <Eye size={18} className="text-blue-600" />
                        </button>
                        <button 
                          onClick={() => handleDownloadPDF(prescription)}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={18} className="text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Medications */}
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Prescribed Medications</h4>
                    <div className="space-y-3">
                      {prescription.medicines && prescription.medicines.map((med, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <h5 className="font-medium text-gray-900">{med.name}</h5>
                            <p className="text-sm text-gray-600">{med.dosage} - {med.frequency} - {med.duration}</p>
                            {med.instructions && <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>}
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Active
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Notes */}
                    {prescription.notes && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <h5 className="font-medium text-gray-900 mb-2">Doctor's Notes</h5>
                        <p className="text-sm text-gray-700">{prescription.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionShowPatient;