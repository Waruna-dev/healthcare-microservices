// src/components/appointment/BookingForm.jsx
import { useState } from 'react';
import { appointmentAPI } from '../../services/api';

const STEPS = ['Select Slot', 'Your Details', 'Review & Book'];

export default function BookingForm({ slot, doctor, contactNumber = '', onSuccess, onCancel }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    date: '',
    timeSlot: { start: slot?.startTime || '', end: slot?.endTime || '' },
    reason: '',
    symptoms: '',
    additionalNotes: '',
    contactNumber: contactNumber,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        availabilityId: slot._id,
        doctorId: slot.doctorId,
        date: form.date,
        timeSlot: form.timeSlot,
        reason: form.reason,
        symptoms: form.symptoms,
        additionalNotes: form.additionalNotes,
        contactNumber: form.contactNumber,
      };
      const data = await appointmentAPI.createAppointment(payload);
      if (data.success) {
        onSuccess(data.appointment);
      } else {
        setError(data.message || 'Booking failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface font-body text-sm transition-all';
  const labelClass = 'block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide';

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 w-full max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline text-xl font-bold text-on-surface">Book Appointment</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {doctor?.name} · {doctor?.specialty}
          </p>
        </div>
        <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < step ? 'bg-secondary text-white' : i === step ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-on-surface-variant'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-secondary' : 'bg-outline-variant'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0 - Select Slot */}
      {step === 0 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-on-surface text-sm">{slot?.dayName} · {slot?.startTime} – {slot?.endTime}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Duration: {slot?.slotDuration} min per slot</p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Appointment Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={inputClass}
              required
            />
            <p className="text-xs text-on-surface-variant mt-1">Pick a date that falls on a <strong>{slot?.dayName}</strong></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start Time</label>
              <input type="time" name="start" value={form.timeSlot.start}
                onChange={e => setForm(p => ({ ...p, timeSlot: { ...p.timeSlot, start: e.target.value } }))}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>End Time</label>
              <input type="time" name="end" value={form.timeSlot.end}
                onChange={e => setForm(p => ({ ...p, timeSlot: { ...p.timeSlot, end: e.target.value } }))}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* Step 1 - Your Details */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label className={labelClass}>Reason for Visit</label>
            <input
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="e.g. Annual checkup, chest pain..."
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Symptoms</label>
            <textarea
              name="symptoms"
              value={form.symptoms}
              onChange={handleChange}
              placeholder="Describe your symptoms in detail..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className={labelClass}>Additional Notes</label>
            <textarea
              name="additionalNotes"
              value={form.additionalNotes}
              onChange={handleChange}
              placeholder="Any other information for the doctor..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className={labelClass}>Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              placeholder="07X XXX XXXX"
              className={inputClass}
              required
            />
          </div>
        </div>
      )}

      {/* Step 2 - Review */}
      {step === 2 && (
        <div className="space-y-3 animate-fadeIn">
          <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
            <ReviewRow label="Doctor" value={`${doctor?.name} (${doctor?.specialty})`} />
            <ReviewRow label="Day" value={slot?.dayName} />
            <ReviewRow label="Date" value={form.date} />
            <ReviewRow label="Time" value={`${form.timeSlot.start} – ${form.timeSlot.end}`} />
            <ReviewRow label="Reason" value={form.reason} />
            {form.symptoms && <ReviewRow label="Symptoms" value={form.symptoms} />}
            <ReviewRow label="Contact" value={form.contactNumber} />
            <div className="border-t border-outline-variant pt-3 flex justify-between">
              <span className="font-semibold text-sm text-on-surface">Consultation Fee</span>
              <span className="font-bold text-primary">LKR {doctor?.consultationFee || 1500}</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant text-center">
            Payment will be required only after the doctor <strong>accepts</strong> your appointment.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container-low transition-all">
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && !form.date}
            className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 transition-all">
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Booking...</>
            ) : 'Confirm Booking'}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs text-on-surface-variant font-medium">{label}</span>
      <span className="text-xs text-on-surface font-semibold text-right">{value}</span>
    </div>
  );
}