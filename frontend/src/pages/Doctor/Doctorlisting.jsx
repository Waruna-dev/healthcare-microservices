import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveDoctorIdForApi } from '../../utils/doctorId';

const API_BASE = 'http://localhost:5025/api/doctors';
const AVAILABILITY_API = 'http://localhost:5025/api/doctors/availability';

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

const DoctorListing = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [hoveredDoctor, setHoveredDoctor] = useState(null);

  // Fetch doctors from API
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      // Fetch all doctors
      const response = await fetch(`${API_BASE}?limit=1000`);
      const data = await response.json();
      
      if (data.success && data.doctors) {
        // Fetch each doctor's availability/schedule
        const doctorsWithSchedule = await Promise.all(
          data.doctors.map(async (doctor) => {
            try {
              const scheduleRes = await fetch(`${AVAILABILITY_API}/my?doctorId=${doctor._id}`);
              const scheduleData = await scheduleRes.json();
              
              let schedule = null;
              if (scheduleData.success && scheduleData.availability) {
                // Get the first active schedule to display pricing
                const activeSchedule = scheduleData.availability.find(s => s.isActive === true);
                if (activeSchedule) {
                  schedule = {
                    price: activeSchedule.price,
                    startTime: activeSchedule.startTime,
                    endTime: activeSchedule.endTime,
                    slotDuration: activeSchedule.slotDuration,
                    availabilityStatus: activeSchedule.availabilityStatus
                  };
                }
              }
              
              return {
                ...doctor,
                // Map database fields to component fields
                name: doctor.name,
                specialty: doctor.specialty,
                experience: doctor.experience,
                consultationFee: doctor.consultationFee,
                gender: doctor.gender,
                rating: doctor.rating || 0,
                reviewCount: doctor.totalRatings || 0,
                isAvailable: doctor.isAvailable,
                bio: doctor.bio,
                profileImage: doctor.profilePicture,
                email: doctor.email,
                phone: doctor.phone,
                address: doctor.address,
                schedule
              };
            } catch (error) {
              console.error(`Error fetching schedule for doctor ${doctor._id}:`, error);
              return {
                ...doctor,
                // Map database fields to component fields
                name: doctor.name,
                specialty: doctor.specialty,
                experience: doctor.experience,
                consultationFee: doctor.consultationFee,
                gender: doctor.gender,
                rating: doctor.rating || 0,
                reviewCount: doctor.totalRatings || 0,
                isAvailable: doctor.isAvailable,
                bio: doctor.bio,
                profileImage: doctor.profilePicture,
                email: doctor.email,
                phone: doctor.phone,
                address: doctor.address
              };
            }
          })
        );
        
        setDoctors(doctorsWithSchedule);
        setError(null); // Clear any previous errors
      } else {
        setError('Failed to fetch doctors from database');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate star rating based on experience
  const calculateExperienceRating = (experience) => {
    const years = parseInt(experience) || 0;
    if (years === 0) return 0;
    if (years <= 2) return 1;
    if (years <= 5) return 2;
    if (years <= 10) return 3;
    if (years <= 15) return 4;
    return 5;
  };

  // Get unique specialties for filter
  const specialties = useMemo(() => {
    const unique = [...new Set(doctors.map(d => d.specialty))];
    return unique.sort();
  }, [doctors]);

  // Filter doctors based on search, specialty, and availability
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doctor.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpecialty = selectedSpecialty === '' || doctor.specialty === selectedSpecialty;
      
      const matchesAvailability = selectedAvailability === '' || 
                                 (selectedAvailability === 'available' && doctor.isAvailable) ||
                                 (selectedAvailability === 'unavailable' && !doctor.isAvailable);
      
      return matchesSearch && matchesSpecialty && matchesAvailability;
    });
  }, [doctors, searchTerm, selectedSpecialty, selectedAvailability]);

  const handleViewProfile = (doctorId) => {
    navigate(`/doctor/${doctorId}`);
  };

  const handleBookAppointment = (doctor) => {
    navigate(`/appointments/book/${doctor._id}`, { state: { doctor } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">
            Our Specialists
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Meet Our Doctors
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {filteredDoctors.length} qualified healthcare professionals ready to provide you with the best medical care
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            {error}
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Specialty Filter */}
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              <option value="">All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>

            {/* Availability Filter */}
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.map((doctor) => {
            const colors = specialtyColors[doctor.specialty] || specialtyColors.default;
            const isHovered = hoveredDoctor === doctor._id;
            
            return (
              <div
                key={doctor._id}
                onMouseEnter={() => setHoveredDoctor(doctor._id)}
                onMouseLeave={() => setHoveredDoctor(null)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Card Top Gradient */}
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <div className="p-5">
                  {/* Header: Avatar and Basic Info */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={doctor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name.replace('Dr. ', ''))}&background=0F6E56&color=fff&size=128`}
                        alt={doctor.name}
                        className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-md"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name.replace('Dr. ', ''))}&background=0F6E56&color=fff&size=128`;
                        }}
                      />
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        doctor.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {doctor.name}
                      </h3>
                      
                      {/* Specialty Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${colors.bg} ${colors.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {doctor.specialty}
                      </span>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={star <= calculateExperienceRating(doctor.experience) ? '#F59E0B' : '#E5E7EB'}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">
                          {doctor.experience || 0} yrs exp.
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bio */}
                  <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">
                    {doctor.bio || `Experienced ${doctor.specialty} specialist with ${doctor.experience || 0}+ years of practice.`}
                  </p>
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 mb-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Experience</p>
                      <p className="text-sm font-semibold text-gray-800">{doctor.experience || 0} yrs</p>
                    </div>
                    <div className="text-center border-l border-r border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Fee</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        LKR{doctor.schedule?.price?.toLocaleString() || doctor.consultationFee?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Status</p>
                      <p className={`text-xs font-semibold ${doctor.isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                        {doctor.isAvailable ? 'Available' : 'Unavailable'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Schedule Info */}
                  {doctor.schedule && doctor.schedule.startTime && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{doctor.schedule.startTime} - {doctor.schedule.endTime}</span>
                      <span className="mx-1">•</span>
                      <span>{doctor.schedule.slotDuration} min slots</span>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewProfile(doctor._id)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleBookAppointment(doctor)}
                      disabled={!doctor.isAvailable}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        doctor.isAvailable
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-md'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Empty State */}
        {filteredDoctors.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No doctors found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorListing;