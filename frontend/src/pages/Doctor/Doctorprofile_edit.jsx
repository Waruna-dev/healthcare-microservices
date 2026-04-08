import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import img1 from '../../assets/images/1e73cdf4e73454e4db41a709b9163cac.jpg';
import img2 from '../../assets/images/9339706cc8079c7b463d4fb452f097d3.jpg';

function authHeaders(useFormData = false) {
  const token = localStorage.getItem('token');
  const h = {};
  if (token) h.Authorization = `Bearer ${token}`;
  // Don't set Content-Type for FormData - browser sets it automatically
  if (!useFormData) h['Content-Type'] = 'application/json';
  return h;
}

const DoctorProfileEdit = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams(); // Get doctor ID from URL params
  const { user, updateUser } = useAuth(); // Get logged-in user data and update function
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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

  // Fetch doctor data on component mount
  useEffect(() => {
    // Use logged-in user's ID if available, otherwise use URL param
    const effectiveDoctorId = user?._id || user?.id || doctorId;
    
    if (effectiveDoctorId) {
      fetchDoctorData(effectiveDoctorId);
    } else {
      setError('No doctor ID available');
      setFetchLoading(false);
    }
  }, [doctorId, user?._id, user?.id]);

  const fetchDoctorData = async (doctorIdToUse) => {
    try {
      const response = await fetch(`/api/doctors/${doctorIdToUse}`, {
        headers: authHeaders()
      });
      const data = await response.json();
      
      if (data.success && data.doctor) {
        const doctor = data.doctor;
        setFormData({
          name: doctor.name || '',
          email: doctor.email || '',
          specialty: doctor.specialty || '',
          phone: doctor.phone || '',
          licenseNumber: doctor.licenseNumber || '',
          experience: doctor.experience || '',
          address: doctor.address || '',
          about: doctor.about || '',
          gender: doctor.gender || '',
          qualifications: doctor.qualifications && doctor.qualifications.length > 0 ? doctor.qualifications : [''],
          specializations: doctor.specializations && doctor.specializations.length > 0 ? doctor.specializations : ['']
        });
        
        // Set existing profile image if available
        if (doctor.profilePicture) {
          setImageUrl(doctor.profilePicture);
        }
        
        setError('');
      } else {
        setError('Failed to fetch doctor data');
      }
    } catch (err) {
      setError('Error fetching doctor data: ' + err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQualificationChange = (index, value) => {
    const newQualifications = [...formData.qualifications];
    newQualifications[index] = value;
    setFormData(prev => ({
      ...prev,
      qualifications: newQualifications
    }));
  };

  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, '']
    }));
  };

  const removeQualification = (index) => {
    const newQualifications = formData.qualifications.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      qualifications: newQualifications
    }));
  };

  const handleSpecializationChange = (index, value) => {
    const newSpecializations = [...formData.specializations];
    newSpecializations[index] = value;
    setFormData(prev => ({
      ...prev,
      specializations: newSpecializations
    }));
  };

  const addSpecialization = () => {
    setFormData(prev => ({
      ...prev,
      specializations: [...prev.specializations, '']
    }));
  };

  const removeSpecialization = (index) => {
    const newSpecializations = formData.specializations.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      specializations: newSpecializations
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      uploadToCloudinary(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    setImageUploading(true);
    setError('');
    
    try {
      // Use environment variables for Cloudinary
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dsvrla6zk';
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_unsigned';
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "doctor_profiles");
      
      console.log('Uploading to Cloudinary...', { cloudName, uploadPreset });
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Prepare payload as JSON object
      const payload = {
        name: formData.name,
        email: formData.email,
        specialty: formData.specialty,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        experience: formData.experience,
        address: formData.address,
        about: formData.about,
        gender: formData.gender,
        qualifications: formData.qualifications.filter(q => q.trim() !== ''),
        specializations: formData.specializations.filter(s => s.trim() !== ''),
        profilePicture: imageUrl || user?.profilePicture
      };

      console.log('Submitting payload:', payload);

      const effectiveDoctorId = user?._id || user?.id || doctorId;
      const response = await fetch(`/api/doctors/${effectiveDoctorId}`, {
        method: 'PUT',
        headers: authHeaders(), // Use JSON headers
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success) {
        // Update user data in AuthContext with the updated doctor data from response
        const updatedUserData = {
          ...user,
          name: formData.name,
          email: formData.email,
          specialty: formData.specialty,
          phone: formData.phone,
          address: formData.address,
          profilePicture: imageUrl || user?.profilePicture,
          qualifications: formData.qualifications.filter(q => q.trim() !== ''),
          specializations: formData.specializations.filter(s => s.trim() !== '')
        };
        updateUser(updatedUserData);
        
        setMessage('✅ Profile updated successfully! Redirecting to dashboard...');
        setTimeout(() => navigate('/doctor/dashboard'), 2000);
      } else {
        setError(data.message || data.error || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading doctor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Doctor Profile</h1>
            <p className="text-gray-600">Update your professional information</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <img
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                  src={imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=0F6E56&color=fff&size=128`}
                  alt="Profile preview"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {imageUploading && (
                  <div className="mt-2 flex items-center text-sm text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Uploading image to Cloudinary...</span>
                  </div>
                )}
                {imageUrl && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-green-700 font-medium">Image uploaded successfully!</p>
                      <p className="text-xs text-green-600">Will be saved to Cloudinary</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty *
                </label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Specialty</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Oncology">Oncology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* About Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About / Bio
              </label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your experience, specialties, and approach to patient care..."
              />
            </div>

            {/* Qualifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualifications
              </label>
              {formData.qualifications.map((qualification, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => handleQualificationChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., MBBS, MD, Fellowship"
                  />
                  {formData.qualifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addQualification}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Qualification
              </button>
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specializations
              </label>
              {formData.specializations.map((specialization, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => handleSpecializationChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Interventional Cardiology, Pediatric Care"
                  />
                  {formData.specializations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecialization(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSpecialization}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Specialization
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/doctor/dashboard')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || imageUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default DoctorProfileEdit;