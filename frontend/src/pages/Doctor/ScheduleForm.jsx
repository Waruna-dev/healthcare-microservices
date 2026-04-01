// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { resolveDoctorIdForApi } from '../../utils/doctorId';

// const API_BASE = '/api/doctors/availability';

// const ScheduleForm = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const isEditing = location.state?.schedule;
  
//   const [formData, setFormData] = useState({
//     // Date fields
//     year: new Date().getFullYear(),
//     month: new Date().getMonth() + 1,
//     day: new Date().getDate(),
    
//     // Time fields
//     startTime: '09:00',
//     endTime: '17:00',
    
//     // Break times
//     breakStart: '',
//     breakEnd: '',
//     enableBreak: false,
    
//     // Other fields
//     slotDuration: 30,
//     price: '',
//     availabilityStatus: 'Available',
//     isActive: true,
//     maxAppointments: '',
//     isRecurring: false,
//     recurringPattern: 'weekly',
//     bufferTime: 5,
//     consultationType: 'online',
//     location: '',
//     notes: ''
//   });
  
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [showPriceHelp, setShowPriceHelp] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(new Date());

//   // Initialize form if editing
//   useEffect(() => {
//     if (isEditing) {
//       let date = new Date();
//       if (isEditing.date) {
//         date = new Date(isEditing.date);
//       }
      
//       setFormData({
//         year: date.getFullYear(),
//         month: date.getMonth() + 1,
//         day: date.getDate(),
//         startTime: isEditing.startTime || '09:00',
//         endTime: isEditing.endTime || '17:00',
//         breakStart: isEditing.breakStart || '',
//         breakEnd: isEditing.breakEnd || '',
//         enableBreak: !!(isEditing.breakStart && isEditing.breakEnd),
//         slotDuration: isEditing.slotDuration || 30,
//         price: isEditing.price || '',
//         availabilityStatus: isEditing.availabilityStatus || 'Available',
//         isActive: isEditing.isActive !== false,
//         maxAppointments: isEditing.maxAppointments || '',
//         isRecurring: isEditing.isRecurring || false,
//         recurringPattern: isEditing.recurringPattern || 'weekly',
//         bufferTime: isEditing.bufferTime || 5,
//         consultationType: isEditing.consultationType || 'online',
//         location: isEditing.location || '',
//         notes: isEditing.notes || ''
//       });
//     }
//   }, [isEditing]);

//   // Get days in month
//   const getDaysInMonth = (year, month) => {
//     return new Date(year, month, 0).getDate();
//   };

//   // Generate month options
//   const months = [
//     { value: 1, label: 'January' },
//     { value: 2, label: 'February' },
//     { value: 3, label: 'March' },
//     { value: 4, label: 'April' },
//     { value: 5, label: 'May' },
//     { value: 6, label: 'June' },
//     { value: 7, label: 'July' },
//     { value: 8, label: 'August' },
//     { value: 9, label: 'September' },
//     { value: 10, label: 'October' },
//     { value: 11, label: 'November' },
//     { value: 12, label: 'December' }
//   ];

//   // Generate day options for dayName
//   const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

//   // Generate day options
//   const daysInMonth = getDaysInMonth(formData.year, formData.month);
//   const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

//   // Generate year options (current year - 5 to current year + 5)
//   const currentYear = new Date().getFullYear();
//   const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

//   // Generate time slots for select
//   const generateTimeSlots = () => {
//     const slots = [];
//     for (let hour = 0; hour < 24; hour++) {
//       for (let minute = 0; minute < 60; minute += 30) {
//         const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
//         slots.push(time);
//       }
//     }
//     return slots;
//   };

//   const timeSlots = generateTimeSlots();

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//     // Clear error for this field
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handlePriceChange = (e) => {
//     const value = e.target.value;
//     // Allow empty string or numbers only (including decimal)
//     if (value === '' || /^\d*\.?\d*$/.test(value)) {
//       setFormData(prev => ({ ...prev, price: value }));
//       if (errors.price) {
//         setErrors(prev => ({ ...prev, price: '' }));
//       }
//     }
//   };

//   const handlePresetPrice = (price) => {
//     setFormData(prev => ({ ...prev, price: price.toString() }));
//     if (errors.price) {
//       setErrors(prev => ({ ...prev, price: '' }));
//     }
//   };

//   const validate = () => {
//     const newErrors = {};
    
//     // Validate times
//     if (!formData.startTime) {
//       newErrors.startTime = 'Start time is required';
//     }
//     if (!formData.endTime) {
//       newErrors.endTime = 'End time is required';
//     }
//     if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
//       newErrors.endTime = 'End time must be after start time';
//     }
    
//     // Validate break times
//     if (formData.enableBreak) {
//       if (!formData.breakStart) {
//         newErrors.breakStart = 'Break start time is required';
//       }
//       if (!formData.breakEnd) {
//         newErrors.breakEnd = 'Break end time is required';
//       }
//       if (formData.breakStart && formData.breakEnd && formData.breakStart >= formData.breakEnd) {
//         newErrors.breakEnd = 'Break end must be after break start';
//       }
//       if (formData.breakStart && formData.breakStart < formData.startTime) {
//         newErrors.breakStart = 'Break cannot start before work hours';
//       }
//       if (formData.breakEnd && formData.breakEnd > formData.endTime) {
//         newErrors.breakEnd = 'Break cannot end after work hours';
//       }
//     }
    
//     // Validate price
//     if (!formData.price) {
//       newErrors.price = 'Consultation fee is required';
//     } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
//       newErrors.price = 'Please enter a valid price';
//     } else if (parseFloat(formData.price) < 100) {
//       newErrors.price = 'Minimum consultation fee is ₹100';
//     } else if (parseFloat(formData.price) > 10000) {
//       newErrors.price = 'Maximum consultation fee is ₹10,000';
//     }
    
//     // Validate max appointments
//     if (formData.maxAppointments && (formData.maxAppointments < 1 || formData.maxAppointments > 50)) {
//       newErrors.maxAppointments = 'Max appointments should be between 1 and 50';
//     }
    
//     // Validate buffer time
//     if (formData.bufferTime && (formData.bufferTime < 0 || formData.bufferTime > 60)) {
//       newErrors.bufferTime = 'Buffer time should be between 0 and 60 minutes';
//     }
    
//     // Validate location for in-person consultations
//     if (formData.consultationType === 'inperson' && !formData.location) {
//       newErrors.location = 'Location is required for in-person consultations';
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const calculateTotalSlots = () => {
//     const start = formData.startTime;
//     const end = formData.endTime;
//     const duration = formData.slotDuration;
//     const buffer = formData.bufferTime;
//     const breakStart = formData.enableBreak ? formData.breakStart : null;
//     const breakEnd = formData.enableBreak ? formData.breakEnd : null;
    
//     // Calculate total working minutes
//     const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
//     const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
//     let totalMinutes = endMinutes - startMinutes;
    
//     // Subtract break time
//     if (breakStart && breakEnd) {
//       const breakStartMinutes = parseInt(breakStart.split(':')[0]) * 60 + parseInt(breakStart.split(':')[1]);
//       const breakEndMinutes = parseInt(breakEnd.split(':')[0]) * 60 + parseInt(breakEnd.split(':')[1]);
//       totalMinutes -= (breakEndMinutes - breakStartMinutes);
//     }
    
//     // Calculate number of slots (including buffer time)
//     const slotWithBuffer = duration + buffer;
//     const slots = Math.floor(totalMinutes / slotWithBuffer);
    
//     return slots > 0 ? slots : 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validate()) return;
    
//     setIsSubmitting(true);
//     setSuccessMessage('');
    
//     const doctorId = resolveDoctorIdForApi().id;
//     const selectedDate = new Date(formData.year, formData.month - 1, formData.day);
//     const formattedDate = selectedDate.toISOString().split('T')[0];
    
//     const submissionData = {
//       doctorId,
//       date: formattedDate,
//       dayOfWeek: selectedDate.getDay(),
//       dayName: days[selectedDate.getDay()],
//       startTime: formData.startTime,
//       endTime: formData.endTime,
//       breakStart: formData.enableBreak ? formData.breakStart : null,
//       breakEnd: formData.enableBreak ? formData.breakEnd : null,
//       slotDuration: Number(formData.slotDuration),
//       bufferTime: Number(formData.bufferTime),
//       price: parseFloat(formData.price),
//       availabilityStatus: formData.availabilityStatus,
//       isActive: formData.isActive,
//       maxAppointments: formData.maxAppointments ? Number(formData.maxAppointments) : null,
//       isRecurring: formData.isRecurring,
//       recurringPattern: formData.recurringPattern,
//       consultationType: formData.consultationType,
//       location: formData.consultationType === 'inperson' ? formData.location : null,
//       notes: formData.notes || null,
//       estimatedSlots: calculateTotalSlots()
//     };
    
//     try {
//       let response;
      
//       if (isEditing && isEditing._id) {
//         // Update existing schedule
//         response = await fetch(`${API_BASE}/${isEditing._id}`, {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(submissionData)
//         });
//       } else {
//         // Create new schedule
//         response = await fetch(`${API_BASE}`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(submissionData)
//         });
//       }
      
//       const result = await response.json();
      
//       if (result.success) {
//         setSuccessMessage(isEditing ? 'Schedule updated successfully!' : 'Schedule created successfully!');
//         setTimeout(() => {
//           navigate('/doctor/schedule');
//         }, 1500);
//       } else {
//         setErrors({ submit: result.message || 'Failed to save schedule' });
//       }
//     } catch (error) {
//       console.error('Error saving schedule:', error);
//       setErrors({ submit: 'Error connecting to server. Please try again.' });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const slotDurations = [15, 20, 30, 45, 60];
//   const pricePresets = [500, 800, 1000, 1500, 2000, 3000, 5000];
//   const isUnavailable = formData.availabilityStatus === 'Unavailable';
//   const totalSlots = calculateTotalSlots();

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 py-8 px-4">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <button
//             onClick={() => navigate('/doctor/schedule')}
//             className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-all duration-200 hover:translate-x-[-4px]"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//             </svg>
//             Back to Schedule
//           </button>
//           <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
//             <h1 className="text-3xl font-bold flex items-center gap-3">
//               {isEditing ? '✏️ Edit Schedule' : '➕ Create New Schedule'}
//               <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
//                 Telemedicine
//               </span>
//             </h1>
//             <p className="text-emerald-100 mt-2">
//               {isEditing 
//                 ? 'Update your availability and consultation details' 
//                 : 'Set up your availability for patient appointments'}
//             </p>
//           </div>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Success Message */}
//           {successMessage && (
//             <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 flex items-center gap-3 animate-fade-in shadow-sm">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//               </svg>
//               {successMessage}
//             </div>
//           )}

//           {/* Error Message */}
//           {errors.submit && (
//             <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-3">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//               {errors.submit}
//             </div>
//           )}

//           {/* Date Selection Card */}
//           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
//               <div className="p-2 bg-emerald-100 rounded-lg">
//                 <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold text-gray-800">Select Date</h3>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
//                 <select
//                   name="year"
//                   value={formData.year}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white hover:border-emerald-300"
//                 >
//                   {yearOptions.map(year => (
//                     <option key={year} value={year}>{year}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
//                 <select
//                   name="month"
//                   value={formData.month}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white hover:border-emerald-300"
//                 >
//                   {months.map(month => (
//                     <option key={month.value} value={month.value}>{month.label}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
//                 <select
//                   name="day"
//                   value={formData.day}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white hover:border-emerald-300"
//                 >
//                   {dayOptions.map(day => (
//                     <option key={day} value={day}>{day}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Working Hours & Break Card */}
//           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
//               <div className="p-2 bg-emerald-100 rounded-lg">
//                 <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold text-gray-800">Working Hours</h3>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
//                 <input
//                   type="time"
//                   name="startTime"
//                   value={formData.startTime}
//                   onChange={handleChange}
//                   className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
//                     errors.startTime ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-emerald-300'
//                   }`}
//                 />
//                 {errors.startTime && (
//                   <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>
//                 )}
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
//                 <input
//                   type="time"
//                   name="endTime"
//                   value={formData.endTime}
//                   onChange={handleChange}
//                   className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
//                     errors.endTime ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-emerald-300'
//                   }`}
//                 />
//                 {errors.endTime && (
//                   <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>
//                 )}
//               </div>
//             </div>

//             {/* Break Time Toggle */}
//             <div className="mt-4 border-t border-gray-100 pt-4">
//               <div className="flex items-center justify-between mb-3">
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="enableBreak"
//                     checked={formData.enableBreak}
//                     onChange={handleChange}
//                     className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
//                   />
//                   <span className="text-sm font-medium text-gray-700">Add Break Time</span>
//                 </label>
//               </div>
              
//               {formData.enableBreak && (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Break Start</label>
//                     <input
//                       type="time"
//                       name="breakStart"
//                       value={formData.breakStart}
//                       onChange={handleChange}
//                       className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
//                         errors.breakStart ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-emerald-300'
//                       }`}
//                     />
//                     {errors.breakStart && (
//                       <p className="text-xs text-red-500 mt-1">{errors.breakStart}</p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Break End</label>
//                     <input
//                       type="time"
//                       name="breakEnd"
//                       value={formData.breakEnd}
//                       onChange={handleChange}
//                       className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
//                         errors.breakEnd ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-emerald-300'
//                       }`}
//                     />
//                     {errors.breakEnd && (
//                       <p className="text-xs text-red-500 mt-1">{errors.breakEnd}</p>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Appointment Settings Card */}
//           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
//               <div className="p-2 bg-emerald-100 rounded-lg">
//                 <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold text-gray-800">Appointment Settings</h3>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Slot Duration *</label>
//                 <select
//                   name="slotDuration"
//                   value={formData.slotDuration}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white hover:border-emerald-300"
//                 >
//                   {slotDurations.map(duration => (
//                     <option key={duration} value={duration}>{duration} minutes</option>
//                   ))}
//                 </select>
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Buffer Time Between Appointments
//                   <span className="text-xs text-gray-500 ml-1">(minutes)</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="bufferTime"
//                   value={formData.bufferTime}
//                   onChange={handleChange}
//                   min="0"
//                   max="60"
//                   className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
//                     errors.bufferTime ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-emerald-300'
//                   }`}
//                 />
//                 {errors.bufferTime && (
//                   <p className="text-xs text-red-500 mt-1">{errors.bufferTime}</p>
//                 )}
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Appointments</label>
//                 <input
//                   type="number"
//                   name="maxAppointments"
//                   value={formData.maxAppointments}
//                   onChange={handleChange}
//                   placeholder="Unlimited"
//                   min="1"
//                   max="50"
//                   className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
//                     errors.maxAppointments ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-emerald-300'
//                   }`}
//                 />
//                 {errors.maxAppointments && (
//                   <p className="text-xs text-red-500 mt-1">{errors.maxAppointments}</p>
//                 )}
//                 <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited appointments</p>
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Type</label>
//                 <select
//                   name="consultationType"
//                   value={formData.consultationType}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white hover:border-emerald-300"
//                 >
//                   <option value="online">💻 Online Consultation (Telemedicine)</option>
//                   <option value="inperson">🏥 In-Person Consultation</option>
//                   <option value="both">🌐 Both Options Available</option>
//                 </select>
//               </div>
//             </div>
            
//             {formData.consultationType === 'inperson' && (
//               <div className="mt-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Location/Address *</label>
//                 <textarea
//                   name="location"
//                   value={formData.location}
//                   onChange={handleChange}
//                   rows="2"
//                   placeholder="Enter clinic/hospital address"
//                   className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
//                     errors.location ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-emerald-300'
//                   }`}
//                 />
//                 {errors.location && (
//                   <p className="text-xs text-red-500 mt-1">{errors.location}</p>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Price Card */}
//           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
//               <div className="flex items-center gap-2">
//                 <div className="p-2 bg-emerald-100 rounded-lg">
//                   <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-lg font-semibold text-gray-800">Consultation Fee</h3>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setShowPriceHelp(!showPriceHelp)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </button>
//             </div>
            
//             {showPriceHelp && (
//               <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
//                 <p className="font-semibold mb-1">💡 Pricing Guidelines:</p>
//                 <ul className="list-disc list-inside space-y-1">
//                   <li>Minimum fee: ₹100</li>
//                   <li>Maximum fee: ₹10,000</li>
//                   <li>Consider your experience and specialization</li>
//                   <li>Competitive rates in your area</li>
//                 </ul>
//               </div>
//             )}
            
//             <div className="space-y-4">
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                   <span className="text-gray-500 font-semibold text-xl">₹</span>
//                 </div>
//                 <input
//                   type="text"
//                   name="price"
//                   value={formData.price}
//                   onChange={handlePriceChange}
//                   placeholder="Enter consultation fee"
//                   className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg ${
//                     errors.price ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-emerald-300'
//                   }`}
//                 />
//               </div>
              
//               {/* Price Presets */}
//               <div>
//                 <p className="text-xs text-gray-500 mb-2">Quick select amount:</p>
//                 <div className="flex flex-wrap gap-2">
//                   {pricePresets.map(price => (
//                     <button
//                       key={price}
//                       type="button"
//                       onClick={() => handlePresetPrice(price)}
//                       className="px-4 py-2 text-sm bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 rounded-lg transition-all duration-200 hover:scale-105"
//                     >
//                       ₹{price.toLocaleString()}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//               {errors.price && (
//                 <p className="text-xs text-red-500">{errors.price}</p>
//               )}
//             </div>
//           </div>

//           {/* Availability Status Card */}
//           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
//               <div className="p-2 bg-emerald-100 rounded-lg">
//                 <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold text-gray-800">Availability Status</h3>
//             </div>
//             <select
//               name="availabilityStatus"
//               value={formData.availabilityStatus}
//               onChange={handleChange}
//               className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium ${
//                 isUnavailable 
//                   ? 'bg-red-50 border-red-200 text-red-700' 
//                   : 'bg-green-50 border-green-200 text-green-700'
//               }`}
//             >
//               <option value="Available" className="text-green-700">✅ Available - Accepting appointments</option>
//               <option value="Unavailable" className="text-red-700">❌ Unavailable - No appointments</option>
//               <option value="Limited" className="text-yellow-700">⚠️ Limited Availability</option>
//             </select>
            
//             {isUnavailable && (
//               <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <p className="text-xs text-red-700 flex items-center gap-2">
//                   <span className="text-lg">⚠️</span>
//                   When set to Unavailable, patients cannot book appointments for this time slot.
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Recurring Schedule Card */}
//           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
//               <div className="flex items-center gap-2">
//                 <div className="p-2 bg-emerald-100 rounded-lg">
//                   <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                   </svg>
//                 </div>
//                 <h3 className="text-lg font-semibold text-gray-800">Recurring Schedule</h3>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setFormData(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
//                 className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
//                   formData.isRecurring ? 'bg-emerald-600' : 'bg-gray-300'
//                 }`}
//               >
//                 <span
//                   className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
//                     formData.isRecurring ? 'translate-x-6' : 'translate-x-1'
//                   }`}
//                 />
//               </button>
//             </div>
            
//             {formData.isRecurring && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Pattern</label>
//                 <select
//                   name="recurringPattern"
//                   value={formData.recurringPattern}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white hover:border-emerald-300"
//                 >
//                   <option value="daily">Daily - Repeats every day</option>
//                   <option value="weekly">Weekly - Repeats every week on this day</option>
//                   <option value="monthly">Monthly - Repeats every month on this date</option>
//                 </select>
//               </div>
//             )}
//           </div>

//           {/* Notes Card */}
//           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
//               <div className="p-2 bg-emerald-100 rounded-lg">
//                 <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold text-gray-800">Additional Notes</h3>
//             </div>
//             <textarea
//               name="notes"
//               value={formData.notes}
//               onChange={handleChange}
//               rows="3"
//               placeholder="Add any special instructions or notes for patients (e.g., preparation requirements, what to bring, etc.)"
//               className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-emerald-300"
//             />
//           </div>

//           {/* Summary Card */}
//           <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6 shadow-lg">
//             <div className="flex items-center gap-2 mb-4 border-b border-emerald-200 pb-3">
//               <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//               </svg>
//               <h3 className="text-lg font-semibold text-gray-800">Schedule Summary</h3>
//             </div>
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
//               <div>
//                 <p className="text-gray-600">Date</p>
//                 <p className="font-semibold text-gray-900">
//                   {formData.year}-{String(formData.month).padStart(2, '0')}-{String(formData.day).padStart(2, '0')}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-gray-600">Working Hours</p>
//                 <p className="font-semibold text-gray-900">{formData.startTime} - {formData.endTime}</p>
//               </div>
//               {formData.enableBreak && formData.breakStart && formData.breakEnd && (
//                 <div>
//                   <p className="text-gray-600">Break Time</p>
//                   <p className="font-semibold text-gray-900">{formData.breakStart} - {formData.breakEnd}</p>
//                 </div>
//               )}
//               <div>
//                 <p className="text-gray-600">Slot Duration</p>
//                 <p className="font-semibold text-gray-900">{formData.slotDuration} minutes</p>
//               </div>
//               <div>
//                 <p className="text-gray-600">Buffer Time</p>
//                 <p className="font-semibold text-gray-900">{formData.bufferTime} minutes</p>
//               </div>
//               <div>
//                 <p className="text-gray-600">Estimated Slots</p>
//                 <p className="font-semibold text-emerald-600 text-lg">{totalSlots} slots</p>
//               </div>
//               {formData.maxAppointments && (
//                 <div>
//                   <p className="text-gray-600">Max Appointments</p>
//                   <p className="font-semibold text-gray-900">{formData.maxAppointments}</p>
//                 </div>
//               )}
//               <div>
//                 <p className="text-gray-600">Consultation Fee</p>
//                 <p className="font-semibold text-emerald-600 text-lg">
//                   {formData.price ? `₹${parseFloat(formData.price).toLocaleString()}` : 'Not set'}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-gray-600">Status</p>
//                 <p className={`font-semibold ${isUnavailable ? 'text-red-600' : 'text-green-600'}`}>
//                   {formData.availabilityStatus}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-gray-600">Consultation Type</p>
//                 <p className="font-semibold text-gray-900 capitalize">
//                   {formData.consultationType === 'online' ? '💻 Online' : 
//                    formData.consultationType === 'inperson' ? '🏥 In-Person' : '🌐 Both'}
//                 </p>
//               </div>
//               {formData.isRecurring && (
//                 <div>
//                   <p className="text-gray-600">Recurring</p>
//                   <p className="font-semibold text-gray-900 capitalize">{formData.recurringPattern}</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-4 pt-4 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg">
//             <button
//               type="button"
//               onClick={() => navigate('/doctor/schedule')}
//               className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02]"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-[1.02]"
//             >
//               {isSubmitting ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                   </svg>
//                   Saving...
//                 </span>
//               ) : (
//                 isEditing ? 'Update Schedule' : 'Create Schedule'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ScheduleForm;