// src/components/appointment/BookingForm.jsx
import { useState } from 'react';
import { appointmentAPI } from '../services/api';

const STEPS = ['Select Slot', 'Your Details', 'Review & Book'];

export default function BookingForm({ slot, doctor, onSuccess, onCancel }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    date: '',
    timeSlot: { start: slot?.startTime || '', end: slot?.endTime || '' },
    reason: '',
    symptoms: '',
    additionalNotes: '',
    contactNumber: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'start' || name === 'end') {
      setForm(prev => ({
        ...prev,
        timeSlot: { ...prev.timeSlot, [name]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
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
      // For testing, just simulate success without API
      onSuccess(payload); 
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2 rounded border mb-3';

  return (
    <div className="p-4 border rounded-xl shadow-md max-w-xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Book Appointment</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}

      {step === 0 && (
        <div>
          <p>Doctor: {doctor.name} ({doctor.specialty})</p>
          <p>Slot: {slot.dayName}, {slot.startTime} - {slot.endTime}</p>
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className={inputClass}
          />
        </div>
      )}

      {step === 1 && (
        <div>
          <label>Reason</label>
          <input type="text" name="reason" value={form.reason} onChange={handleChange} className={inputClass} />
          <label>Symptoms</label>
          <input type="text" name="symptoms" value={form.symptoms} onChange={handleChange} className={inputClass} />
          <label>Contact Number</label>
          <input type="tel" name="contactNumber" value={form.contactNumber} onChange={handleChange} className={inputClass} />
        </div>
      )}

      {step === 2 && (
        <div>
          <p><strong>Review</strong></p>
          <p>Doctor: {doctor.name}</p>
          <p>Date: {form.date}</p>
          <p>Time: {form.timeSlot.start} - {form.timeSlot.end}</p>
          <p>Reason: {form.reason}</p>
          <p>Contact: {form.contactNumber}</p>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {step > 0 && <button onClick={() => setStep(s => s - 1)} className="border px-4 py-2 rounded">Back</button>}
        {step < STEPS.length - 1 && <button onClick={() => setStep(s => s + 1)} className="bg-blue-500 text-white px-4 py-2 rounded">Next</button>}
        {step === STEPS.length - 1 && <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded">{loading ? 'Booking...' : 'Confirm'}</button>}
        <button onClick={onCancel} className="border px-4 py-2 rounded">Cancel</button>
      </div>
    </div>
  );
}