import React, { useState, useEffect } from 'react';

const EditAvailabilityForm = ({ slot, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    slotDuration: 20,
    breakStart: '',
    breakEnd: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slot) {
      setFormData({
        startTime: slot.startTime || slot.start || '',
        endTime: slot.endTime || slot.end || '',
        slotDuration: slot.slotDuration || 20,
        breakStart: slot.breakStart || '',
        breakEnd: slot.breakEnd || ''
      });
    }
  }, [slot]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.startTime || !formData.endTime) {
      setError('Start time and end time are required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5025/api/doctors/availability/${slot._id || slot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startTime: formData.startTime,
          endTime: formData.endTime,
          slotDuration: formData.slotDuration,
          breakStart: formData.breakStart,
          breakEnd: formData.breakEnd
        })
      });

      const data = await response.json();

      if (data.success) {
        onSave(data.availability);
      } else {
        setError(data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const slotDurations = [15, 20, 30, 45, 60];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2 bg-red-50 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Start Time *
          </label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            End Time *
          </label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Slot Duration (minutes)
        </label>
        <select
          name="slotDuration"
          value={formData.slotDuration}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {slotDurations.map(d => (
            <option key={d} value={d}>{d} minutes</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Break Start (optional)
          </label>
          <input
            type="time"
            name="breakStart"
            value={formData.breakStart}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Break End (optional)
          </label>
          <input
            type="time"
            name="breakEnd"
            value={formData.breakEnd}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

// Make sure this export is at the bottom
export default EditAvailabilityForm;