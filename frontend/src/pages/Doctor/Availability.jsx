import React, { useState, useEffect } from 'react';
import { resolveDoctorIdForApi } from '../../utils/doctorId';

const Availability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    dayName: '',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 20,
    breakStart: '',
    breakEnd: ''
  });

  const days = [
    { value: 0, name: 'Sunday' },
    { value: 1, name: 'Monday' },
    { value: 2, name: 'Tuesday' },
    { value: 3, name: 'Wednesday' },
    { value: 4, name: 'Thursday' },
    { value: 5, name: 'Friday' },
    { value: 6, name: 'Saturday' }
  ];

  // Fetch availability on load
  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const { id: doctorId } = resolveDoctorIdForApi();
      const response = await fetch(
        `/api/doctors/availability/my?doctorId=${encodeURIComponent(doctorId)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      const data = await response.json();
      if (data.success) {
        setAvailability(data.availability);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // CREATE
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('doctorToken');
      const { id: doctorId } = resolveDoctorIdForApi();
      const response = await fetch('/api/doctors/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...formData, doctorId })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '✅ Availability created successfully!' });
        fetchAvailability();
        resetForm();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating availability' });
    }
  };

  // UPDATE
  const handleUpdate = async (id, updatedData) => {
    try {
      const token = localStorage.getItem('doctorToken');
      const { id: doctorId } = resolveDoctorIdForApi();
      const response = await fetch(`/api/doctors/availability/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...updatedData, doctorId })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '✅ Updated successfully!' });
        fetchAvailability();
        setEditingId(null);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating' });
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      try {
        const token = localStorage.getItem('doctorToken');
        const { id: doctorId } = resolveDoctorIdForApi();
        const response = await fetch(
          `/api/doctors/availability/${id}?doctorId=${encodeURIComponent(doctorId)}`,
          {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: '🗑️ Deleted successfully!' });
          fetchAvailability();
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error deleting' });
      }
    }
  };

  // TOGGLE ACTIVE/INACTIVE
  const handleToggle = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('doctorToken');
      const { id: doctorId } = resolveDoctorIdForApi();
      const response = await fetch(
        `/api/doctors/availability/${id}/toggle?doctorId=${encodeURIComponent(doctorId)}`,
        {
          method: 'PATCH',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchAvailability();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error toggling' });
    }
  };

  const resetForm = () => {
    setFormData({
      dayOfWeek: '',
      dayName: '',
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 20,
      breakStart: '',
      breakEnd: ''
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Availability Schedule</h2>
        <p className="text-gray-500 text-sm mt-1">Create, Read, Update, Delete your weekly schedule</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* CREATE FORM */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">➕ Create New Availability</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Select Day *</label>
              <select
                required
                value={formData.dayOfWeek}
                onChange={(e) => {
                  const dayValue = parseInt(e.target.value);
                  const dayName = days.find(d => d.value === dayValue)?.name;
                  setFormData({ ...formData, dayOfWeek: dayValue, dayName });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Day --</option>
                {days.map(day => (
                  <option key={day.value} value={day.value}>{day.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Slot Duration (minutes)</label>
              <select
                value={formData.slotDuration}
                onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Break Start</label>
              <input
                type="time"
                value={formData.breakStart}
                onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Break End</label>
              <input
                type="time"
                value={formData.breakEnd}
                onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Availability
          </button>
        </form>
      </div>

      {/* READ - Display all availability */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 My Availability Schedule</h3>
        
        {availability.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No availability set. Create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Day</th>
                  <th className="text-left p-3">Working Hours</th>
                  <th className="text-left p-3">Slot</th>
                  <th className="text-left p-3">Break</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {availability.map((slot) => (
                  <tr key={slot._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{slot.dayName}</td>
                    <td className="p-3">{slot.startTime} - {slot.endTime}</td>
                    <td className="p-3">{slot.slotDuration} min</td>
                    <td className="p-3">{slot.breakStart && slot.breakEnd ? `${slot.breakStart} - ${slot.breakEnd}` : '—'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggle(slot._id, slot.isActive)}
                        className={`px-2 py-1 text-xs rounded ${
                          slot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {slot.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingId(editingId === slot._id ? null : slot._id)}
                          className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(slot._id)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">✏️ Edit Availability</h3>
            <EditForm
              slot={availability.find(s => s._id === editingId)}
              onSave={handleUpdate}
              onCancel={() => setEditingId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// EDIT FORM COMPONENT
const EditForm = ({ slot, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    startTime: slot.startTime,
    endTime: slot.endTime,
    slotDuration: slot.slotDuration,
    breakStart: slot.breakStart || '',
    breakEnd: slot.breakEnd || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(slot._id, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
          <input
            type="time"
            required
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
          <input
            type="time"
            required
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Slot Duration (min)</label>
        <select
          value={formData.slotDuration}
          onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="15">15 minutes</option>
          <option value="20">20 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Break Start</label>
          <input
            type="time"
            value={formData.breakStart}
            onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Break End</label>
          <input
            type="time"
            value={formData.breakEnd}
            onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save Changes</button>
      </div>
    </form>
  );
};

export default Availability;