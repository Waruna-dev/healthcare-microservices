import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AppointmentBooking = ({ patientId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState(null);
  const [weeklySlots, setWeeklySlots] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState('');
  const [formData, setFormData] = useState({
    contactNumber: '',
    reason: '',
    symptoms: '',
    additionalNotes: ''
  });

  // Get patient info from localStorage
  const getPatientInfo = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return {
          patientId: user._id || user.id,
          patientName: user.name || 'Patient',
          patientEmail: user.email || 'patient@example.com'
        };
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    return {
      patientId: patientId || '67e8a1b2c3d4e5f6a7b8c9d1',
      patientName: 'Test Patient',
      patientEmail: 'test@example.com'
    };
  };

  useEffect(() => {
    const doctorFromState = location.state?.doctor;
    if (doctorFromState) {
      setSelectedDoctor(doctorFromState);
      fetchWeeklySchedule(doctorFromState);
      setCurrentStep(2);
      setLoading(false);
    } else {
      fetchDoctors();
    }
  }, [location]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/doctors');
      if (response.ok) {
        const data = await response.json();
        const doctorsList = data.doctors || data;
        const availableDoctors = doctorsList.filter(d => d.isAvailable && d.status === 'approved');
        setDoctors(availableDoctors);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setLoading(false);
    }
  };

  const fetchWeeklySchedule = async (doctor) => {
    try {
      setLoading(true);
      
      console.log('Fetching schedule for doctor:', doctor._id);
      
      const response = await fetch(`http://localhost:5025/api/doctors/availability/doctor/${doctor._id}`);
      const data = await response.json();
      
      console.log('Availability data:', data);
      
      let weeklySchedule = [];
      
      if (data.success && data.availability && data.availability.length > 0) {
        const groupedByDay = {};
        
        data.availability.forEach(avail => {
          if (avail.isActive === true) {
            const dateObj = new Date(avail.date);
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            
            const dayKey = avail.dayName;
            
            if (!groupedByDay[dayKey]) {
              groupedByDay[dayKey] = {
                dayName: avail.dayName,
                date: formattedDate,
                fullDate: avail.date,
                dayOfWeek: avail.dayOfWeek,
                slots: [],
                availabilityId: avail._id,
                startTime: avail.startTime,
                endTime: avail.endTime,
                slotDuration: avail.slotDuration
              };
            }
            
            const slots = generateTimeSlotsFromAvailability(avail, doctor);
            groupedByDay[dayKey].slots = slots;
          }
        });
        
        weeklySchedule = Object.values(groupedByDay);
        weeklySchedule.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      }
      
      console.log('Weekly schedule:', weeklySchedule);
      setWeeklySlots(weeklySchedule);
      
      if (weeklySchedule.length === 0) {
        toast.error('No availability schedule found for this doctor');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load doctor schedule');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlotsFromAvailability = (availability, doctor) => {
    const slots = [];
    const startHour = parseInt(availability.startTime.split(':')[0]);
    const startMinute = parseInt(availability.startTime.split(':')[1]);
    const endHour = parseInt(availability.endTime.split(':')[0]);
    const endMinute = parseInt(availability.endTime.split(':')[1]);
    const slotDuration = availability.slotDuration || 30;
    
    const baseFee = availability.consultationFee || doctor.consultationFee || 1500;
    
    const breakStart = availability.breakStart ? availability.breakStart.split(':') : null;
    const breakEnd = availability.breakEnd ? availability.breakEnd.split(':') : null;
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      let isBreakTime = false;
      if (breakStart && breakEnd) {
        const breakStartHour = parseInt(breakStart[0]);
        const breakStartMinute = parseInt(breakStart[1]);
        const breakEndHour = parseInt(breakEnd[0]);
        const breakEndMinute = parseInt(breakEnd[1]);
        
        if ((currentHour > breakStartHour || (currentHour === breakStartHour && currentMinute >= breakStartMinute)) &&
            (currentHour < breakEndHour || (currentHour === breakEndHour && currentMinute < breakEndMinute))) {
          isBreakTime = true;
        }
      }
      
      if (!isBreakTime) {
        let endHourCalc = currentHour;
        let endMinuteCalc = currentMinute + slotDuration;
        if (endMinuteCalc >= 60) {
          endHourCalc++;
          endMinuteCalc -= 60;
        }
        const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`;
        
        let fee = baseFee;
        if (currentHour === 9) fee = Math.max(500, baseFee - 200);
        else if (currentHour === 12 || currentHour === 13) fee = Math.max(500, baseFee - 100);
        else if (currentHour === 10 || currentHour === 11) fee = baseFee + 200;
        
        slots.push({
          time: time,
          endTime: endTime,
          fee: fee,
          isAvailable: true
        });
      }
      
      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour++;
        currentMinute -= 60;
      }
    }
    
    return slots;
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    fetchWeeklySchedule(doctor);
    setCurrentStep(2);
  };

  const handleSelectTimeSlot = (slot, daySchedule) => {
    setSelectedTimeSlot({
      time: slot.time,
      endTime: slot.endTime,
      dayName: daySchedule.dayName,
      date: daySchedule.fullDate,
      formattedDate: daySchedule.date,
      fee: slot.fee,
      availabilityId: daySchedule.availabilityId
    });
    setCurrentStep(3);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    
    if (!formData.contactNumber) {
      toast.error('Please enter your contact number');
      return;
    }
    if (!formData.reason) {
      toast.error('Please enter the reason for visit');
      return;
    }

    setSubmitting(true);
    
    try {
      const patientInfo = getPatientInfo();
      
      const appointmentData = {
        doctorId: selectedDoctor._id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialty,
        consultationFee: selectedTimeSlot.fee,
        availabilityId: selectedTimeSlot.availabilityId,
        patientId: patientInfo.patientId,
        patientName: patientInfo.patientName,
        patientEmail: patientInfo.patientEmail,
        patientContact: formData.contactNumber,
        date: selectedTimeSlot.date,
        timeSlot: {
          start: selectedTimeSlot.time,
          end: selectedTimeSlot.endTime
        },
        reason: formData.reason,
        additionalNotes: formData.additionalNotes,
        symptoms: formData.symptoms,
        status: 'pending',
        paymentStatus: 'pending'
      };

      console.log('Submitting appointment data:', appointmentData);
      
      // Try multiple endpoints if needed
      let response;
      try {
        response = await appointmentAPI.createAppointment(appointmentData);
      } catch (apiError) {
        console.log('API call failed, trying direct fetch:', apiError);
        
        // Fallback to direct fetch
        const directResponse = await fetch('http://localhost:5000/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appointmentData)
        });
        response = await directResponse.json();
      }
      
      console.log('Appointment response:', response);
      
      if (response.success) {
        // Save to localStorage for dashboard
        const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const newAppointment = {
          id: response.appointment?._id || Date.now().toString(),
          doctorName: selectedDoctor.name,
          doctorSpecialty: selectedDoctor.specialty,
          date: selectedTimeSlot.formattedDate,
          time: `${selectedTimeSlot.time} - ${selectedTimeSlot.endTime}`,
          fee: selectedTimeSlot.fee,
          reason: formData.reason,
          contactNumber: formData.contactNumber,
          status: 'confirmed'
        };
        existingAppointments.push(newAppointment);
        localStorage.setItem('appointments', JSON.stringify(existingAppointments));
        
        const details = `
          ✅ Appointment Confirmed!<br><br>
          <strong>Doctor:</strong> ${selectedDoctor.name}<br>
          <strong>Specialty:</strong> ${selectedDoctor.specialty}<br>
          <strong>Date:</strong> ${selectedTimeSlot.formattedDate}<br>
          <strong>Time:</strong> ${selectedTimeSlot.time} - ${selectedTimeSlot.endTime}<br>
          <strong>Fee:</strong> Rs. ${selectedTimeSlot.fee}<br>
          <strong>Contact:</strong> ${formData.contactNumber}<br>
          <strong>Reason:</strong> ${formData.reason}
        `;
        
        setConfirmationDetails(details);
        setShowSuccessModal(true);
        toast.success('Appointment booked successfully!');
        
        setTimeout(() => {
          setShowSuccessModal(false);
          resetWorkflow();
          navigate('/dashboard');
        }, 3000);
      } else {
        toast.error(response.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetWorkflow = () => {
    setSelectedDoctor(null);
    setSelectedTimeSlot(null);
    setWeeklySlots([]);
    setFormData({
      contactNumber: '',
      reason: '',
      symptoms: '',
      additionalNotes: ''
    });
    setCurrentStep(1);
  };

  const filteredDoctors = doctors.filter(doctor => doctor.isAvailable);

  if (loading && currentStep === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Step 1: Doctor selection screen
  if (!selectedDoctor && currentStep === 1) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-on-surface">🏥 Select a Doctor</h1>
          <p className="text-on-surface-variant mt-2">Choose a doctor to book your appointment</p>
        </div>
        
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-on-surface-variant">No doctors available at the moment.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-2 bg-primary text-white rounded-xl">
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor._id}
                onClick={() => handleSelectDoctor(doctor)}
                className="bg-white rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-primary"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-container rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {doctor.name?.charAt(0) || 'D'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-on-surface">{doctor.name}</h3>
                    <p className="text-primary text-sm font-semibold">{doctor.specialty}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
                      <span>⭐ {doctor.rating || 4.5}</span>
                      <span>📅 {doctor.experience || 0} yrs</span>
                      <span className="text-secondary font-bold">💰 Rs. {doctor.consultationFee || 1500}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Weekly Schedule View with Dates
  if (currentStep === 2 && selectedDoctor) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-on-surface">📅 Available Appointment Times</h1>
          <p className="text-on-surface-variant mt-2">
            Select your preferred date and time for {selectedDoctor?.name}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Doctor Info */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-5 rounded-2xl mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-primary to-primary-container rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {selectedDoctor?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{selectedDoctor?.name}</h3>
                  <p className="text-primary font-semibold">{selectedDoctor?.specialty}</p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    ⭐ {selectedDoctor?.rating || 4.5} • 📅 {selectedDoctor?.experience || 0} yrs
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-on-surface-variant">Loading schedule...</p>
              </div>
            ) : weeklySlots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-on-surface-variant">No availability schedule found for this doctor.</p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="mt-4 px-4 py-2 text-primary hover:underline"
                >
                  ← Choose another doctor
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {weeklySlots.map((daySchedule) => (
                  <div key={daySchedule.dayName} className="border-b border-gray-100 pb-6 last:border-0">
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      {daySchedule.date}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {daySchedule.startTime} - {daySchedule.endTime} | {daySchedule.slotDuration} min slots
                    </p>
                    {daySchedule.slots.length === 0 ? (
                      <p className="text-sm text-gray-400">No available slots</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {daySchedule.slots.map((slot, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectTimeSlot(slot, daySchedule)}
                            className="p-3 rounded-xl text-center transition-all border-2 hover:border-primary hover:bg-primary/5 group"
                          >
                            <div className="font-bold text-base">{slot.time}</div>
                            <div className="text-xs mt-1 text-secondary font-semibold group-hover:text-primary">
                              💰 Rs. {slot.fee}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-start p-6 border-t">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              ← Back to Doctors
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Appointment form screen
  if (currentStep === 3 && selectedDoctor && selectedTimeSlot) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-on-surface">📋 Confirm Appointment</h1>
          <p className="text-on-surface-variant mt-2">Review and confirm your appointment details</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="bg-gray-50 p-5 rounded-2xl mb-6">
              <h3 className="font-semibold text-lg mb-4">📋 Appointment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>👨‍⚕️ Doctor:</strong> {selectedDoctor?.name}</div>
                <div><strong>🏥 Specialty:</strong> {selectedDoctor?.specialty}</div>
                <div><strong>💰 Fee:</strong> <span className="text-secondary font-bold text-base">Rs. {selectedTimeSlot.fee}</span></div>
                <div><strong>📅 Date:</strong> {selectedTimeSlot.formattedDate}</div>
                <div><strong>⏰ Time:</strong> {selectedTimeSlot.time} - {selectedTimeSlot.endTime}</div>
              </div>
            </div>

            <form onSubmit={handleSubmitAppointment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">📞 Contact Number *</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="0771234567"
                    required
                    className="w-full px-4 py-3 border rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">💊 Reason for Visit *</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Describe your symptoms or reason for consultation"
                    required
                    rows="3"
                    className="w-full px-4 py-3 border rounded-xl focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">🤒 Symptoms</label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    placeholder="List your symptoms (optional)"
                    rows="2"
                    className="w-full px-4 py-3 border rounded-xl focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">📝 Additional Notes</label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Any additional information for the doctor"
                    rows="2"
                    className="w-full px-4 py-3 border rounded-xl focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Booking...' : `Confirm & Pay Rs. ${selectedTimeSlot.fee} ✓`}
                </button>
              </div>
            </form>
          </div>
        </div>

        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSuccessModal(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-md text-center mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-2xl font-bold mb-4">Appointment Confirmed!</h3>
              <div dangerouslySetInnerHTML={{ __html: confirmationDetails }} className="text-on-surface-variant mb-6 text-left text-sm" />
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  resetWorkflow();
                  navigate('/dashboard');
                }}
                className="px-6 py-2 bg-primary text-white rounded-xl"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AppointmentBooking;