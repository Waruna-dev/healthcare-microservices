import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DoctorLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authKey, logout } = useAuth(); // Add logout function
  const [menuItems, setMenuItems] = useState([
    { path: '/doctor/dashboard', name: 'Dashboard', icon: '📊' },
    { path: '/doctor/appointments', name: 'Appointments', icon: '📅' },
    { path: '/doctor/patients', name: 'My Patients', icon: '👥' },
    { path: '/doctor/schedule', name: 'Schedule', icon: '📆' },
    { path: '/doctor/weekly-schedule', name: 'Weekly Schedule', icon: '📅' },
    { path: '/doctor/availability', name: 'Availability', icon: '⏰' },
    { path: '/doctor/prescriptions', name: 'Prescriptions', icon: '📋' },
    { path: '/doctor/profile', name: 'My Profile', icon: '👤' },
    { path: '/doctor/settings', name: 'Logout', icon: '⚙️', action: 'logout' }, // Add action for logout
  ]);

  // Reset sidebar state when user changes
  useEffect(() => {
    console.log('DoctorLayout - User changed to:', user?.name);
    // You can add any reset logic here
  }, [user, authKey]);

  const goToHome = () => {
    navigate('/');
  };

  const handleMenuClick = (item) => {
    if (item.action === 'logout') {
      // Handle logout
      logout();
      navigate('/');
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100" key={authKey}> {/* Add key to force re-render */}
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-800 to-indigo-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-blue-700 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🩺</span>
              <span className="font-bold text-lg">CareSync</span>
            </div>
          ) : (
            <span className="text-2xl mx-auto">🩺</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 rounded hover:bg-blue-700"
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Doctor Info */}
        {isSidebarOpen && (
          <div className="p-4 border-b border-blue-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">
                👨‍⚕️
              </div>
              <div>
                <p className="font-semibold text-sm">Dr. {user?.name || 'Doctor'}</p>
                <p className="text-xs text-blue-200">{user?.specialty || user?.specialization || 'Doctor'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center px-4 py-3 transition-colors ${
                location.pathname === item.path
                  ? 'bg-white/20 border-r-4 border-white'
                  : 'hover:bg-blue-700/50'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <span className="text-xl">{item.icon}</span>
              {isSidebarOpen && <span className="ml-3 text-sm">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Home/Exit Button */}
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={goToHome}
            className={`w-full flex items-center px-4 py-2 rounded hover:bg-green-600/20 transition-colors ${
              !isSidebarOpen && 'justify-center'
            }`}
          >
            <span className="text-xl">🏠</span>
            {isSidebarOpen && <span className="ml-3 text-sm">Back to Home</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            {menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">🔔</button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DD'}
              </div>
              <span className="text-sm text-gray-700 hidden md:block">Dr. {user?.name?.split(' ')[0] || 'Doctor'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;