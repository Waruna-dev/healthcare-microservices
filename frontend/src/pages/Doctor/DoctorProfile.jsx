import React, { useState, useEffect } from 'react';

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      
      const response = await fetch('http://localhost:5025/api/doctors/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDoctor(data.doctor);
        setFormData(data.doctor);
      } else {
        console.error('Failed to fetch profile:', data.message);
        // Use localStorage as fallback
        const localDoctor = localStorage.getItem('doctorInfo');
        if (localDoctor) {
          const parsed = JSON.parse(localDoctor);
          setDoctor(parsed);
          setFormData(parsed);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use localStorage as fallback
      const localDoctor = localStorage.getItem('doctorInfo');
      if (localDoctor) {
        const parsed = JSON.parse(localDoctor);
        setDoctor(parsed);
        setFormData(parsed);
      }
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(doctor);
    setMessage('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('doctorToken');
      
      const response = await fetch('http://localhost:5025/api/doctors/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDoctor(data.doctor);
        localStorage.setItem('doctorInfo', JSON.stringify(data.doctor));
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Cannot connect to server' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <p className="text-gray-500 text-sm mt-1">View and manage your professional information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            ✏️ Edit Profile
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold text-white">
              {doctor?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Dr. {doctor?.name || 'Doctor'}</h3>
              <p className="text-blue-100">{doctor?.specialty || 'Specialty not set'}</p>
              <div className="flex items-center mt-2 space-x-3">
                <span className="bg-white/20 px-2 py-1 rounded text-xs">
                  ID: {doctor?._id?.slice(-6) || doctor?.id?.slice(-6) || 'N/A'}
                </span>
                <span className="bg-yellow-500/30 px-2 py-1 rounded text-xs flex items-center">
                  ★ {doctor?.rating || doctor?.averageRating || 'New'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">{doctor?.name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Email Address</label>
                  <p className="text-gray-800 mt-1">{doctor?.email || 'Not provided'}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">{doctor?.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">{doctor?.address || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Professional Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Specialty</label>
                  <p className="text-gray-800 mt-1">{doctor?.specialty || 'Not provided'}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">License Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber || ''}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">{doctor?.licenseNumber || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Years of Experience</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience || ''}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">{doctor?.experience ? `${doctor.experience} years` : 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase">Consultation Fee ($)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="consultationFee"
                      value={formData.consultationFee || ''}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">{doctor?.consultationFee ? `$${doctor.consultationFee}` : 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Professional Bio</h4>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Tell patients about your experience, education, and approach to care..."
              />
            ) : (
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                {doctor?.bio || 'No bio provided yet. Click Edit to add your professional biography.'}
              </p>
            )}
          </div>

          {/* Qualifications Section */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Qualifications</h4>
            {isEditing ? (
              <textarea
                name="qualifications"
                value={formData.qualifications || ''}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="MBBS, MD, FRCS, etc. (one per line)"
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                {doctor?.qualifications ? (
                  <p className="text-gray-700">{doctor.qualifications}</p>
                ) : (
                  <p className="text-gray-500 italic">No qualifications added yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;