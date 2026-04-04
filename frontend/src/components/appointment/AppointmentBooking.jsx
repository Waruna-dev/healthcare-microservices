import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import api from '../../services/api';

const AppointmentBooking = () => {
    const { id: doctorId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const doctor = location.state?.doctor;

    // Step management
    const [step, setStep] = useState(1);
    
    // Form data
    const [formData, setFormData] = useState({
        doctorId: doctorId,
        doctorName: doctor?.name || '',
        doctorSpecialty: doctor?.specialty || '',
        patientName: '',
        patientEmail: '',
        date: '',
        startTime: '',
        endTime: '',
        consultationFee: '',
        slotId: '',
        symptoms: '',
        medicalHistory: ''
    });
    
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Step 1: Available slots data
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    
    // Get patient info from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                const patient = userData.patient || userData;
                setFormData(prev => ({
                    ...prev,
                    patientName: patient.name || '',
                    patientEmail: patient.email || ''
                }));
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }
    }, []);

    // Fetch available dates from doctor's schedule
    useEffect(() => {
        if (doctorId) {
            fetchAvailableDates();
        }
    }, [doctorId]);

    const fetchAvailableDates = async () => {
    setLoadingSlots(true);
    try {
        const response = await axios.get(`http://localhost:5025/api/doctors/availability/doctor/${doctorId}?includeInactive=true`);
        console.log('Availability response:', response.data);
        
        if (response.data.success && response.data.availability) {
            const dates = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            response.data.availability.forEach(avail => {
                // Get fee from availability or doctor
                let fee = avail.consultationFee;
                if (!fee || fee === 0) {
                    fee = doctor?.consultationFee || 0;
                }
                console.log(`Slot fee: ${fee}, avail fee: ${avail.consultationFee}, doctor fee: ${doctor?.consultationFee}`);
                
                if (avail.isActive && avail.startTime && avail.endTime) {
                    if (!avail.date) {
                        // Generate dates for recurring schedule
                        for (let i = 0; i < 30; i++) {
                            const futureDate = new Date();
                            futureDate.setDate(today.getDate() + i);
                            if (futureDate.getDay() === avail.dayOfWeek) {
                                if (futureDate >= today) {
                                    dates.push({
                                        date: futureDate.toISOString().split('T')[0],
                                        dayName: avail.dayName,
                                        startTime: avail.startTime,
                                        endTime: avail.endTime,
                                        slotDuration: avail.slotDuration,
                                        breakStart: avail.breakStart,
                                        breakEnd: avail.breakEnd,
                                        consultationFee: fee,
                                        slotId: avail._id,
                                        isRecurring: true
                                    });
                                }
                            }
                        }
                    } else {
                        const availDate = new Date(avail.date);
                        if (availDate >= today) {
                            dates.push({
                                date: availDate.toISOString().split('T')[0],
                                dayName: avail.dayName,
                                startTime: avail.startTime,
                                endTime: avail.endTime,
                                slotDuration: avail.slotDuration,
                                breakStart: avail.breakStart,
                                breakEnd: avail.breakEnd,
                                consultationFee: fee,
                                slotId: avail._id,
                                isRecurring: false
                            });
                        }
                    }
                }
            });
            
            // Remove duplicates and sort by date
            const uniqueDates = [];
            const dateMap = new Map();
            dates.forEach(date => {
                if (!dateMap.has(date.date)) {
                    dateMap.set(date.date, date);
                    uniqueDates.push(date);
                }
            });
            uniqueDates.sort((a, b) => new Date(a.date) - new Date(b.date));
            setAvailableDates(uniqueDates);
            console.log('Available dates:', uniqueDates);
        }
    } catch (err) {
        console.error('Error fetching available dates:', err);
        setError('Unable to fetch available dates');
    } finally {
        setLoadingSlots(false);
    }
};

    // Generate time slots for selected date
    const generateTimeSlots = (startTime, endTime, slotDuration, breakStart, breakEnd) => {
        const slots = [];
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const breakStartTime = breakStart ? new Date(`2000-01-01T${breakStart}`) : null;
        const breakEndTime = breakEnd ? new Date(`2000-01-01T${breakEnd}`) : null;
        
        let current = start;
        while (current < end) {
            const slotEnd = new Date(current.getTime() + slotDuration * 60000);
            
            // Skip if within break time
            if (breakStartTime && breakEndTime) {
                if (current >= breakStartTime && slotEnd <= breakEndTime) {
                    current = new Date(current.getTime() + slotDuration * 60000);
                    continue;
                }
            }
            
            if (slotEnd <= end) {
                slots.push({
                    startTime: current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    endTime: slotEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    duration: slotDuration
                });
            }
            current = new Date(current.getTime() + slotDuration * 60000);
        }
        return slots;
    };

    const handleDateSelect = (dateObj) => {
        setSelectedDate(dateObj);
        setSelectedTimeSlot(null);
        
        // Generate time slots for this date
        const slots = generateTimeSlots(
            dateObj.startTime,
            dateObj.endTime,
            dateObj.slotDuration || 30,
            dateObj.breakStart,
            dateObj.breakEnd
        );
        setAvailableTimeSlots(slots);
        
        // Update form data with selected date info
        setFormData(prev => ({
            ...prev,
            consultationFee: dateObj.consultationFee || doctor?.consultationFee || 0,
            slotId: dateObj.slotId
        }));
    };

    const handleTimeSlotSelect = (slot) => {
        setSelectedTimeSlot(slot);
        setFormData(prev => ({
            ...prev,
            date: selectedDate.date,
            startTime: slot.startTime,
            endTime: slot.endTime
        }));
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setReports(files);
    };

    const handleNextStep = () => {
        if (!selectedDate) {
            setError('Please select a date');
            return;
        }
        if (!selectedTimeSlot) {
            setError('Please select a time slot');
            return;
        }
        setError('');
        setStep(2);
    };

    const handlePreviousStep = () => {
        setStep(1);
        setError('');
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.symptoms) {
        setError('Please describe your symptoms');
        return;
    }
    
    if (!formData.patientName) {
        setError('Please enter your name');
        return;
    }
    
    if (!formData.patientEmail) {
        setError('Please enter your email');
        return;
    }
    
    setLoading(true);
    setError('');
    
    try {
        // Check if token exists
        const token = localStorage.getItem('token');
        console.log('🔑 Token from localStorage:', token ? 'Yes' : 'No');
        
        if (!token) {
            setError('Please login again');
            setLoading(false);
            return;
        }
        
        const submitData = new FormData();
        
        submitData.append('doctorId', doctorId);
        submitData.append('doctorName', formData.doctorName);
        submitData.append('doctorSpecialty', formData.doctorSpecialty);
        submitData.append('patientName', formData.patientName);
        submitData.append('patientEmail', formData.patientEmail);
        submitData.append('slotId', formData.slotId);
        submitData.append('date', formData.date);
        submitData.append('startTime', formData.startTime);
        submitData.append('endTime', formData.endTime);
        submitData.append('consultationFee', formData.consultationFee || 0);
        submitData.append('symptoms', formData.symptoms);
        submitData.append('medicalHistory', formData.medicalHistory || '');
        
        reports.forEach((report) => {
            submitData.append('reports', report);
        });
        
        console.log('📤 Sending appointment data:', {
            doctorId,
            date: formData.date,
            startTime: formData.startTime,
            consultationFee: formData.consultationFee
        });
        
        const response = await fetch('http://localhost:5015/api/appointments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: submitData
        });
        
        const data = await response.json();
        console.log('📥 Response:', data);
        
        if (response.ok && data.success) {
            navigate('/dashboard', { 
                state: { message: 'Appointment booked successfully! Waiting for doctor approval.' }
            });
        } else {
            setError(data.message || 'Failed to book appointment');
        }
    } catch (err) {
        console.error('❌ Booking error:', err);
        setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
        setLoading(false);
    }
};

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Step Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center w-full max-w-md">
                            <div className={`flex-1 flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                    1
                                </div>
                                <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            </div>
                            <div className={`flex-1 flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                    2
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center mt-2">
                        <span className="text-sm text-gray-500">
                            {step === 1 ? 'Select Date & Time' : 'Appointment Details'}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                        <h1 className="text-2xl font-bold text-white">Book Appointment</h1>
                        <p className="text-blue-100 mt-1">
                            {doctor?.name ? `Dr. ${doctor.name} - ${doctor.specialty}` : 'Schedule your consultation'}
                        </p>
                    </div>
                    
                    {/* Error Message */}
                    {error && (
                        <div className="m-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Date & Time Selection */}
                    {step === 1 && (
                        <div className="p-6">
                            {/* Doctor Info Card */}
                            {doctor && (
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                        {doctor.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Dr. {doctor.name}</h3>
                                        <p className="text-sm text-gray-500">{doctor.specialty}</p>
                                        <p className="text-sm text-gray-500">Experience: {doctor.experience} years</p>
                                    </div>
                                </div>
                            )}

                            {/* Date Selection */}
                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Select Date *
                                </label>
                                {loadingSlots ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : availableDates.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500">No available dates found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {availableDates.map((dateObj, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => handleDateSelect(dateObj)}
                                                className={`p-4 rounded-xl border-2 text-center transition-all ${
                                                    selectedDate?.date === dateObj.date
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                                }`}
                                            >
                                                <div className="text-sm font-medium">
                                                    {new Date(dateObj.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className="text-lg font-bold mt-1">
                                                    {new Date(dateObj.date).getDate()}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(dateObj.date).toLocaleDateString('en-US', { month: 'short' })}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Time Slot Selection */}
                            {selectedDate && (
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Select Time Slot * - {formatDate(selectedDate.date)}
                                        </label>
                                        <span className="text-xs text-gray-500">
                                            {selectedDate.startTime} - {selectedDate.endTime}
                                        </span>
                                    </div>
                                    {availableTimeSlots.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <p className="text-gray-500">No time slots available for this date</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {availableTimeSlots.map((slot, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => handleTimeSlotSelect(slot)}
                                                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                                                        selectedTimeSlot?.startTime === slot.startTime
                                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                            : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-sm">{slot.startTime}</div>
                                                    <div className="text-xs text-gray-500">{slot.duration} min</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Fee Display */}
                            {selectedDate && selectedDate.consultationFee > 0 && (
                                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-700">Consultation Fee:</span>
                                        <span className="text-xl font-bold text-blue-600">
                                            LKR {selectedDate.consultationFee?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    disabled={!selectedDate || !selectedTimeSlot}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Next: Appointment Details
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Appointment Details Form */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Selected Appointment Summary */}
                            <div className="bg-blue-50 rounded-xl p-4 mb-4">
                                <h3 className="font-semibold text-blue-800 mb-2">Selected Appointment</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Date:</span>
                                        <span className="ml-2 font-medium">{formatDate(formData.date)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Time:</span>
                                        <span className="ml-2 font-medium">{formData.startTime} - {formData.endTime}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Doctor:</span>
                                        <span className="ml-2 font-medium">Dr. {formData.doctorName}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Fee:</span>
                                        <span className="ml-2 font-medium text-blue-600">LKR {formData.consultationFee?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePreviousStep}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Change Date/Time
                                </button>
                            </div>

                            {/* Patient Info (pre-filled) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="patientName"
                                        value={formData.patientName}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="patientEmail"
                                        value={formData.patientEmail}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Symptoms */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Symptoms / Reason for Visit *
                                </label>
                                <textarea
                                    name="symptoms"
                                    value={formData.symptoms}
                                    onChange={handleInputChange}
                                    rows="3"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Describe your symptoms or reason for consultation..."
                                />
                            </div>

                            {/* Medical History */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Medical History (Optional)
                                </label>
                                <textarea
                                    name="medicalHistory"
                                    value={formData.medicalHistory}
                                    onChange={handleInputChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Any relevant medical history, allergies, or current medications..."
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Upload Medical Reports (PDF, JPEG, PNG)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {reports.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600">
                                                {reports.length} file(s) selected
                                            </p>
                                            <ul className="text-xs text-gray-500 mt-2">
                                                {reports.map((file, idx) => (
                                                    <li key={idx}>{file.name}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handlePreviousStep}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Booking...
                                        </>
                                    ) : (
                                        'Confirm Appointment'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentBooking;