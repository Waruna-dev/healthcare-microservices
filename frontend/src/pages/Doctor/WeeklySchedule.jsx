import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function authHeaders() {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  console.log('Auth headers:', h);
  return h;
}

const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Monday', short: 'Mon' },
  { id: 'tuesday', name: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', name: 'Wednesday', short: 'Wed' },
  { id: 'thursday', name: 'Thursday', short: 'Thu' },
  { id: 'friday', name: 'Friday', short: 'Fri' },
  { id: 'saturday', name: 'Saturday', short: 'Sat' },
  { id: 'sunday', name: 'Sunday', short: 'Sun' }
];

const WeeklySchedule = () => {
  const { user } = useAuth();
  
  // Extract doctor ID with better error handling and logging
  const loggedInDoctorId = useMemo(() => {
    if (!user) {
      console.error('WeeklySchedule: No user found in auth context');
      // Check what's in localStorage for debugging
      const storedUser = localStorage.getItem('user');
      console.log('WeeklySchedule - Stored user data:', storedUser);
      return '';
    }
    
    // Try multiple possible ID fields including nested structure
    let doctorId = user._id || user.id || user.doctorId || '';
    
    // If no ID found directly, check nested structure (from AuthContext)
    if (!doctorId && user.doctor) {
      doctorId = user.doctor._id || user.doctor.id || '';
    }
    if (!doctorId && user.patient) {
      doctorId = user.patient._id || user.patient.id || '';
    }
    
    console.log('WeeklySchedule - User object:', user);
    console.log('WeeklySchedule - Extracted doctor ID:', doctorId);
    console.log('WeeklySchedule - User ID fields:', {
      _id: user._id,
      id: user.id,
      doctorId: user.doctorId,
      'doctor._id': user.doctor?._id,
      'doctor.id': user.doctor?.id,
      'patient._id': user.patient?._id,
      'patient.id': user.patient?.id
    });
    
    // Also check localStorage directly
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        console.log('WeeklySchedule - Parsed stored user:', parsed);
        console.log('WeeklySchedule - Stored user ID fields:', {
          _id: parsed._id,
          id: parsed.id,
          doctorId: parsed.doctorId,
          doctor: parsed.doctor?._id || parsed.doctor?.id,
          patient: parsed.patient?._id || parsed.patient?.id
        });
      } catch (e) {
        console.error('WeeklySchedule - Error parsing stored user:', e);
      }
    }
    
    if (!doctorId) {
      console.error('WeeklySchedule: No doctor ID found in user object:', user);
      // Show an alert for debugging
      alert('Error: No doctor ID found. Please check your login status.');
    }
    
    return doctorId;
  }, [user]);
  
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const initializeWeeklySchedule = useCallback(() => {
    const schedule = {};
    DAYS_OF_WEEK.forEach(day => {
      schedule[day.id] = {
        isAvailable: false,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 20,
        breakStart: '',
        breakEnd: '',
        consultationFee: ''
      };
    });
    return schedule;
  }, []);

  const loadWeeklySchedule = useCallback(async () => {
    const id = loggedInDoctorId.trim();
    console.log('loadWeeklySchedule - Using doctor ID:', id);
    
    if (!id) {
      console.error('loadWeeklySchedule: No doctor ID available');
      setMessage({ type: 'error', text: 'Doctor authentication required. Please log in again.' });
      setWeeklySchedule(initializeWeeklySchedule());
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Get the start and end of the current week
      const weekStart = new Date(selectedWeek);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const startDate = weekStart.toISOString().split('T')[0];
      const endDate = weekEnd.toISOString().split('T')[0];
      
      const apiUrl = `/api/doctors/availability/doctor/${encodeURIComponent(id)}?start=${startDate}&end=${endDate}&includeInactive=true`;
      console.log('loadWeeklySchedule - API URL:', apiUrl);
      
      const res = await fetch(apiUrl, { headers: authHeaders() });
      
      const data = await res.json();
      console.log('loadWeeklySchedule - API response:', data);
      
      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.message || 'Could not load weekly schedule' });
        setWeeklySchedule(initializeWeeklySchedule());
        return;
      }
      
      const schedule = initializeWeeklySchedule();
      
      // Map the availability data to days of the week
      (data.availability || []).forEach((slot) => {
        if (!slot.date) return;
        const slotDate = new Date(slot.date);
        const dayIndex = slotDate.getDay();
        const dayId = DAYS_OF_WEEK[dayIndex === 0 ? 6 : dayIndex - 1]?.id;
        
        if (dayId && schedule[dayId]) {
          schedule[dayId] = {
            isAvailable: true,
            startTime: slot.startTime || '09:00',
            endTime: slot.endTime || '17:00',
            slotDuration: slot.slotDuration ?? 20,
            breakStart: slot.breakStart || '',
            breakEnd: slot.breakEnd || '',
            consultationFee: slot.consultationFee !== undefined && slot.consultationFee !== null
              ? String(slot.consultationFee)
              : '',
            _id: slot._id
          };
        }
      });
      
      setWeeklySchedule(schedule);
    } catch (e) {
      console.error('loadWeeklySchedule error:', e);
      setMessage({ type: 'error', text: 'Network error loading weekly schedule' });
      setWeeklySchedule(initializeWeeklySchedule());
    } finally {
      setLoading(false);
    }
  }, [loggedInDoctorId, selectedWeek, initializeWeeklySchedule]);

  useEffect(() => {
    loadWeeklySchedule();
  }, [loadWeeklySchedule]);

  const handleDayToggle = (dayId) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        isAvailable: !prev[dayId].isAvailable
      }
    }));
  };

  const handleDayChange = (dayId, field, value) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
  };

  const saveWeeklySchedule = async () => {
    const id = loggedInDoctorId.trim();
    console.log('saveWeeklySchedule - Using doctor ID:', id);
    
    if (!id) {
      console.error('saveWeeklySchedule: No doctor ID available');
      setMessage({ type: 'error', text: 'Doctor authentication required. Please log in again.' });
      alert('Error: No doctor ID found. Cannot save schedule. Please log in again.');
      return;
    }

    // Double-check that we're using the logged-in user's ID
    if (user && (user._id || user.id || user.doctorId)) {
      const expectedId = user._id || user.id || user.doctorId;
      if (id !== expectedId) {
        console.error('Doctor ID mismatch:', { id, expectedId });
        setMessage({ type: 'error', text: 'Security error: Doctor ID mismatch' });
        return;
      }
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const weekStart = new Date(selectedWeek);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);

      const promises = [];
      
      DAYS_OF_WEEK.forEach((day, index) => {
        const schedule = weeklySchedule[day.id];
        console.log(`Processing ${day.name}:`, schedule);
        
        if (schedule.isAvailable) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + index);
          
          // Check if the date is in the past using local time
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);
          
          if (checkDate < today) {
            console.log(`Skipping ${day.name} - past date:`, date.toISOString().split('T')[0]);
            return; // Skip past dates
          }
          
          const dateStr = date.toISOString().split('T')[0];
          
          // Ensure we're always using the logged-in doctor's ID
          const body = {
            doctorId: id, // This should be the logged-in doctor's ID
            date: dateStr,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: Number(schedule.slotDuration) || 20,
            breakStart: schedule.breakStart || '',
            breakEnd: schedule.breakEnd || '',
            consultationFee: (() => {
              const s = schedule.consultationFee;
              if (s === '' || s === null || s === undefined) return null;
              const n = Number.parseFloat(String(s), 10);
              return Number.isNaN(n) ? null : n;
            })()
          };
          
          console.log(`Creating availability for ${day.name} with doctor ID ${id}:`, body);
          
          if (schedule._id) {
            // Update existing
            promises.push(
              fetch(`/api/doctors/availability/${schedule._id}?doctorId=${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(body)
              })
            );
          } else {
            // Create new
            promises.push(
              fetch('/api/doctors/availability', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(body)
              })
            );
          }
        } else if (schedule._id) {
          // Delete if was available but now is not
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + index);
          
          // Check if the date is in the past using local time
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);
          
          if (checkDate < today) {
            console.log(`Skipping deletion for ${day.name} - past date:`, date.toISOString().split('T')[0]);
            return; // Skip past dates
          }
          
          console.log(`Deleting availability for ${day.name} with doctor ID ${id}:`, schedule._id);
          promises.push(
            fetch(`/api/doctors/availability/${schedule._id}?doctorId=${encodeURIComponent(id)}`, {
              method: 'DELETE',
              headers: authHeaders()
            })
          );
        }
      });

      console.log('Making API calls for doctor ID:', id);
      const results = await Promise.all(promises);
      console.log('API results:', results);
      
      const hasErrors = results.some(res => !res.ok);
      
      if (hasErrors) {
        setMessage({ type: 'error', text: 'Some changes could not be saved' });
      } else {
        setMessage({ type: 'success', text: 'Weekly schedule saved successfully!' });
        await loadWeeklySchedule();
      }
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: 'Could not reach server' });
    } finally {
      setSaving(false);
    }
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
  };

  const getWeekDisplay = () => {
    const weekStart = new Date(selectedWeek);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
  };

  const isDateInPast = (date) => {
    const today = new Date();
    // Set both dates to the start of the day in UTC to avoid timezone issues
    today.setUTCHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setUTCHours(0, 0, 0, 0);
    return checkDate < today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-600">Loading weekly schedule…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-8 shadow-xl mb-8">
          <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">CareSync</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1">Weekly Schedule</h1>
          <p className="text-indigo-100 mt-2 max-w-2xl">
            Set your availability for each day of the week. Configure working hours, break times, and consultation fees.
          </p>
          {loggedInDoctorId && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-sm text-indigo-100">
                <strong>Logged-in Doctor ID:</strong> {loggedInDoctorId}
              </p>
            </div>
          )}
        </div>

        {message.text && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm whitespace-pre-wrap ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
            <button
              type="button"
              onClick={() => navigateWeek('prev')}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm"
            >
              ← Previous Week
            </button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-800">{getWeekDisplay()}</h2>
              <p className="text-xs text-slate-500 mt-1">Week of {selectedWeek.getFullYear()}</p>
            </div>
            <button
              type="button"
              onClick={() => navigateWeek('next')}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm"
            >
              Next Week →
            </button>
          </div>

          <div className="p-4">

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day, index) => {
                const schedule = weeklySchedule[day.id] || {};
                
                // Calculate the actual date for this day in the selected week
                const weekStart = new Date(selectedWeek);
                const dayOfWeek = weekStart.getDay();
                const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                weekStart.setDate(diff);
                
                const actualDate = new Date(weekStart);
                actualDate.setDate(weekStart.getDate() + index);
                
                // Use local time for comparison to be consistent with date calculation
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkDate = new Date(actualDate);
                checkDate.setHours(0, 0, 0, 0);
                const isPast = checkDate < today;
                const isToday = checkDate.getTime() === today.getTime();
                
                return (
                  <div key={day.id} className={`border rounded-xl p-4 ${isPast || isToday ? 'border-slate-300 bg-slate-100/50 opacity-75' : 'border-slate-200 bg-slate-50/30'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={schedule.isAvailable || false}
                            onChange={() => handleDayToggle(day.id)}
                            disabled={isPast}
                            className={`w-4 h-4 rounded focus:ring-indigo-500 ${
                              isPast 
                                ? 'text-slate-400 bg-slate-200 border-slate-300 cursor-not-allowed' 
                                : 'text-indigo-600'
                            }`}
                          />
                          <span className={`ml-2 font-semibold ${isPast || isToday ? 'text-slate-500' : 'text-slate-700'}`}>
                            {day.name}
                            {isToday && (
                              <span className="ml-2 text-xs text-indigo-600 font-normal">(Today)</span>
                            )}
                          </span>
                        </label>
                        {actualDate && (
                          <span className="text-xs text-slate-500">
                            {actualDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {schedule.isAvailable && (
                        <span className={`text-xs font-medium ${isPast || isToday ? 'text-slate-500' : 'text-emerald-600'}`}>
                          {isPast ? 'Past date' : 'Available'}
                        </span>
                      )}
                    </div>

                    {schedule.isAvailable && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={schedule.startTime || '09:00'}
                            onChange={(e) => handleDayChange(day.id, 'startTime', e.target.value)}
                            disabled={isPast}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isPast || isToday
                                ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed' 
                                : 'border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                          <input
                            type="time"
                            value={schedule.endTime || '17:00'}
                            onChange={(e) => handleDayChange(day.id, 'endTime', e.target.value)}
                            disabled={isPast}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isPast || isToday
                                ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed' 
                                : 'border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Slot Duration (min)</label>
                          <input
                            type="number"
                            min={5}
                            max={120}
                            step={5}
                            value={schedule.slotDuration || 20}
                            onChange={(e) => handleDayChange(day.id, 'slotDuration', parseInt(e.target.value, 10) || 20)}
                            disabled={isPast}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isPast || isToday
                                ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed' 
                                : 'border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Break Start</label>
                          <input
                            type="time"
                            value={schedule.breakStart || ''}
                            onChange={(e) => handleDayChange(day.id, 'breakStart', e.target.value)}
                            disabled={isPast}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isPast || isToday
                                ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed' 
                                : 'border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Break End</label>
                          <input
                            type="time"
                            value={schedule.breakEnd || ''}
                            onChange={(e) => handleDayChange(day.id, 'breakEnd', e.target.value)}
                            disabled={isPast}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isPast || isToday
                                ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed' 
                                : 'border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Fee (Rs.)</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={schedule.consultationFee || ''}
                            onChange={(e) => handleDayChange(day.id, 'consultationFee', e.target.value)}
                            placeholder="Optional"
                            disabled={isPast}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isPast || isToday
                                ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed' 
                                : 'border-slate-200'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                    {isPast && (
                      <div className="mt-3 text-xs text-slate-500 italic">
                        Past dates cannot be modified
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={saveWeeklySchedule}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? 'Saving…' : 'Save Weekly Schedule'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
