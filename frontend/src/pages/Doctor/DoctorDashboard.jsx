import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { user, authKey } = useAuth(); // Add authKey
  const [currentDoctorId, setCurrentDoctorId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reset component state when user changes
  useEffect(() => {
    // Clear any cached data when user changes
    setLoading(true);
    // Re-fetch doctor-specific data here
    console.log('User changed to:', user?.name);
    setLoading(false);
  }, [user, authKey]); // Re-run when user or authKey changes

  // Rest of your component remains the same...
  const stats = [
    { title: "Today's Appointments", value: "8", icon: "", color: "bg-blue-500" },
    { title: "Total Patients", value: "1,247", icon: "", color: "bg-green-500" },
    { title: "Pending Requests", value: "3", icon: "", color: "bg-yellow-500" },
    { title: "Total Earnings", value: "$12,450", icon: "", color: "bg-purple-500" },
  ];

  const todayAppointments = [
    { id: 1, patient: "Sample Patient 1", time: "09:00 AM", type: "Video Call", status: "confirmed" },
    { id: 2, patient: "Sample Patient 2", time: "10:30 AM", type: "In-person", status: "confirmed" },
    { id: 3, patient: "Sample Patient 3", time: "11:45 AM", type: "Video Call", status: "pending" },
    { id: 4, patient: "Sample Patient 4", time: "02:00 PM", type: "In-person", status: "confirmed" },
    { id: 5, patient: "Sample Patient 5", time: "03:30 PM", type: "Video Call", status: "confirmed" },
  ];

  const recentPatients = [
    { name: "Sample Patient 1", lastVisit: "Mar 28, 2026", condition: "Hypertension", status: "Recovering" },
    { name: "Sample Patient 2", lastVisit: "Mar 25, 2026", condition: "Heart Checkup", status: "Follow-up" },
    { name: "Sample Patient 3", lastVisit: "Mar 22, 2026", condition: "Chest Pain", status: "Pending" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
              <p className="text-gray-500 text-sm">Welcome back, Dr. {user?.name || 'Doctor'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || 'D'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of your JSX remains the same... */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Today's Schedule</h2>
              <button className="text-blue-600 text-sm hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                      {apt.patient.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{apt.patient}</p>
                      <p className="text-sm text-gray-500">{apt.time} • {apt.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {apt.status}
                    </span>
                    {apt.type === "Video Call" && (
                      <button className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm">
                        ▶ Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Overview</h2>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || 'D'
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Dr. {user?.name || 'Doctor Name'}</h3>
                <p className="text-gray-500 text-sm">{user?.specialty || user?.specialization || 'Doctor'}</p>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">4.8 (124 reviews)</span>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <p className="text-gray-600 text-sm">📧 {user?.email || 'doctor@hospital.com'}</p>
              <p className="text-gray-600 text-sm">📞 {user?.phone || '+1 (555) 123-4567'}</p>
              <p className="text-gray-600 text-sm">📍 {user?.address || 'Hospital Address'}</p>
              <p className="text-gray-600 text-sm">⏰ Mon-Fri: 9AM - 5PM</p>
            </div>
            <button 
              onClick={() => {
                const doctorId = user?._id || user?.id;
                if (doctorId) {
                  navigate(`/doctor/edit-profile/${doctorId}`);
                } else {
                  console.error('No doctor ID available for profile editing');
                }
              }}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Recent Patients Table */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Patients</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Patient Name</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Last Visit</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Condition</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((patient, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{patient.name}</td>
                    <td className="p-3 text-gray-600">{patient.lastVisit}</td>
                    <td className="p-3 text-gray-600">{patient.condition}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        patient.status === 'Recovering' ? 'bg-green-100 text-green-700' :
                        patient.status === 'Follow-up' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;