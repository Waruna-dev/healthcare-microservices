import React, { useState, useEffect } from 'react';

const DoctorSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState([]);

  const [newSlot, setNewSlot] = useState({
    day: 'Monday',
    start: '09:00',
    end: '17:00',
    slotDuration: 20,
    breakStart: '13:00',
    breakEnd: '14:00'
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const slotDurations = [15, 20, 30, 45, 60];

  const getDayValue = (dayName) => {
    const mapping = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return mapping[dayName];
  };

  const getDayNameFromValue = (dayValue) => {
    const mapping = {
      0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
      4: 'Thursday', 5: 'Friday', 6: 'Saturday'
    };
    return mapping[dayValue];
  };

  // READ - Fetch availability from backend (NO HARDCODE)
  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5025/api/doctors/availability/my');
      const data = await response.json();
      
      if (data.success && data.availability) {
        // Format data from database - NO HARDCODE
        const formattedSchedule = data.availability.map(slot => ({
          id: slot._id,
          day: slot.dayName,
          start: slot.startTime,
          end: slot.endTime,
          slotDuration: slot.slotDuration,
          active: slot.isActive,
          breakStart: slot.breakStart || '',
          breakEnd: slot.breakEnd || ''
        }));
        setSchedule(formattedSchedule);
      } else {
        setSchedule([]);
      }
    } catch (error) {
      console.error('Error fetching:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  // CREATE
  const handleCreate = async () => {
    try {
      const response = await fetch('http://localhost:5025/api/doctors/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: getDayValue(newSlot.day),
          dayName: newSlot.day,
          startTime: newSlot.start,
          endTime: newSlot.end,
          slotDuration: newSlot.slotDuration,
          breakStart: newSlot.breakStart,
          breakEnd: newSlot.breakEnd
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '✅ Created successfully!' });
        fetchAvailability(); // Refresh from DB
        setShowAddModal(false);
        // Reset form
        setNewSlot({
          day: 'Monday',
          start: '09:00',
          end: '17:00',
          slotDuration: 20,
          breakStart: '13:00',
          breakEnd: '14:00'
        });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error connecting to server' });
    }
    setTimeout(() => setMessage(''), 3000);
  };

  // UPDATE (Toggle Active/Inactive)
  const handleToggleActive = async (id) => {
    try {
      const response = await fetch(`http://localhost:5025/api/doctors/availability/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '✅ Status updated!' });
        fetchAvailability(); // Refresh from DB
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error toggling status' });
    }
    setTimeout(() => setMessage(''), 2000);
  };

  // UPDATE (Edit slot) - Opens modal
  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setNewSlot({
      day: slot.day,
      start: slot.start,
      end: slot.end,
      slotDuration: slot.slotDuration,
      breakStart: slot.breakStart || '',
      breakEnd: slot.breakEnd || ''
    });
    setShowAddModal(true);
  };

  // UPDATE (Save edited slot)
  const handleUpdate = async () => {
    try {
      const response = await fetch(`http://localhost:5025/api/doctors/availability/${editingSlot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: newSlot.start,
          endTime: newSlot.end,
          slotDuration: newSlot.slotDuration,
          breakStart: newSlot.breakStart,
          breakEnd: newSlot.breakEnd
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '✅ Schedule updated successfully!' });
        fetchAvailability(); // Refresh from DB
        setShowAddModal(false);
        setEditingSlot(null);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating schedule' });
    }
    setTimeout(() => setMessage(''), 3000);
  };

  // DELETE
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        const response = await fetch(`http://localhost:5025/api/doctors/availability/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        if (data.success) {
          setMessage({ type: 'success', text: '🗑️ Deleted successfully!' });
          fetchAvailability(); // Refresh from DB
        } else {
          setMessage({ type: 'error', text: data.message });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error deleting' });
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Get schedule for a specific day (from API data, no hardcode)
  const getScheduleForDay = (dayName) => {
    const slot = schedule.find(s => s.day === dayName);
    if (slot && slot.active && slot.start && slot.end) {
      return `${slot.start} - ${slot.end}`;
    }
    return null;
  };

  // Calendar helpers
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const isToday = (day) => day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

  const generateTimeSlots = (start, end, duration) => {
    if (!start || !end) return [];
    const slots = [];
    let current = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    while (current < endTime) {
      slots.push(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      current.setMinutes(current.getMinutes() + duration);
    }
    return slots;
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Schedule & Availability</h2>
          <p className="text-gray-500 text-sm mt-1">Complete CRUD: Create, Read, Update, Delete your weekly schedule</p>
        </div>
        <button
          onClick={() => {
            setEditingSlot(null);
            setNewSlot({ day: 'Monday', start: '09:00', end: '17:00', slotDuration: 20, breakStart: '13:00', breakEnd: '14:00' });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          + Create New Schedule
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">◀</button>
              <h3 className="text-xl font-semibold text-gray-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">▶</button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const date = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                const dayName = date ? weekDays[date.getDay()] : '';
                const fullDayName = dayName === 'Sun' ? 'Sunday' : 
                                   dayName === 'Mon' ? 'Monday' :
                                   dayName === 'Tue' ? 'Tuesday' :
                                   dayName === 'Wed' ? 'Wednesday' :
                                   dayName === 'Thu' ? 'Thursday' :
                                   dayName === 'Fri' ? 'Friday' : 'Saturday';
                const scheduleForDay = day ? getScheduleForDay(fullDayName) : null;
                
                return (
                  <div key={index} className={`min-h-[100px] p-2 border rounded-lg ${day ? 'hover:shadow-md transition cursor-pointer' : 'bg-gray-50'} ${isToday(day) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    {day && (
                      <>
                        <div className={`text-sm font-semibold ${isToday(day) ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
                        {scheduleForDay ? (
                          <div className="mt-2">
                            <div className="text-xs text-green-600 font-medium">{scheduleForDay}</div>
                            <div className="text-xs text-gray-500 mt-1">Available</div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-red-500">Unavailable</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
              <div className="flex items-center"><div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded mr-2"></div><span className="text-sm text-gray-600">Today</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div><span className="text-sm text-gray-600">Available</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div><span className="text-sm text-gray-600">Unavailable</span></div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Column - Shows ONLY data from DB */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Weekly Schedule (from Database)</h3>
            <div className="space-y-3">
              {days.map((day) => {
                const slot = schedule.find(s => s.day === day);
                const isActive = slot?.active && slot?.start && slot?.end;
                
                return (
                  <div key={day} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{day}</span>
                        <span className={`text-sm ${isActive ? 'text-green-600' : 'text-red-500'}`}>
                          {isActive ? `${slot.start} - ${slot.end}` : 'Not Set'}
                        </span>
                      </div>
                      {isActive && (
                        <div className="text-xs text-gray-500 mt-1">
                          {slot.slotDuration} min slots • Break: {slot.breakStart && slot.breakEnd ? `${slot.breakStart} - ${slot.breakEnd}` : 'No break'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isActive && (
                        <>
                          <button onClick={() => handleToggleActive(slot.id)} className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                            Active
                          </button>
                          <button onClick={() => handleEdit(slot)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">✏️</button>
                          <button onClick={() => handleDelete(slot.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">🗑️</button>
                        </>
                      )}
                      {!isActive && (
                        <button 
                          onClick={() => {
                            setEditingSlot(null);
                            setNewSlot({ ...newSlot, day });
                            setShowAddModal(true);
                          }} 
                          className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-500"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Data Source:</strong> MongoDB - No hardcoded data. All CRUD operations persist to database.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Slots Preview - Shows ONLY from DB */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">⏰ Time Slots Preview (from Database)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {schedule.filter(s => s.active && s.start && s.end).map((slot) => (
            <div key={slot.id} className="border rounded-lg p-3">
              <div className="font-semibold text-gray-800">{slot.day}</div>
              <div className="text-sm text-gray-600 mt-1">
                {generateTimeSlots(slot.start, slot.end, slot.slotDuration).slice(0, 4).map((time, i) => <div key={i} className="py-0.5">{time}</div>)}
                {generateTimeSlots(slot.start, slot.end, slot.slotDuration).length > 4 && (
                  <div className="text-xs text-gray-400 mt-1">
                    +{generateTimeSlots(slot.start, slot.end, slot.slotDuration).length - 4} more
                  </div>
                )}
              </div>
            </div>
          ))}
          {schedule.filter(s => s.active && s.start && s.end).length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              No schedules found in database. Click "Create New Schedule" to add one.
            </div>
          )}
        </div>
      </div>

      {/* CREATE/UPDATE Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingSlot ? '✏️ Update Schedule' : '➕ Create New Schedule'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Day *</label>
                <select
                  value={newSlot.day}
                  onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {days.map(day => <option key={day}>{day}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={newSlot.start}
                    onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={newSlot.end}
                    onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Slot Duration (minutes)</label>
                <select
                  value={newSlot.slotDuration}
                  onChange={(e) => setNewSlot({ ...newSlot, slotDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {slotDurations.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Break Start (optional)</label>
                  <input
                    type="time"
                    value={newSlot.breakStart}
                    onChange={(e) => setNewSlot({ ...newSlot, breakStart: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Break End (optional)</label>
                  <input
                    type="time"
                    value={newSlot.breakEnd}
                    onChange={(e) => setNewSlot({ ...newSlot, breakEnd: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSlot(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingSlot ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSlot ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedule;