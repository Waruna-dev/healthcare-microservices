// src/pages/doctor/DoctorAppointments.jsx - Complete working version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, User, Stethoscope, CheckCircle, XCircle, 
  Eye, Filter, ChevronDown, Search, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const statusFilters = [
    { value: 'all', label: 'All Appointments', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'accepted', label: 'Accepted', color: 'blue' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'cancelled', label: 'Cancelled', color: 'gray' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Fetch appointments using public endpoint
  const fetchAppointments = async () => {
    const doctorId = user?._id || user?.id;
    console.log('🔍 Doctor ID:', doctorId);
    
    if (!doctorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = `http://localhost:5015/api/appointments/doctor/public/${doctorId}`;
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('📡 Response:', data);
      
      if (data.success && data.appointments) {
        setAppointments(data.appointments);
        setFilteredAppointments(data.appointments);
      } else {
        setAppointments([]);
        setFilteredAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // Filter appointments
  useEffect(() => {
    let filtered = [...appointments];
    
    if (filter !== 'all') {
      filtered = filtered.filter(apt => apt.status === filter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.symptoms?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredAppointments(filtered);
  }, [filter, searchTerm, appointments]);

  // Accept appointment
  const handleAccept = async (appointment) => {
    console.log('📡 Accepting appointment:', appointment._id);
    setProcessingId(appointment._id);
    
    try {
      const url = `http://localhost:5015/api/appointments/accept/${appointment._id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Appointment accepted successfully!');
        fetchAppointments();
      } else {
        alert('❌ Failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Reject appointment
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setProcessingId(selectedAppointment._id);
    
    try {
      const url = `http://localhost:5015/api/appointments/reject/${selectedAppointment._id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowRejectModal(false);
        setRejectionReason('');
        alert('✅ Appointment rejected successfully!');
        fetchAppointments();
      } else {
        alert('❌ Failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusCount = (statusValue) => {
    if (statusValue === 'all') return appointments.length;
    return appointments.filter(apt => apt.status === statusValue).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 mt-1">Manage your patient appointments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusFilters.map((status) => (
          <button
            key={status.value}
            onClick={() => setFilter(status.value)}
            className={`p-4 rounded-xl text-center transition-all ${
              filter === status.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
            }`}
          >
            <p className="text-2xl font-bold">{getStatusCount(status.value)}</p>
            <p className="text-xs mt-1">{status.label}</p>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name, email or symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {filter === 'all' ? 'All Appointments' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}
            <span className="ml-2 text-sm text-gray-500">({filteredAppointments.length})</span>
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-1">No Appointments Found</h3>
              <p className="text-sm text-gray-500">No appointments match your filter</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Patient Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {appointment.patientName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                      <p className="text-sm text-gray-500">{appointment.patientEmail}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(appointment.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appointment.startTime} - {appointment.endTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowModal(true);
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>

                      {appointment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAccept(appointment)}
                            disabled={processingId === appointment._id}
                            className="px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowRejectModal(true);
                            }}
                            className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Symptoms Preview */}
                {appointment.symptoms && (
                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium">Symptoms:</span> {appointment.symptoms.substring(0, 100)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-medium">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Patient Email</p>
                  <p className="font-medium">{selectedAppointment.patientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(selectedAppointment.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Consultation Fee</p>
                  <p className="font-medium text-green-600">LKR {selectedAppointment.consultationFee}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium capitalize ${selectedAppointment.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {selectedAppointment.status}
                  </p>
                </div>
              </div>
              
              {selectedAppointment.symptoms && (
                <div>
                  <p className="text-sm text-gray-500">Symptoms</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedAppointment.symptoms}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Appointment</h2>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting appointment with <strong>{selectedAppointment.patientName}</strong>
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={processingId === selectedAppointment._id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
              >
                {processingId === selectedAppointment._id ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;