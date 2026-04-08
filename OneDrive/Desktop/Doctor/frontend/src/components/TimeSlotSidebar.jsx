import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, DollarSign, Coffee, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_DURATIONS = [15, 20, 30, 45, 60];
const PRICE_PRESETS = [500, 1000, 1500, 2000, 2500, 3000, 5000, 10000];

const TimeSlotSidebar = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    dayName: 'Sunday',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 20,
    breakStart: '',
    breakEnd: '',
    price: '',
    availabilityStatus: 'Available',
    isActive: true,
    isException: false
  });

  const [originalData, setOriginalData] = useState(null);
  const [generatedSlots, setGeneratedSlots] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        dayOfWeek: initialData.dayOfWeek || 0,
        dayName: initialData.dayName || 'Sunday',
        date: initialData.date || '',
        startTime: initialData.startTime || '09:00',
        endTime: initialData.endTime || '17:00',
        slotDuration: initialData.slotDuration || 20,
        breakStart: initialData.breakStart || '',
        breakEnd: initialData.breakEnd || '',
        price: initialData.price ? String(initialData.price) : '',
        availabilityStatus: initialData.availabilityStatus || 'Available',
        isActive: initialData.isActive !== false,
        isException: !!initialData.date
      });
      setOriginalData(initialData);
    } else {
      resetToDefaults();
    }
  }, [initialData]);

  useEffect(() => {
    generateTimeSlots();
  }, [formData.startTime, formData.endTime, formData.slotDuration, formData.breakStart, formData.breakEnd]);

  const resetToDefaults = () => {
    const defaults = {
      dayOfWeek: 0,
      dayName: 'Sunday',
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 20,
      breakStart: '',
      breakEnd: '',
      price: '',
      availabilityStatus: 'Available',
      isActive: true,
      isException: false
    };
    setFormData(defaults);
    setOriginalData(defaults);
  };

  const generateTimeSlots = () => {
    const { startTime, endTime, slotDuration, breakStart, breakEnd } = formData;
    
    if (!startTime || !endTime || !slotDuration) {
      setGeneratedSlots([]);
      return;
    }

    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationMs = slotDuration * 60 * 1000;

    let currentTime = new Date(start);

    while (currentTime < end) {
      const slotEnd = new Date(currentTime.getTime() + durationMs);
      
      // Check if this slot conflicts with break time
      const slotStartTime = currentTime.toTimeString().slice(0, 5);
      const slotEndTime = slotEnd.toTimeString().slice(0, 5);
      
      let isInBreak = false;
      if (breakStart && breakEnd) {
        const breakStartObj = new Date(`2000-01-01T${breakStart}`);
        const breakEndObj = new Date(`2000-01-01T${breakEnd}`);
        
        if ((currentTime >= breakStartObj && currentTime < breakEndObj) ||
            (slotEnd > breakStartObj && slotEnd <= breakEndObj) ||
            (currentTime <= breakStartObj && slotEnd >= breakEndObj)) {
          isInBreak = true;
        }
      }

      if (!isInBreak && slotEnd <= end) {
        slots.push({
          start: slotStartTime,
          end: slotEndTime,
          duration: slotDuration
        });
      }

      currentTime = new Date(currentTime.getTime() + durationMs);
    }

    setGeneratedSlots(slots);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDayChange = (dayIndex) => {
    setFormData(prev => ({
      ...prev,
      dayOfWeek: dayIndex,
      dayName: DAYS[dayIndex]
    }));
  };

  const handleTypeToggle = (isException) => {
    setFormData(prev => ({
      ...prev,
      isException,
      date: isException ? new Date().toISOString().split('T')[0] : ''
    }));
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      price: formData.price ? Number(formData.price) : 0,
      generatedSlots
    };
    onSave(dataToSave);
  };

  const handleRefresh = () => {
    if (originalData) {
      setFormData({
        ...originalData,
        price: originalData.price ? String(originalData.price) : ''
      });
    } else {
      resetToDefaults();
    }
  };

  const addQuickBreak = () => {
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    const midday = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
    
    const breakStart = midday.toTimeString().slice(0, 5);
    const breakEnd = new Date(midday.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);
    
    setFormData(prev => ({
      ...prev,
      breakStart,
      breakEnd
    }));
  };

  const clearBreak = () => {
    setFormData(prev => ({
      ...prev,
      breakStart: '',
      breakEnd: ''
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={`
      fixed inset-0 z-50
      ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}
    `}>
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black/20
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        absolute right-0 top-0 h-full w-96 max-w-[90vw]
        bg-white shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Clock size={20} className="text-white" />
            </div>
            Time Slot Management
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
          {/* Type Toggle */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Schedule Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTypeToggle(false)}
                className={`
                  px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 border-2
                  ${!formData.isException 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 shadow-md' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                Weekly Template
              </button>
              <button
                onClick={() => handleTypeToggle(true)}
                className={`
                  px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 border-2
                  ${formData.isException 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 shadow-md' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                Date Exception
              </button>
            </div>
          </div>

          {/* Date for exceptions */}
          {formData.isException && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-700 font-medium"
              />
            </div>
          )}

          {/* Day selection for weekly */}
          {!formData.isException && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                Day of Week
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => handleDayChange(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-700 font-medium"
              >
                {DAYS.map((day, index) => (
                  <option key={day} value={index}>{day}</option>
                ))}
              </select>
            </div>
          )}

          {/* Time Range */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-emerald-600" />
              Working Hours
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-700 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-700 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Slot Duration */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Slot Duration
            </label>
            <select
              value={formData.slotDuration}
              onChange={(e) => handleInputChange('slotDuration', parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-700 font-medium"
            >
              {SLOT_DURATIONS.map(duration => (
                <option key={duration} value={duration}>{duration} minutes</option>
              ))}
            </select>
          </div>

          {/* Break Time */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Coffee size={16} className="text-orange-600" />
                Break Time (Optional)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={addQuickBreak}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors duration-200 border border-orange-200"
                  title="Add 1-hour break in middle"
                >
                  Quick Break
                </button>
                <button
                  onClick={clearBreak}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 border border-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Break Start</label>
                <input
                  type="time"
                  value={formData.breakStart}
                  onChange={(e) => handleInputChange('breakStart', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-700 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Break End</label>
                <input
                  type="time"
                  value={formData.breakEnd}
                  onChange={(e) => handleInputChange('breakEnd', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-700 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Generated Time Slots Preview */}
          {generatedSlots.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Generated Time Slots ({generatedSlots.length})
              </label>
              <div className="max-h-40 overflow-y-auto bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-3 space-y-2">
                {generatedSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-purple-100 shadow-sm"
                  >
                    <span className="text-sm font-semibold text-gray-900">{slot.start} - {slot.end}</span>
                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">{slot.duration}min</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-green-600" />
              Consultation Fee (Rs)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRICE_PRESETS.slice(0, 4).map(price => (
                <button
                  key={price}
                  onClick={() => handleInputChange('price', String(price))}
                  className="px-3 py-2 text-sm font-semibold text-gray-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors duration-200"
                >
                  {price}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="Enter custom amount"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-700 font-medium"
            />
          </div>

          {/* Status */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              Availability Status
            </label>
            <select
              value={formData.availabilityStatus}
              onChange={(e) => handleInputChange('availabilityStatus', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-700 font-medium"
            >
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          {/* Active Status */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-2 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Active
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gradient-to-b from-gray-50 to-white space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Save size={18} />
            Save Time Slot
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotSidebar;
