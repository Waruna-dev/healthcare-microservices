import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
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
    address: '',
    about: '',
    gender: '',
    qualifications: [''],
    specializations: ['']
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const specialties = [
    'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics',
    'Dermatology', 'Psychiatry', 'Radiology', 'Surgery',
    'Oncology', 'Gynecology', 'Urology', 'Ophthalmology',
    'Emergency Medicine', 'Family Medicine', 'Internal Medicine'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields for qualifications and specializations
    if (name.startsWith('qualification') || name.startsWith('specialization')) {
      const [fieldName, index] = name.split('_');
      const fieldIndex = parseInt(index);
      
      if (name.startsWith('qualification')) {
        const updatedQualifications = [...formData.qualifications];
        updatedQualifications[fieldIndex] = value;
        setFormData(prev => ({ ...prev, qualifications: updatedQualifications }));
      } else if (name.startsWith('specialization')) {
        const updatedSpecializations = [...formData.specializations];
        updatedSpecializations[fieldIndex] = value;
        setFormData(prev => ({ ...prev, specializations: updatedSpecializations }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setMessage('');
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setProfileImage(file);
    setMessage('');
    setError('');
    
    // Auto-upload image when selected
    if (file) {
      uploadToCloudinary(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    setImageUploading(true);
    setError('');
    
    try {
      // First try without preset to see if the issue is preset-related
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_unsigned");
      formData.append("folder", "doctor_profiles"); // Organize images in folder
      
      console.log('Uploading to Cloudinary...');
      
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dsvrla6zk/image/upload",
        { method: "POST", body: formData }
      );
      
      const data = await res.json();
      console.log('Cloudinary response:', data);
      
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        setMessage('✅ Image uploaded successfully!');
      } else {
        console.error('Cloudinary error details:', data);
        throw new Error(data.error?.message || `Upload failed: ${res.status}`);
      }
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      setError(`Failed to upload image: ${err.message}. You can continue without an image.`);
      setImageUrl('');
    } finally {
      setImageUploading(false);
    }
  };

  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, '']
    }));
  };

  const removeQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const addSpecialization = () => {
    setFormData(prev => ({
      ...prev,
      specializations: [...prev.specializations, '']
    }));
  };

  const removeSpecialization = (index) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('specialty', formData.specialty);
      payload.append('phone', formData.phone);
      payload.append('licenseNumber', formData.licenseNumber);
      payload.append('experience', String(parseInt(formData.experience) || 0));
      payload.append('address', formData.address || '');
      payload.append('about', formData.about || '');
      payload.append('gender', formData.gender || '');
      
      // Add qualifications as JSON string
      const validQualifications = formData.qualifications.filter(q => q.trim() !== '');
      payload.append('qualifications', JSON.stringify(validQualifications));
      
      // Add specializations as JSON string
      const validSpecializations = formData.specializations.filter(s => s.trim() !== '');
      payload.append('specializations', JSON.stringify(validSpecializations));
      
      // Add profile image URL only if uploaded to Cloudinary
      if (imageUrl) {
        payload.append('profileImageUrl', imageUrl);
      }

      const response = await fetch('http://localhost:5025/api/doctors/register', {
        method: 'POST',
        body: payload
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Doctor registered successfully! Redirecting to login...');
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="LIC-12345"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Image (Optional)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={imageUploading}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    {imageUploading && (
                      <div className="flex items-center space-x-2 text-blue-600 text-sm">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span>Uploading image to Cloudinary...</span>
                      </div>
                    )}
                    {imageUrl && (
                      <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <img 
                          src={imageUrl} 
                          alt="Profile preview" 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-green-700 font-medium">Image uploaded successfully!</p>
                          <p className="text-xs text-green-600">Will be saved to Cloudinary</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    About You
                  </label>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Tell patients about your approach to medicine and patient care..."
                  />
                </div>

                {/* Qualifications Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Qualifications
                    </label>
                    <button
                      type="button"
                      onClick={addQualification}
                      className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      + Add Qualification
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.qualifications.map((qual, index) => (
                      <div key={index} className="flex gap-2 p-3 border border-gray-200 rounded-xl">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Qualification</label>
                          <input
                            type="text"
                            name={`qualification_${index}`}
                            value={qual}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="e.g., MBBS, MS Ortho"
                          />
                        </div>
                        {formData.qualifications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQualification(index)}
                            className="mt-6 px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specializations Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Specializations
                    </label>
                    <button
                      type="button"
                      onClick={addSpecialization}
                      className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      + Add Specialization
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.specializations.map((spec, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          name={`specialization_${index}`}
                          value={spec}
                          onChange={handleChange}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="e.g., Joint Replacement, Sports Medicine"
                        />
                        {formData.specializations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSpecialization(index)}
                            className="px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
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
