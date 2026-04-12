import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Settings, LogOut, User, Calendar, Clock, Stethoscope,
  DollarSign, FileText, Activity, ChevronRight, ChevronLeft,
  UploadCloud, X, CheckCircle, AlertCircle, CreditCard
} from 'lucide-react';
import axios from 'axios';

const AppointmentBooking = () => {
    const { id: doctorId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const doctor = location.state?.doctor;

    // User state for header
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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
    const [bookedSlots, setBookedSlots] = useState(new Set());

    // Get user info from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                const patient = userData.patient || userData;
                setUser(patient);
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch available dates from doctor's schedule
    useEffect(() => {
        if (doctorId) {
            fetchAvailableDates();
        }
    }, [doctorId]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('appointments');
        navigate('/login');
    };

    // Fetch already booked appointments for this doctor
    const fetchBookedAppointments = async () => {
        try {
            const response = await fetch(`http://localhost:5015/api/appointments/doctor/public/${doctorId}`);
            const data = await response.json();
            
            if (data.success && data.appointments) {
                const booked = new Set();
                data.appointments.forEach(apt => {
                    if (['pending', 'accepted', 'cancelled','completed', 'no_show', 'doctor_no_show'].includes(apt.status)) {
                        const aptDate = new Date(apt.date).toISOString().split('T')[0];
                        const slotKey = `${aptDate}_${apt.startTime}`;
                        booked.add(slotKey);
                    }
                });
                setBookedSlots(booked);
                return booked;
            }
        } catch (error) {
            console.error('Error fetching booked appointments:', error);
        }
        return new Set();
    };

    // Check if a time slot is in the past
    const isPastTimeSlot = (dateStr, timeStr) => {
        const now = new Date();
        const slotDateTime = new Date(`${dateStr}T${timeStr}`);
        const todayStr = now.toISOString().split('T')[0];
        if (dateStr === todayStr) {
            return slotDateTime < now;
        }
        return false;
    };

    const fetchAvailableDates = async () => {
        setLoadingSlots(true);
        try {
            const booked = await fetchBookedAppointments();
            
            const response = await axios.get(`http://localhost:5025/api/doctors/availability/doctor/${doctorId}?includeInactive=true`);
            
            if (response.data.success && response.data.availability) {
                const dates = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                for (const avail of response.data.availability) {
                    let fee = avail.consultationFee;
                    if (!fee || fee === 0) {
                        fee = doctor?.consultationFee || 0;
                    }
                    
                    if (avail.isActive && avail.startTime && avail.endTime) {
                        if (!avail.date) {
                            for (let i = 0; i < 30; i++) {
                                const futureDate = new Date();
                                futureDate.setDate(today.getDate() + i);
                                if (futureDate.getDay() === avail.dayOfWeek && futureDate >= today) {
                                    const dateStr = futureDate.toISOString().split('T')[0];
                                    const slots = generateTimeSlots(
                                        avail.startTime, avail.endTime,
                                        avail.slotDuration || 30,
                                        avail.breakStart, avail.breakEnd
                                    );
                                    
                                    const hasAvailableSlots = slots.some(slot => {
                                        const slotKey = `${dateStr}_${slot.startTime}`;
                                        return !booked.has(slotKey) && !isPastTimeSlot(dateStr, slot.startTime);
                                    });
                                    
                                    if (hasAvailableSlots) {
                                        dates.push({
                                            date: dateStr, dayName: avail.dayName,
                                            startTime: avail.startTime, endTime: avail.endTime,
                                            slotDuration: avail.slotDuration,
                                            breakStart: avail.breakStart, breakEnd: avail.breakEnd,
                                            consultationFee: fee, slotId: avail._id, isRecurring: true
                                        });
                                    }
                                }
                            }
                        } else {
                            const availDate = new Date(avail.date);
                            if (availDate >= today) {
                                const dateStr = availDate.toISOString().split('T')[0];
                                const slots = generateTimeSlots(
                                    avail.startTime, avail.endTime,
                                    avail.slotDuration || 30,
                                    avail.breakStart, avail.breakEnd
                                );
                                
                                const hasAvailableSlots = slots.some(slot => {
                                    const slotKey = `${dateStr}_${slot.startTime}`;
                                    return !booked.has(slotKey) && !isPastTimeSlot(dateStr, slot.startTime);
                                });
                                
                                if (hasAvailableSlots) {
                                    dates.push({
                                        date: dateStr, dayName: avail.dayName,
                                        startTime: avail.startTime, endTime: avail.endTime,
                                        slotDuration: avail.slotDuration,
                                        breakStart: avail.breakStart, breakEnd: avail.breakEnd,
                                        consultationFee: fee, slotId: avail._id, isRecurring: false
                                    });
                                }
                            }
                        }
                    }
                }
                
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
            }
        } catch (err) {
            console.error('Error fetching available dates:', err);
            setError('Unable to fetch available dates');
        } finally {
            setLoadingSlots(false);
        }
    };

    const generateTimeSlots = (startTime, endTime, slotDuration, breakStart, breakEnd) => {
        const slots = [];
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const breakStartTime = breakStart ? new Date(`2000-01-01T${breakStart}`) : null;
        const breakEndTime = breakEnd ? new Date(`2000-01-01T${breakEnd}`) : null;
        
        let current = start;
        while (current < end) {
            const slotEnd = new Date(current.getTime() + slotDuration * 60000);
            
            if (breakStartTime && breakEndTime) {
                if (current >= breakStartTime && slotEnd <= breakEndTime) {
                    current = new Date(current.getTime() + slotDuration * 60000);
                    continue;
                }
            }
            
            if (slotEnd <= end) {
                const timeStr = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                slots.push({
                    startTime: timeStr,
                    endTime: slotEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    duration: slotDuration
                });
            }
            current = new Date(current.getTime() + slotDuration * 60000);
        }
        return slots;
    };

    const handleDateSelect = async (dateObj) => {
        setSelectedDate(dateObj);
        setSelectedTimeSlot(null);
        
        const booked = await fetchBookedAppointments();
        const slots = generateTimeSlots(
            dateObj.startTime, dateObj.endTime,
            dateObj.slotDuration || 30,
            dateObj.breakStart, dateObj.breakEnd
        );
        
        const slotsWithAvailability = slots.map(slot => {
            const slotKey = `${dateObj.date}_${slot.startTime}`;
            const isBooked = booked.has(slotKey);
            const isPast = isPastTimeSlot(dateObj.date, slot.startTime);
            const isAvailable = !isBooked && !isPast;
            
            return { ...slot, isAvailable, isPast, isBooked };
        });
        
        setAvailableTimeSlots(slotsWithAvailability);
        setFormData(prev => ({
            ...prev,
            consultationFee: dateObj.consultationFee || doctor?.consultationFee || 0,
            slotId: dateObj.slotId
        }));
    };

    const handleTimeSlotSelect = (slot) => {
        if (!slot.isAvailable) {
            setError(`This time slot is ${slot.isPast ? 'past' : 'already booked'}. Please select another time.`);
            return;
        }
        setSelectedTimeSlot(slot);
        setError('');
        setFormData(prev => ({
            ...prev,
            date: selectedDate.date,
            startTime: slot.startTime,
            endTime: slot.endTime
        }));
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setReports(Array.from(e.target.files));
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
        
        const slotKey = `${formData.date}_${formData.startTime}`;
        
        if (isPastTimeSlot(formData.date, formData.startTime)) {
            setError('This time slot has passed. Please select another time.');
            setStep(1);
            await fetchAvailableDates();
            if (selectedDate) await handleDateSelect(selectedDate);
            return;
        }
        
        if (bookedSlots.has(slotKey)) {
            setError('This time slot is no longer available. Please select another time.');
            setStep(1);
            await fetchAvailableDates();
            if (selectedDate) await handleDateSelect(selectedDate);
            return;
        }
        
        if (!formData.symptoms) {
            setError('Please describe your symptoms');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
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
            
            reports.forEach((report) => submitData.append('reports', report));
            
            const response = await fetch('http://localhost:5015/api/appointments', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: submitData
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                navigate('/appointments/all', { 
                    state: { message: 'Appointment booked successfully! Waiting for doctor approval.' }
                });
            } else {
                if (data.message && (data.message.includes('already booked') || data.message.includes('already taken'))) {
                    setError('This time slot was just booked by someone else. Please select another time.');
                    setStep(1);
                    await fetchAvailableDates();
                    if (selectedDate) await handleDateSelect(selectedDate);
                } else {
                    setError(data.message || 'Failed to book appointment');
                }
            }
        } catch (err) {
            console.error('❌ Booking error:', err);
            setError('Failed to book appointment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        });
    };

    const formatDisplayTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <div className="min-h-screen bg-background font-body">
            {/* Modern Header */}
            <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-24 border-b border-outline-variant/30 shadow-ambient">
                <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-12">
                        <Link to="/" className="text-2xl font-extrabold text-primary font-headline tracking-tighter hover:opacity-80 transition-opacity">
                            CareSync
                        </Link>
                        <nav className="hidden md:flex items-center gap-8 font-headline font-semibold text-sm text-on-surface-variant">
                            <Link to="/dashboard" className="hover:text-primary cursor-pointer transition-colors">Sanctuary</Link>
                            <Link to="/doctor/listing" className="hover:text-primary cursor-pointer transition-colors">Specialists</Link>
                            <Link to="/appointments/all" className="hover:text-primary cursor-pointer transition-colors">Appointments</Link>
                        </nav>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-all">
                            <Bell size={20} />
                        </button>

                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary transition-all flex items-center justify-center bg-primary-container text-primary font-bold shadow-sm hover:shadow-md"
                            >
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0) || <User size={20} />
                                )}
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-3 w-56 bg-surface-container-lowest rounded-2xl shadow-elevated border border-outline-variant/30 overflow-hidden z-50"
                                    >
                                        <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low/50">
                                            <p className="font-bold text-on-surface truncate">{user?.name || 'Patient'}</p>
                                            <p className="text-xs text-on-surface-variant truncate mt-0.5">{user?.email || 'Patient Account'}</p>
                                        </div>
                                        <div className="p-2 flex flex-col gap-1">
                                            <Link 
                                                to="/profile" 
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
                                            >
                                                <Settings size={18} /> Account Settings
                                            </Link>
                                            <button 
                                                onClick={handleLogout} 
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-error-container/50 text-sm font-bold text-error transition-colors w-full text-left"
                                            >
                                                <LogOut size={18} /> Logout
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="py-10 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Step Indicator */}
                    <div className="mb-8">
    <div className="flex items-center justify-center">
        <div className="flex items-start w-full max-w-md">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    step >= 1 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg ' 
                        : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                }`}>
                    1
                </div>
                <div className="flex items-center w-full mt-3">
                    <div className={`flex-1 h-1 ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'}`} />
                </div>
                <span className={`text-xs font-semibold mt-3 text-center ${
                    step >= 1 ? 'text-blue-600' : 'text-gray-400'
                }`}>
                    Select Date & Time
                </span>
            </div>
            
            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    step >= 2 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg ' 
                        : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                }`}>
                    2
                </div>
                <div className="flex items-center w-full mt-3">
                    <div className={`flex-1 h-1 ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'}`} />
                </div>
                <span className={`text-xs font-semibold mt-3 text-center ${
                    step >= 2 ? 'text-blue-600' : 'text-gray-400'
                }`}>
                    Appointment Details
                </span>
            </div>
        </div>
    </div>
</div>

                    <div className="bg-surface-container-lowest rounded-3xl shadow-elevated overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
                            <h1 className="text-2xl font-bold text-white font-headline">Book Appointment</h1>
                            <p className="text-white/80 mt-1">
                                {doctor?.name ? `Dr. ${doctor.name} - ${doctor.specialty}` : 'Schedule your consultation'}
                            </p>
                        </div>
                        
                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="m-6 bg-error-container border border-error/20 text-error px-4 py-3 rounded-xl"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Step 1: Date & Time Selection */}
                        {step === 1 && (
                            <div className="p-6">
                                {/* Doctor Info Card */}
                                {doctor && (
                                    <div className="bg-surface-container-low rounded-2xl p-4 mb-6 flex items-center gap-4 border border-outline-variant/30">
                                        
                                        <div>
                                            <h3 className="font-semibold text-on-surface font-headline">Dr. {doctor.name}</h3>
                                            <p className="text-sm font-bold text-blue-600">{doctor.specialty}</p>
                                            <p className="text-sm text-on-surface-variant">Experience: {doctor.experience} years</p>
                                        </div>
                                    </div>
                                )}

                                {/* Date Selection */}
                                <div className="mb-8">
                                    <label className="block text-sm font-semibold text-on-surface mb-3">
                                        Select Date *
                                    </label>
                                    {loadingSlots ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : availableDates.length === 0 ? (
                                        <div className="text-center py-8 bg-surface-container-low rounded-2xl">
                                            <p className="text-on-surface-variant">No available dates found</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {availableDates.map((dateObj, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => handleDateSelect(dateObj)}
                                                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                                                        selectedDate?.date === dateObj.date
                                                            ? 'border-primary bg-primary/10 text-primary shadow-md'
                                                            : 'border-outline-variant/50 hover:border-primary/50 hover:bg-surface-container-low'
                                                    }`}
                                                >
                                                    <div className="text-sm font-medium text-on-surface-variant">
                                                        {new Date(dateObj.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </div>
                                                    <div className="text-2xl font-bold text-on-surface mt-1">
                                                        {new Date(dateObj.date).getDate()}
                                                    </div>
                                                    <div className="text-xs text-on-surface-variant mt-1">
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
                                            <label className="text-sm font-semibold text-on-surface">
                                                Select Time Slot * - {formatDate(selectedDate.date)}
                                            </label>
                                            <span className="text-xs text-on-surface-variant">
                                                {selectedDate.startTime} - {selectedDate.endTime}
                                            </span>
                                        </div>
                                        {availableTimeSlots.length === 0 ? (
                                            <div className="text-center py-8 bg-surface-container-low rounded-2xl">
                                                <p className="text-on-surface-variant">No time slots available for this date</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                                    {availableTimeSlots.map((slot, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => handleTimeSlotSelect(slot)}
                                                            disabled={!slot.isAvailable}
                                                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                                                                selectedTimeSlot?.startTime === slot.startTime
                                                                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                                                                    : slot.isAvailable
                                                                    ? 'border-green-200 bg-green-50 hover:border-primary hover:bg-primary/5 cursor-pointer'
                                                                    : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant/50 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            <div className="font-semibold text-sm">{formatDisplayTime(slot.startTime)}</div>
                                                            <div className="text-xs">{slot.duration} min</div>
                                                            {!slot.isAvailable && (
                                                                <div className="text-xs mt-1">
                                                                    {slot.isPast ? 'Passed' : 'Booked'}
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                                
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Fee Display */}
                                {selectedDate && selectedDate.consultationFee > 0 && (
                                    <div className="bg-surface-container-low p-4 rounded-2xl mb-6 border border-outline-variant/30">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-on-surface">Consultation Fee:</span>
                                            <span className="text-xl font-bold text-green-700">
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
                                        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        Next: Appointment Details
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Appointment Details Form */}
                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Selected Appointment Summary */}
                                <div className="bg-primary/5 rounded-2xl p-4 mb-4 border border-primary/20">
                                    <h3 className="font-semibold text-primary underline mb-2">Selected Appointment</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-on-surface-variant">Date:</span>
                                            <span className="ml-2 font-medium text-on-surface">{formatDate(formData.date)}</span>
                                        </div>
                                        <div>
                                            <span className="text-on-surface-variant">Time:</span>
                                            <span className="ml-2 font-medium text-on-surface">{formatDisplayTime(formData.startTime)} - {formatDisplayTime(formData.endTime)}</span>
                                        </div>
                                        <div>
                                            <span className="text-on-surface-variant">Doctor:</span>
                                            <span className="ml-2 font-medium bg-green-200 rounded-lg  text-green-900">Dr. {formData.doctorName}</span>
                                        </div>
                                        <div>
                                            <span className="text-on-surface-variant">Fee:</span>
                                            <span className="ml-2 font-medium text-green-700">LKR {formData.consultationFee?.toLocaleString() || 0}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePreviousStep}
                                        className="mt-3 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                                    >
                                        <ChevronLeft size={14} /> Change Date/Time
                                    </button>
                                </div>

                                {/* Patient Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-on-surface mb-2">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="patientName"
                                            value={formData.patientName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-container-lowest"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-on-surface mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="patientEmail"
                                            value={formData.patientEmail}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-container-lowest"
                                        />
                                    </div>
                                </div>

                                {/* Symptoms */}
                                <div>
                                    <label className="block text-sm font-semibold text-on-surface mb-2">
                                        Symptoms / Reason for Visit *
                                    </label>
                                    <textarea
                                        name="symptoms"
                                        value={formData.symptoms}
                                        onChange={handleInputChange}
                                        rows="3"
                                        required
                                        className="w-full px-3 py-2 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-container-lowest"
                                        placeholder="Describe your symptoms or reason for consultation..."
                                    />
                                </div>

                                {/* Medical History */}
                                <div>
                                    <label className="block text-sm font-semibold text-on-surface mb-2">
                                        Medical History (Optional)
                                    </label>
                                    <textarea
                                        name="medicalHistory"
                                        value={formData.medicalHistory}
                                        onChange={handleInputChange}
                                        rows="2"
                                        className="w-full px-3 py-2 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-container-lowest"
                                        placeholder="Any relevant medical history, allergies, or current medications..."
                                    />
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-on-surface mb-2">
                                        Upload Medical Reports (PDF, JPEG, PNG)
                                    </label>
                                    <div className="border-2 border-dashed border-outline-variant rounded-2xl p-6 text-center hover:border-primary transition bg-surface-container-low">
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                        />
                                        {reports.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-sm text-on-surface-variant">
                                                    {reports.length} file(s) selected
                                                </p>
                                                <ul className="text-xs text-on-surface-variant mt-2">
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
                                        className="flex-1 px-4 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-semibold hover:bg-surface-container-low transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
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


                                <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <AlertCircle size={16} className="text-blue-600" />
                                        </div>
                                        <div className="text-xs text-blue-800">
                                            <p className="font-semibold mb-1">Important Information:</p>
                                            <ul className="space-y-1 list-disc list-inside">
                                                <li>Appointment confirmation is subject to doctor's approval</li>
                                                <li>Payment is required after doctor accepts the appointment</li>
                                                
                                                <li>Cancellation policy applies as per clinic terms</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentBooking;