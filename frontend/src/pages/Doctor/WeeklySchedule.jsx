import React, { useState, useEffect, useCallback } from 'react';

function hasDoctorId(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

function readInitialDoctorId() {
  try {
    const saved = localStorage.getItem('scheduleDoctorId');
    if (saved?.trim()) return saved.trim();
  } catch {}
  return '';
}

function authHeaders() {
  const token = localStorage.getItem('doctorToken');
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
  const [doctorId, setDoctorId] = useState(() => readInitialDoctorId());
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(() => {
    const id = readInitialDoctorId();
    return hasDoctorId(id);
  });
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

  const loadWeeklySchedule = useCallback(async (idOverride) => {
    const id = (typeof idOverride === 'string' ? idOverride : doctorId).trim();
    if (!hasDoctorId(id)) {
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
      
      const res = await fetch(
        `/api/doctors/availability/doctor/${encodeURIComponent(id)}?start=${startDate}&end=${endDate}&includeInactive=true`,
        { headers: authHeaders() }
      );
      
      const data = await res.json();
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
      console.error(e);
      setMessage({ type: 'error', text: 'Network error loading weekly schedule' });
      setWeeklySchedule(initializeWeeklySchedule());
    } finally {
      setLoading(false);
    }
  }, [doctorId, selectedWeek, initializeWeeklySchedule]);

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
    const id = doctorId.trim();
    if (!hasDoctorId(id)) {
      setMessage({ type: 'error', text: 'Please enter a Doctor ID' });
      return;
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
          const dateStr = date.toISOString().split('T')[0];
          
          const body = {
            doctorId: id,
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
          
          console.log(`Creating availability for ${day.name}:`, body);
          
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
          console.log(`Deleting availability for ${day.name}:`, schedule._id);
          promises.push(
            fetch(`/api/doctors/availability/${schedule._id}?doctorId=${encodeURIComponent(id)}`, {
              method: 'DELETE',
              headers: authHeaders()
            })
          );
        }
      });

      console.log('Making API calls...');
      const results = await Promise.all(promises);
      console.log('API results:', results);
      
      const hasErrors = results.some(res => !res.ok);
      
      if (hasErrors) {
        setMessage({ type: 'error', text: 'Some changes could not be saved' });
      } else {
        setDoctorId(id);
        localStorage.setItem('scheduleDoctorId', id);
        setMessage({ type: 'success', text: 'Weekly schedule saved successfully!' });
        await loadWeeklySchedule(id);
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
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Doctor ID <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  placeholder="Enter Doctor ID"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => loadWeeklySchedule(doctorId)}
                  disabled={!hasDoctorId(doctorId)}
                  className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Load Schedule
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const schedule = weeklySchedule[day.id] || {};
                return (
                  <div key={day.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={schedule.isAvailable || false}
                            onChange={() => handleDayToggle(day.id)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-2 font-semibold text-slate-700">{day.name}</span>
                        </label>
                      </div>
                      {schedule.isAvailable && (
                        <span className="text-xs text-emerald-600 font-medium">Available</span>
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
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                          <input
                            type="time"
                            value={schedule.endTime || '17:00'}
                            onChange={(e) => handleDayChange(day.id, 'endTime', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Break Start</label>
                          <input
                            type="time"
                            value={schedule.breakStart || ''}
                            onChange={(e) => handleDayChange(day.id, 'breakStart', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Break End</label>
                          <input
                            type="time"
                            value={schedule.breakEnd || ''}
                            onChange={(e) => handleDayChange(day.id, 'breakEnd', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
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
                disabled={saving || !hasDoctorId(doctorId)}
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
