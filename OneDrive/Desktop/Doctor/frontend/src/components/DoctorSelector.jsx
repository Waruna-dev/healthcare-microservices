import React, { useState, useEffect } from 'react';
import { fetchValidDoctors, validateDoctorId } from '../utils/doctorId';

const DoctorSelector = ({ onDoctorSelect, selectedDoctorId, placeholder = "Select a doctor..." }) => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        try {
            setLoading(true);
            const doctorsData = await fetchValidDoctors();
            setDoctors(doctorsData);
            setError('');
        } catch (err) {
            setError('Failed to load doctors');
            console.error('Error loading doctors:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = async (e) => {
        const doctorId = e.target.value;
        
        if (doctorId) {
            // Validate the selected doctor ID
            const isValid = await validateDoctorId(doctorId);
            if (isValid) {
                const selectedDoctor = doctors.find(doc => doc._id === doctorId);
                onDoctorSelect(doctorId, selectedDoctor);
            } else {
                setError('Invalid doctor selected');
            }
        } else {
            onDoctorSelect('', null);
        }
    };

    if (loading) {
        return (
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor
                </label>
                <select 
                    disabled 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                >
                    <option>Loading doctors...</option>
                </select>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor
                </label>
                <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-700">
                    {error}
                    <button 
                        onClick={loadDoctors}
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor *
            </label>
            <select
                value={selectedDoctorId || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
            >
                <option value="">{placeholder}</option>
                {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.name} - {doctor.specialty} ({doctor.status})
                    </option>
                ))}
            </select>
            {doctors.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                    No doctors available. Please register a doctor first.
                </p>
            )}
        </div>
    );
};

export default DoctorSelector;
