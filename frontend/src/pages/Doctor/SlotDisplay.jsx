import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveDoctorIdForApi } from '../../utils/doctorId';

function hasDoctorId(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

function readInitialDoctorId() {
  try {
    const saved = localStorage.getItem('scheduleDoctorId');
    if (saved?.trim()) return saved.trim();
    const { id } = resolveDoctorIdForApi();
    if (id && String(id).trim()) return String(id).trim();
  } catch {}
  const envId = import.meta.env.VITE_DEFAULT_DOCTOR_ID;
  if (envId && String(envId).trim()) return String(envId).trim();
  return '';
}

function authHeaders() {
  const token = localStorage.getItem('doctorToken');
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function generateTimeSlots(startTime, endTime, slotDuration, breakStart = '', breakEnd = '') {
  const slots = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const breakStartMinutes = breakStart ? timeToMinutes(breakStart) : null;
  const breakEndMinutes = breakEnd ? timeToMinutes(breakEnd) : null;
  
  let currentTime = startMinutes;
  
  while (currentTime + slotDuration <= endMinutes) {
    // Check if this slot overlaps with break time
    const slotEnd = currentTime + slotDuration;
    
    if (breakStartMinutes && breakEndMinutes) {
      // If slot is entirely during break, skip it
      if (currentTime >= breakStartMinutes && slotEnd <= breakEndMinutes) {
        currentTime += slotDuration;
        continue;
      }
      
      // If slot overlaps with break, adjust start time
      if (currentTime < breakStartMinutes && slotEnd > breakStartMinutes) {
        currentTime = breakEndMinutes;
        continue;
      }
    }
    
    slots.push({
      startTime: minutesToTime(currentTime),
      endTime: minutesToTime(slotEnd),
      duration: slotDuration
    });
    
    currentTime += slotDuration;
  }
  
  return slots;
}

const SlotDisplay = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const [doctorId, setDoctorId] = useState(() => readInitialDoctorId());
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadAvailability = async () => {
      const id = doctorId.trim();
      if (!hasDoctorId(id) || !date) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const res = await fetch(
          `/api/doctors/availability/doctor/${encodeURIComponent(id)}?start=${date}&end=${date}&includeInactive=true`,
          { headers: authHeaders() }
        );
        
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          setMessage({ type: 'error', text: data.message || 'Could not load availability' });
          setAvailability(null);
          return;
        }

        const availabilityData = data.availability && data.availability.length > 0 ? data.availability[0] : null;
        setAvailability(availabilityData);
      } catch (e) {
        console.error(e);
        setMessage({ type: 'error', text: 'Network error loading availability' });
        setAvailability(null);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [doctorId, date]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const slots = availability ? generateTimeSlots(
    availability.startTime,
    availability.endTime,
    availability.slotDuration || 20,
    availability.breakStart,
    availability.breakEnd
  ) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-600">Loading slots…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-8 shadow-xl mb-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">CareSync</p>
              <h1 className="text-3xl sm:text-4xl font-bold mt-1">Available Slots</h1>
              <p className="text-indigo-100 mt-2 max-w-2xl">
                {date ? formatDate(date) : 'Select a date'} - Available time slots for appointments
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor/schedule')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white text-sm font-medium transition-colors backdrop-blur-sm"
            >
              ← Back to Schedule
            </button>
          </div>
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

        {!availability ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No Availability Set</h2>
            <p className="text-slate-600 mb-6">
              This date is not marked as available. Please set up availability for this date first.
            </p>
            <button
              type="button"
              onClick={() => navigate('/doctor/schedule')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Set Up Schedule
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/80">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-slate-600">Date:</span>
                  <span className="ml-2 text-slate-800">{formatDate(date)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Working Hours:</span>
                  <span className="ml-2 text-slate-800">
                    {availability.startTime} - {availability.endTime}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Slot Duration:</span>
                  <span className="ml-2 text-slate-800">{availability.slotDuration || 20} minutes</span>
                </div>
                {availability.breakStart && availability.breakEnd && (
                  <div className="md:col-span-3">
                    <span className="font-semibold text-slate-600">Break Time:</span>
                    <span className="ml-2 text-slate-800">
                      {availability.breakStart} - {availability.breakEnd}
                    </span>
                  </div>
                )}
                {availability.consultationFee && (
                  <div className="md:col-span-3">
                    <span className="font-semibold text-slate-600">Consultation Fee:</span>
                    <span className="ml-2 text-slate-800">Rs. {availability.consultationFee}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Available Time Slots</h3>
              
              {slots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">No time slots available for this configuration.</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Please check the working hours and slot duration settings.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Slot #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Start Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          End Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {slots.map((slot, index) => (
                        <tr key={index} className="hover:bg-indigo-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800">
                            {slot.startTime}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800">
                            {slot.endTime}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800">
                            {slot.duration} min
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                              Available
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Total Slots:</span>
                    <span className="ml-2 font-semibold text-blue-800">{slots.length}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Total Hours:</span>
                    <span className="ml-2 font-semibold text-blue-800">
                      {((slots.length * (availability.slotDuration || 20)) / 60).toFixed(1)} hrs
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Break Time:</span>
                    <span className="ml-2 font-semibold text-blue-800">
                      {availability.breakStart && availability.breakEnd 
                        ? `${availability.breakStart} - ${availability.breakEnd}`
                        : 'No break'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotDisplay;
