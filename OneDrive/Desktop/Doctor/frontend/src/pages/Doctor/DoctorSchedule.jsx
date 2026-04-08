import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/** API date → YYYY-MM-DD (UTC calendar day, matches backend storage) */
function ymdFromApiDate(iso) {
  if (!iso) return null;
  const x = new Date(iso);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, '0');
  const d = String(x.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthRangeYmd(year, monthIndex) {
  const start = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const end = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

const DAYS_HEADER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function authHeaders() {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

const DoctorSchedule = () => {
  const { user } = useAuth();
  const loggedInDoctorId = user?._id || user?.id || '';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthSlots, setMonthSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [calendarRefreshing, setCalendarRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalYmd, setModalYmd] = useState('');
  const [modalForm, setModalForm] = useState({
    doctorId: loggedInDoctorId,
    _id: null,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 20,
    breakStart: '',
    breakEnd: '',
    consultationFee: ''
  });

  const loadSchedule = useCallback(async (opts = {}) => {
    const quiet = Boolean(opts.quiet);
    const id = loggedInDoctorId.trim();
    if (!id) {
      setMonthSlots({});
      setLoading(false);
      setCalendarRefreshing(false);
      return;
    }
    if (quiet) {
      setCalendarRefreshing(true);
    } else {
      setLoading(true);
    }
    setMessage({ type: '', text: '' });
    try {
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      const { start, end } = monthRangeYmd(y, m);
      const res = await fetch(
        `/api/doctors/availability/doctor/${encodeURIComponent(id)}?start=${start}&end=${end}&includeInactive=true`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.message || 'Could not load availability' });
        setMonthSlots({});
        setLoading(false);
        setCalendarRefreshing(false);
        return;
      }
      const map = {};
      (data.availability || []).forEach((slot) => {
        if (!slot.date) return;
        const k = ymdFromApiDate(slot.date);
        if (k) map[k] = slot;
      });
      setMonthSlots(map);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Network error loading schedule' });
      setMonthSlots({});
    } finally {
      setLoading(false);
      setCalendarRefreshing(false);
    }
  }, [loggedInDoctorId, currentMonth]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const openDayModal = (ymd) => {
    const existing = monthSlots[ymd];
    setModalYmd(ymd);
    if (existing) {
      setModalForm({
        doctorId: loggedInDoctorId,
        _id: existing._id,
        startTime: existing.startTime || '09:00',
        endTime: existing.endTime || '17:00',
        slotDuration: existing.slotDuration ?? 20,
        breakStart: existing.breakStart || '',
        breakEnd: existing.breakEnd || '',
        consultationFee:
          existing.consultationFee !== undefined && existing.consultationFee !== null
            ? String(existing.consultationFee)
            : ''
      });
    } else {
      setModalForm({
        doctorId: loggedInDoctorId,
        _id: null,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 20,
        breakStart: '',
        breakEnd: '',
        consultationFee: ''
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalYmd('');
  };

  const loadMonthFromModal = async () => {
    const id = loggedInDoctorId.trim();
    if (!id) {
      setMessage({ type: 'error', text: 'Doctor authentication required.' });
      return;
    }
    try {
      await loadSchedule({ quiet: true });
      setMessage({ type: 'success', text: 'Calendar loaded for this month.' });
    } catch (e) {
      console.error(e);
    }
  };

  const saveDay = async (e) => {
    e.preventDefault();
    const id = loggedInDoctorId.trim();
    if (!id) {
      setMessage({ type: 'error', text: 'Doctor authentication required.' });
      return;
    }
    
    // Check if the date is past or today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(modalYmd + 'T00:00:00');
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate <= today) {
      setMessage({ type: 'error', text: 'Cannot schedule availability for past dates or today. Only future dates are allowed.' });
      return;
    }
    
    setSaving(true);
    try {
      const body = {
        doctorId: id,
        date: modalYmd,
        startTime: modalForm.startTime,
        endTime: modalForm.endTime,
        slotDuration: Number(modalForm.slotDuration) || 20,
        breakStart: modalForm.breakStart || '',
        breakEnd: modalForm.breakEnd || '',
        consultationFee: (() => {
          const s = modalForm.consultationFee;
          if (s === '' || s === null || s === undefined) return null;
          const n = Number.parseFloat(String(s), 10);
          return Number.isNaN(n) ? null : n;
        })()
      };
      const res = await fetch('/api/doctors/availability', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Saved' });
        closeModal();
        await loadSchedule({ quiet: true });
      } else {
        setMessage({ type: 'error', text: data.message || 'Save failed' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Could not reach server' });
    } finally {
      setSaving(false);
    }
  };

  const deleteDaySlot = async () => {
    const id = loggedInDoctorId.trim();
    if (!modalForm._id || !id) return;
    if (!window.confirm('Remove availability for this date?')) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/doctors/availability/${modalForm._id}?doctorId=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: authHeaders()
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Removed' });
        closeModal();
        await loadSchedule({ quiet: true });
      } else {
        setMessage({ type: 'error', text: data.message || 'Delete failed' });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Could not reach server' });
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out = [];
    
    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < firstDay; i++) {
      out.push({ empty: true, key: `e-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const slot = monthSlots[ymd];
      
      // Check if this date is in the past or today
      const checkDate = new Date(year, month, d);
      checkDate.setHours(0, 0, 0, 0);
      const isPastOrToday = checkDate <= today;
      
      out.push({
        empty: false,
        key: `d-${d}`,
        date: d,
        ymd,
        slot,
        isPastOrToday
      });
    }
    return out;
  }, [currentMonth, monthSlots]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-600">Loading schedule…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-8 shadow-xl mb-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">CareSync</p>
              <h1 className="text-3xl sm:text-4xl font-bold mt-1">Schedule by date</h1>
              <p className="text-indigo-100 mt-2 max-w-2xl">
                Click a date to set your availability. The schedule is automatically associated with your logged-in doctor account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor/weekly-schedule')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white text-sm font-medium transition-colors backdrop-blur-sm"
            >
              📅 Weekly Schedule
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
            <button
              type="button"
              onClick={prevMonth}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm"
            >
              ← Prev
            </button>
            <h2 className="text-lg font-bold text-slate-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm"
            >
              Next →
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {DAYS_HEADER.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day) =>
                day.empty ? (
                  <div key={day.key} className="min-h-[96px] rounded-xl bg-slate-50/50" />
                ) : (
                  <div
                    key={day.key}
                    className={`min-h-[96px] rounded-xl border p-2 flex flex-col text-left transition ${
                      day.isPastOrToday
                        ? 'border-slate-400 bg-slate-200/70 opacity-75'
                        : day.slot
                        ? 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/80'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => !day.isPastOrToday && openDayModal(day.ymd)}
                      disabled={day.isPastOrToday}
                      className={`flex-1 flex flex-col text-left ${
                        day.isPastOrToday ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <span className={`text-sm font-bold ${day.isPastOrToday ? 'text-slate-600' : 'text-slate-800'}`}>
                        {day.date}
                        {day.isPastOrToday && (
                          <span className="ml-1 text-xs text-slate-500">
                            {new Date().getDate() === day.date && 
                             new Date().getMonth() === currentMonth.getMonth() && 
                             new Date().getFullYear() === currentMonth.getFullYear() ? '(Today)' : '(Past)'}
                          </span>
                        )}
                      </span>
                      {day.slot ? (
                        <>
                          <span className={`mt-1 text-[11px] font-medium leading-tight ${
                            day.isPastOrToday ? 'text-slate-600' : 'text-emerald-900'
                          }`}>
                            {day.slot.startTime}–{day.slot.endTime}
                          </span>
                          {day.slot.consultationFee != null && (
                            <span className={`mt-auto text-[10px] font-semibold ${
                              day.isPastOrToday ? 'text-slate-600' : 'text-emerald-800'
                            }`}>
                              Rs. {day.slot.consultationFee}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className={`mt-auto text-[10px] ${
                          day.isPastOrToday ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {day.isPastOrToday ? 'Past date' : 'Tap to add'}
                        </span>
                      )}
                    </button>
                    {day.slot && !day.isPastOrToday && (
                      <button
                        type="button"
                        onClick={() => navigate(`/doctor/slots/${day.ymd}`)}
                        className="mt-2 px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
                      >
                        📅 View Slots
                      </button>
                    )}
                    {day.slot && day.isPastOrToday && (
                      <button
                        type="button"
                        onClick={() => navigate(`/doctor/slots/${day.ymd}`)}
                        className="mt-2 px-2 py-1 bg-slate-500 text-white text-xs font-medium rounded cursor-pointer opacity-75"
                        title="View past slots (read-only)"
                      >
                        📅 View Slots
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500 text-center">
          Your schedule is automatically associated with your logged-in doctor account. Click any date to add or modify availability.
        </p>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Availability — {modalYmd}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-800 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={saveDay} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Doctor ID <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Stored in this browser as <code className="bg-slate-100 px-1 rounded">scheduleDoctorId</code> when you
                  save or load.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={loggedInDoctorId}
                    disabled
                    placeholder="Logged-in Doctor ID"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 text-slate-600"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={loadMonthFromModal}
                    disabled={
                      saving || calendarRefreshing
                    }
                    className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {calendarRefreshing ? 'Loading…' : 'Refresh calendar'}
                  </button>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-600">Date:</span> {modalYmd}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start</label>
                  <input
                    type="time"
                    value={modalForm.startTime}
                    onChange={(e) => setModalForm((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End</label>
                  <input
                    type="time"
                    value={modalForm.endTime}
                    onChange={(e) => setModalForm((p) => ({ ...p, endTime: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Slot (minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  step={5}
                  value={modalForm.slotDuration}
                  onChange={(e) =>
                    setModalForm((p) => ({ ...p, slotDuration: parseInt(e.target.value, 10) || 20 }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Break start</label>
                  <input
                    type="time"
                    value={modalForm.breakStart}
                    onChange={(e) => setModalForm((p) => ({ ...p, breakStart: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Break end</label>
                  <input
                    type="time"
                    value={modalForm.breakEnd}
                    onChange={(e) => setModalForm((p) => ({ ...p, breakEnd: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Consultation fee (Rs.) — optional
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={modalForm.consultationFee}
                  onChange={(e) => setModalForm((p) => ({ ...p, consultationFee: e.target.value }))}
                  placeholder="e.g. 1500"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                {modalForm._id && (
                  <button
                    type="button"
                    onClick={deleteDaySlot}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove this date
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedule;
