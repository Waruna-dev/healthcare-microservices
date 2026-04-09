import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Phone, FileText, Activity, DollarSign } from 'lucide-react';
import { appointmentAPI } from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const AppointmentForm = ({ patientId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    additionalNotes: '',
    contactNumber: '',
    symptoms: ''
  });

  // Fetch available slots when date changes
  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await appointmentAPI.getAvailableSlots(null, dateStr);
      setAvailableSlots(response.availability || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load available slots');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    
    setLoading(true);
    try {
      const appointmentData = {
        availabilityId: selectedSlot._id,
        doctorId: selectedSlot.doctorId,
        date: selectedDate.toISOString().split('T')[0],
        timeSlot: {
          start: selectedSlot.startTime,
          end: selectedSlot.endTime
        },
        reason: formData.reason,
        additionalNotes: formData.additionalNotes,
        contactNumber: formData.contactNumber,
        symptoms: formData.symptoms
      };
      
      const response = await appointmentAPI.createAppointment(appointmentData);
      toast.success('Appointment booked successfully!');
      navigate('/my-appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Book an Appointment</h1>
        <p className="text-on-surface-variant mt-2">Schedule a consultation with our expert doctors</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Date and Time Selection */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Select Date & Time
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Choose Date</label>
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date()}
              className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
              dateFormat="MMMM d, yyyy"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Available Time Slots</label>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {availableSlots.length === 0 ? (
                <p className="text-on-surface-variant col-span-2 text-center py-8">
                  No available slots for this date
                </p>
              ) : (
                availableSlots.map((slot) => (
                  <button
                    key={slot._id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      selectedSlot?._id === slot._id
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-outline-variant hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <div className="text-xs text-on-surface-variant mt-1">
                      Dr. {slot.doctorName} • {slot.doctorSpecialty}
                    </div>
                    <div className="text-xs text-primary mt-1 flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Rs. {slot.consultationFee || 1500}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Patient Details Form */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Appointment Details
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Contact Number *
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                required
                placeholder="0771234567"
                className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Reason for Visit *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                required
                rows="3"
                placeholder="Describe your symptoms or reason for consultation"
                className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                <Activity className="w-4 h-4 inline mr-1" />
                Symptoms
              </label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                rows="2"
                placeholder="List your symptoms (optional)"
                className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Additional Notes</label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                rows="2"
                placeholder="Any additional information for the doctor"
                className="w-full px-4 py-2 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
            
            {selectedSlot && (
              <div className="p-3 bg-primary/10 rounded-xl">
                <p className="text-sm font-medium">Consultation Fee: Rs. {selectedSlot.consultationFee || 1500}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || !selectedSlot}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;