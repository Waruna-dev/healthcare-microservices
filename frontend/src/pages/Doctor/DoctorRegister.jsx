import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import img1 from '../../assets/images/1e73cdf4e73454e4db41a709b9163cac.jpg';
import img2 from '../../assets/images/9339706cc8079c7b463d4fb452f097d3.jpg';

const DoctorRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    phone: '',
    licenseNumber: '',
    experience: '',
    consultationFee: '',
    address: '',
    bio: '',
    gender: ''
  });
  const [profileImage, setProfileImage] = useState(null);

  const specialties = [
    'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics',
    'Dermatology', 'Psychiatry', 'Radiology', 'Surgery',
    'Oncology', 'Gynecology', 'Urology', 'Ophthalmology',
    'Emergency Medicine', 'Family Medicine', 'Internal Medicine'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage('');
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setProfileImage(file);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Generate a random password since it's required by backend
      const randomPassword = Math.random().toString(36).slice(-8) + '!@#' + Date.now();
      
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('password', randomPassword);
      payload.append('specialty', formData.specialty);
      payload.append('phone', formData.phone);
      payload.append('licenseNumber', formData.licenseNumber);
      payload.append('experience', String(parseInt(formData.experience) || 0));
      payload.append('consultationFee', String(parseFloat(formData.consultationFee) || 0));
      payload.append('address', formData.address || '');
      payload.append('bio', formData.bio || '');
      payload.append('gender', formData.gender || '');
      if (profileImage) {
        payload.append('profileImage', profileImage);
      }

      const response = await fetch('/api/doctors/register', {
        method: 'POST',
        body: payload
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Doctor registered successfully! Redirecting to login...');
        // ✅ FIXED: Redirect to /doctor/login (not /login)
        setTimeout(() => navigate('/doctor/login'), 2000);
      } else {
        setError(data.message || data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Cannot connect to server. Please make sure backend is running on port 5025');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* LEFT SIDE - IMAGES & INFO */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-12 flex flex-col justify-between">
              <div 
                className="absolute inset-0 opacity-10 bg-cover bg-center"
                style={{ backgroundImage: `url(${img2})` }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-12">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl">🩺</span>
                  </div>
                  <span className="text-white text-xl font-bold">CareSync</span>
                </div>

                <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={img1} 
                    alt="Doctor" 
                    className="w-full h-64 object-cover transform hover:scale-105 transition duration-500"
                  />
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Join Our Medical Community
                </h1>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  Become part of a network that connects talented doctors with patients who need expert care.
                </p>

                <div className="space-y-3">
                  {[
                    '✨ Modern digital practice management',
                    '📱 Seamless patient communication',
                    '💳 Integrated payment solutions',
                    '🏆 24/7 professional support'
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center space-x-3 text-white/90">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 mt-12 pt-6 border-t border-white/20">
                <p className="text-blue-200 text-xs">
                  Join 5000+ healthcare professionals already on our platform
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - FORM */}
            <div className="p-8 lg:p-12 overflow-y-auto max-h-[90vh]">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
                <p className="text-gray-500">Fill in your professional details to get started</p>
              </div>

              {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                  {message}
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="doctor@hospital.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Specialty *
                    </label>
                    <select
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Specialty</option>
                      {specialties.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="LIC-12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                      min="0"
                      max="60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Consultation Fee (Rs.)
                    </label>
                    <input
                      type="number"
                      name="consultationFee"
                      value={formData.consultationFee}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="150"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Hospital address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Professional Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Share your experience, education, and specialties..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Registering...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>

                {/* ✅ FIXED: Sign In link now goes to /doctor/login */}
                <div className="text-center pt-4">
                  <p className="text-gray-500 text-sm">
                    Already have an account?{' '}
                    <Link to="/doctor/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;