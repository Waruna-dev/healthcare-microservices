import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Clock, Calendar, Award, 
  Edit, Stethoscope, Building, Briefcase, Star, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorProfile();
  }, [user]);

  const fetchDoctorProfile = async () => {
    // Use current user data with actual values
    if (user) {
      setDoctor({
        name: user.name || 'Dr. Malithi Jayawardena',
        email: user.email || 'malithi@doctor.com',
        phone: user.phone || '+94 77 123 4567',
        specialty: user.specialty || 'Cardiologist',
        hospital: user.hospital || 'Colombo General Hospital',
        address: user.address || 'No. 123, Kynsey Road, Colombo 07, Sri Lanka',
        experience: user.experience || '8+',
        consultationFee: user.consultationFee || '3500',
        rating: user.rating || '4.9',
        workingHours: user.workingHours || {
          monday: '8:00 AM - 4:00 PM',
          tuesday: '8:00 AM - 4:00 PM',
          wednesday: '8:00 AM - 12:00 PM',
          thursday: '8:00 AM - 4:00 PM',
          friday: '8:00 AM - 4:00 PM',
          saturday: '9:00 AM - 1:00 PM',
          sunday: 'Closed'
        },
        qualifications: user.qualifications || 'MBBS (Colombo), MD (Cardiology), FRCP (Edinburgh)',
        bio: user.bio || 'Dr. Malithi Jayawardena is a highly experienced cardiologist with over 8 years of practice in treating heart diseases. Specialized in interventional cardiology and preventive heart care. Committed to providing compassionate, patient-centered care using the latest medical technologies and evidence-based treatments.'
      });
      setLoading(false);
      return;
    }

    // Fallback to API if user context is not available
    try {
      const token = localStorage.getItem('doctorToken');
      
      const response = await fetch('/api/doctors/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDoctor(data.doctor);
      } else {
        console.error('Failed to fetch profile:', data.message);
        // Use localStorage as fallback
        const localDoctor = localStorage.getItem('doctorInfo');
        if (localDoctor) {
          const parsed = JSON.parse(localDoctor);
          setDoctor(parsed);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use localStorage as fallback
      const localDoctor = localStorage.getItem('doctorInfo');
      if (localDoctor) {
        const parsed = JSON.parse(localDoctor);
        setDoctor(parsed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigate('/doctor/profile/edit');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <User className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Profile Overview</h1>
            </div>
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-center relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="w-28 h-28 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-5xl font-bold text-white mx-auto mb-4 shadow-2xl border-4 border-white/30">
                    {doctor?.name?.charAt(0) || 'D'}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Dr. {doctor?.name || 'Doctor'}</h2>
                  <p className="text-blue-100 text-lg mb-4">{doctor?.specialty || 'General Practitioner'}</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1 bg-yellow-500/40 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/30">
                      <Star className="w-5 h-5 text-yellow-300 fill-current" />
                      <span className="text-yellow-300 font-semibold">{doctor?.rating || '4.9'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                      <Award className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold">{doctor?.experience || '8+'} Years</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="p-6 space-y-4">
                <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <span className="text-gray-700 font-medium">{doctor?.email || 'malithi@doctor.com'}</span>
                  </div>
                </div>
                <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <span className="text-gray-700 font-medium">{doctor?.phone || '+94 77 123 4567'}</span>
                  </div>
                </div>
                <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Building className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hospital</p>
                    <span className="text-gray-700 font-medium">{doctor?.hospital || 'Colombo General Hospital'}</span>
                  </div>
                </div>
                <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <span className="text-gray-700 font-medium text-sm">{doctor?.address || 'Colombo, Sri Lanka'}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 p-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl text-center border border-blue-200">
                  <Briefcase className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{doctor?.experience || '8+'}</p>
                  <p className="text-sm text-gray-600">Years Experience</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Working Hours */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Working Hours</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctor?.workingHours ? (
                  Object.entries(doctor.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700 capitalize">{day}</span>
                      <span className="text-gray-600">{hours}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-500 py-8">
                    Working hours not set
                  </div>
                )}
              </div>
            </div>

            {/* Hospital Address */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Hospital Address</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{doctor?.hospital || 'Colombo General Hospital'}</h4>
                <p className="text-gray-700">{doctor?.address || 'No. 123, Kynsey Road, Colombo 07, Sri Lanka'}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{doctor?.phone || '+94 11 269 1111'}</span>
                </div>
              </div>
            </div>

            {/* Professional Bio */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Stethoscope className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Professional Bio</h3>
              </div>
              
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {doctor?.bio || 'Experienced medical professional dedicated to providing quality healthcare services with compassion and expertise.'}
                </p>
              </div>
            </div>

            {/* Qualifications */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Qualifications</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  {doctor?.qualifications || 'MBBS (Colombo), MD (General Medicine)'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;