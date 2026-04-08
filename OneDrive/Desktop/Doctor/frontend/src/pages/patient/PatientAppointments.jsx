// src/pages/patient/PatientAppointments.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import AppointmentCard from '../../components/appointment/AppointmentCard';

const PatientAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const patient = parsedUser.patient || parsedUser;
            setUser(patient);
            fetchAppointments(patient._id || patient.id);
        } else {
            navigate('/login');
        }
    }, [navigate]);
    
    const fetchAppointments = async (patientId) => {
        setLoading(true);
        try {
            const response = await appointmentService.getAllPatientAppointments(patientId);
            if (response.success) {
                setAppointments(response.appointments || []);
            } else {
                setError(response.message);
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading appointments...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        View all your appointment history and current bookings
                    </p>
                </div>
                
                {/* Appointments List */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
                        {error}
                    </div>
                )}
                
                {appointments.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Appointments Yet</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            You haven't booked any appointments. Browse doctors to get started.
                        </p>
                        <button
                            onClick={() => navigate('/doctor/listing')}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Find a Doctor
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((appointment) => (
                            <AppointmentCard
                                key={appointment._id}
                                appointment={appointment}
                                isDoctorView={false}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientAppointments;