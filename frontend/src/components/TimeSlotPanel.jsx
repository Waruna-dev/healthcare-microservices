import React, { useState, useEffect } from 'react';
import { Clock, X, Save, Plus } from 'lucide-react';

const TimeSlotPanel = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingSlot = null,
  selectedDate = null 
}) => {
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 20,
    breakStart: '',
    breakEnd: '',
    price: '',
    availabilityStatus: 'Available',
    isActive: true,
    date: selectedDate || ''
  });

  const SLOT_DURATIONS = [15, 20, 30, 45, 60];
  const PRICE_PRESETS = [0, 500, 1000, 1500, 2000, 2500];

  useEffect(() => {
    if (editingSlot) {
      setFormData({
        startTime: editingSlot.startTime || '09:00',
        endTime: editingSlot.endTime || '17:00',
        slotDuration: editingSlot.slotDuration || 20,
        breakStart: editingSlot.breakStart || '',
        breakEnd: editingSlot.breakEnd || '',
        price: editingSlot.price ? String(editingSlot.price) : '',
        availabilityStatus: editingSlot.availabilityStatus || 'Available',
        isActive: editingSlot.isActive !== false,
        date: editingSlot.date || ''
      });
    } else {
      setFormData({
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 20,
        breakStart: '',
        breakEnd: '',
        price: '',
        availabilityStatus: 'Available',
        isActive: true,
        date: selectedDate || ''
      });
    }
  }, [editingSlot, selectedDate]);

  const handleSave = () => {
    const payload = {
      ...formData,
      price: formData.price ? Number(formData.price) : 0,
      slotDuration: Number(formData.slotDuration)
    };
    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        width: '400px',
        height: '100vh',
        background: 'white',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        overflowY: 'auto',
        animation: 'slideIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {editingSlot ? 'Edit Time Slot' : 'Create Time Slot'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div style={{ padding: '20px' }}>
          {/* Date (for exceptions) */}
          {formData.date && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          {/* Time Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
              <Clock size={16} style={{ marginRight: '6px', display: 'inline' }} />
              Time Slot
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Slot Duration */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Slot Duration
            </label>
            <select
              value={formData.slotDuration}
              onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              {SLOT_DURATIONS.map(duration => (
                <option key={duration} value={duration}>{duration} minutes</option>
              ))}
            </select>
          </div>

          {/* Break Times */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
              Break Time (Optional)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Break Start
                </label>
                <input
                  type="time"
                  value={formData.breakStart}
                  onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Break End
                </label>
                <input
                  type="time"
                  value={formData.breakEnd}
                  onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Price */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Consultation Fee (Rs)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Enter consultation fee"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Availability Status */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Availability Status
            </label>
            <select
              value={formData.availabilityStatus}
              onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          {/* Active Status */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '16px', height: '16px' }}
              />
              Active
            </label>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              background: '#0F6E56',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Save size={18} />
            {editingSlot ? 'Update Time Slot' : 'Create Time Slot'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TimeSlotPanel;
