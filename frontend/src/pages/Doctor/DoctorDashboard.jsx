import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import featuredImage from '../../assets/images/e328ca1bb1587c9fc9ff58003b49b316.jpg';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { user, authKey } = useAuth(); // Add authKey
  const [currentDoctorId, setCurrentDoctorId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real data states
  const [stats, setStats] = useState([
    { title: "Today's Appointments", value: "0", icon: "calendar", color: "bg-blue-500" },
    { title: "Total Patients", value: "0", icon: "users", color: "bg-green-500" },
    { title: "Pending Requests", value: "0", icon: "clock", color: "bg-yellow-500" },
    { title: "Total Earnings", value: "LKR 0", icon: "dollar", color: "bg-purple-500" },
  ]);
  
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?._id && !user?.id) {
        console.log('No doctor ID available, skipping data fetch');
        setLoading(false);
        return;
      }

      const doctorId = user._id || user.id;
      console.log('Fetching dashboard data for doctor:', doctorId);
      
      try {
        setLoading(true);
        
        // Fetch today's appointments using same pattern as DoctorAppointmentDetail
        try {
          const today = new Date().toISOString().split('T')[0];
          const appointmentsResponse = await fetch(`http://localhost:5015/api/appointments/doctor/${doctorId}`);
          if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            console.log('Appointments response:', appointmentsData);
            
            if (appointmentsData.success && appointmentsData.appointments) {
              const appointments = appointmentsData.appointments || [];
              
              // Filter for today's appointments
              const todayAppointments = appointments.filter(apt => {
                const aptDate = new Date(apt.date || apt.createdAt).toISOString().split('T')[0];
                return aptDate === today;
              });
              
              setTodayAppointments(todayAppointments);
              
              // Update today's appointments count
              setStats(prev => prev.map(stat => 
                stat.title === "Today's Appointments" 
                  ? { ...stat, value: todayAppointments.length.toString() }
                  : stat
              ));
            }
          }
        } catch (error) {
          console.error('Error fetching appointments:', error);
        }

        // Fetch doctor stats
        try {
          const statsResponse = await fetch(`http://localhost:5025/api/doctors/${doctorId}/stats`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.success && statsData.data) {
              const data = statsData.data;
              setStats([
                { title: "Today's Appointments", value: data.todayAppointments || "0", icon: "calendar", color: "bg-blue-500" },
                { title: "Total Patients", value: data.totalPatients || "0", icon: "users", color: "bg-green-500" },
                { title: "Pending Requests", value: data.pendingRequests || "0", icon: "clock", color: "bg-yellow-500" },
                { title: "Total Earnings", value: data.totalEarnings ? `LKR ${data.totalEarnings.toLocaleString()}` : "LKR 0", icon: "dollar", color: "bg-purple-500" },
              ]);
            }
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }

        // Fetch recent patients
        try {
          const patientsResponse = await fetch(`http://localhost:5025/api/doctors/${doctorId}/patients`);
          if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json();
            if (patientsData.success) {
              setRecentPatients(patientsData.data || []);
            }
          }
        } catch (error) {
          console.error('Error fetching patients:', error);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authKey]);

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
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {(() => {
                  const hour = new Date().getHours();
                  let greeting = 'Good ';
                  if (hour < 12) greeting += 'Morning';
                  else if (hour < 17) greeting += 'Afternoon';
                  else greeting += 'Evening';
                  return `${greeting}, Dr. ${user?.name || 'Doctor'}`;
                })()}
              </div>
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
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <span key={i} className="text-yellow-400 text-sm">&#9733;</span>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">4.8 (124 reviews)</span>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <p className="text-gray-600 text-sm">{user?.email || 'doctor@hospital.com'}</p>
              <p className="text-gray-600 text-sm">{user?.phone || '+1 (555) 123-4567'}</p>
              <p className="text-gray-600 text-sm">{user?.address || 'Hospital Address'}</p>
              <p className="text-gray-600 text-sm">Mon-Fri: 9AM - 5PM</p>
            </div>
            <button 
              onClick={() => {
                navigate('/doctor/profile/edit');
              }}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          </div>

          {/* Calendar Component */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Calendar</h2>
            <div className="grid grid-cols-7 gap-1">
              {/* Calendar Header */}
              <div className="text-center text-sm font-semibold text-gray-600 py-2">Sun</div>
              <div className="text-center text-sm font-semibold text-gray-600 py-2">Mon</div>
              <div className="text-center text-sm font-semibold text-gray-600 py-2">Tue</div>
              <div className="text-center text-sm font-semibold text-gray-600 py-2">Wed</div>
              <div className="text-center text-sm font-semibold text-gray-600 py-2">Thu</div>
              <div className="text-center text-sm font-semibold text-gray-600 py-2">Fri</div>
              <div className="text-center text-sm font-semibold text-gray-600 py-2">Sat</div>
              
              {/* Calendar Days - Simple implementation */}
              {[...Array(35)].map((_, index) => {
                const day = index - 2; // Adjust to start from appropriate day
                const isToday = day === new Date().getDate();
                const isCurrentMonth = day > 0 && day <= 31;
                
                return (
                  <div
                    key={index}
                    className={`text-center py-2 text-sm cursor-pointer rounded transition-colors ${
                      isToday 
                        ? 'bg-blue-500 text-white font-bold' 
                        : isCurrentMonth 
                          ? 'text-gray-700 hover:bg-gray-100' 
                          : 'text-gray-300'
                    }`}
                  >
                    {isCurrentMonth ? day : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Featured Image Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Featured Gallery</h2>
          <div className="relative overflow-hidden rounded-lg bg-gray-100">
            <img 
              src={featuredImage} 
              alt="Featured Gallery"
              className="w-full h-80 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;