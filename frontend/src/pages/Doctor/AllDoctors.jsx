import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5025/api/doctors';

// Specialty color mapping
const specialtyColors = {
  Cardiology: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Neurology: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  Pediatrics: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Orthopedics: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  Dermatology: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
  Psychiatry: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Gynecology: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  'Internal Medicine': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  Ophthalmology: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  Radiology: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  Surgery: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Oncology: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
  default: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
};

const AllDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  // Fetch doctors from API
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success && data.doctors) {
        console.log('Doctors with profilePicture:', data.doctors.map(d => ({ 
          name: d.name, 
          profilePicture: d.profilePicture,
          hasProfile: !!d.profilePicture 
        })));
        setDoctors(data.doctors);
      } else {
        setError('Failed to fetch doctors');
      }
    } catch (err) {
      setError('Error fetching doctors: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter doctors based on search and specialty
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  // Get unique specialties for filter
  const specialties = [...new Set(doctors.map(doctor => doctor.specialty).filter(Boolean))];

  const getSpecialtyColor = (specialty) => {
    return specialtyColors[specialty] || specialtyColors.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Doctors</h1>
        <p className="text-gray-600">View and manage all registered doctors</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search doctors by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => {
          const colors = getSpecialtyColor(doctor.specialty);
          return (
            <div
              key={doctor._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
            >
              <div className="flex items-center mb-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={doctor.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name?.replace('Dr. ', '') || 'Doctor')}&background=0F6E56&color=fff&size=128`}
                    alt={doctor.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name?.replace('Dr. ', '') || 'Doctor')}&background=0F6E56&color=fff&size=128`;
                    }}
                  />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                  <p className="text-sm text-gray-600">{doctor.email}</p>
                </div>
              </div>

              <div className="mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                  <span className={`w-2 h-2 ${colors.dot} rounded-full mr-1.5`}></span>
                  {doctor.specialty || 'General Practice'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <span className="font-medium">{doctor.experience || 'N/A'} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Rating:</span>
                  <span className="font-medium">⭐ {doctor.rating || '4.5'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${doctor.isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                    {doctor.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/doctor/${doctor._id}`)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  View Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDoctors.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-2 text-lg font-medium">No doctors found</p>
            <p className="mt-1">Try adjusting your search or filter criteria</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllDoctors;
