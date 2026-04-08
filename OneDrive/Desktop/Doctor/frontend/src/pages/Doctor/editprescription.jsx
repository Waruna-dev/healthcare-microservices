import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, Stethoscope, CheckCircle, XCircle, 
  AlertCircle, Activity, FileText, CreditCard, Video,
  ArrowLeft, Download, Mail, Phone, MapPin, Heart, Brain,
  Pill, Syringe, FlaskConical, TrendingUp, Plus, Trash2, Save,
  Eye, EyeOff, Upload, FileImage, FileText as FileTextIcon,
  Edit2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const EditPrescription = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [existingPrescription, setExistingPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Prescription form state
  const [prescription, setPrescription] = useState({
    diagnosis: '',
    symptoms: '',
    medicines: [
      { name: '', dosage: '', frequency: '', duration: '', instructions: '', type: 'tablet' }
    ],
    notes: '',
    followUpDate: '',
    followUpNotes: '',
    tests: [],
    lifestyle: {
      diet: '',
      exercise: '',
      restrictions: []
    },
    attachments: []
  });

  const medicineTypes = [
    { value: 'tablet', label: 'Tablet', icon: Pill },
    { value: 'syrup', label: 'Syrup', icon: FlaskConical },
    { value: 'injection', label: 'Injection', icon: Syringe },
    { value: 'capsule', label: 'Capsule', icon: Pill },
    { value: 'drops', label: 'Drops', icon: FlaskConical },
    { value: 'ointment', label: 'Ointment', icon: Heart }
  ];

  const commonRestrictions = [
    'No spicy food', 'No oily food', 'No sugar', 'No alcohol', 
    'No smoking', 'Avoid dairy', 'Light exercise only', 
    'Complete rest', 'No heavy lifting', 'Avoid caffeine'
  ];

  const commonTests = [
    'Blood Test', 'Urine Test', 'X-Ray', 'ECG', 
    'MRI', 'CT Scan', 'Ultrasound', 'Blood Pressure',
    'Sugar Test', 'Cholesterol Test', 'Liver Function Test'
  ];

  // Fetch appointment details
  const fetchAppointmentDetails = async () => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const doctorId = user?._id || user?.id;
      const url = `http://localhost:5015/api/appointments/doctor/public/${doctorId}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.appointments) {
        const foundAppointment = data.appointments.find(apt => apt._id === appointmentId);
        if (foundAppointment) {
          setAppointment(foundAppointment);
        }
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing prescription
  const fetchExistingPrescription = async () => {
    try {
      const response = await fetch(`http://localhost:5025/api/prescriptions/appointment/${appointmentId}`);
      const data = await response.json();
      
      if (data.success && data.prescription) {
        setExistingPrescription(data.prescription);
        // Pre-fill form with existing data
        setPrescription({
          diagnosis: data.prescription.diagnosis || '',
          symptoms: data.prescription.symptoms || '',
          medicines: data.prescription.medicines && data.prescription.medicines.length > 0 
            ? data.prescription.medicines 
            : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '', type: 'tablet' }],
          notes: data.prescription.notes || '',
          followUpDate: data.prescription.followUpDate || '',
          followUpNotes: data.prescription.followUpNotes || '',
          tests: data.prescription.tests || [],
          lifestyle: {
            diet: data.prescription.lifestyle?.diet || '',
            exercise: data.prescription.lifestyle?.exercise || '',
            restrictions: data.prescription.lifestyle?.restrictions || []
          },
          attachments: data.prescription.attachments || []
        });
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
    fetchExistingPrescription();
  }, [appointmentId]);

  const handleAddMedicine = () => {
    setPrescription(prev => ({
      ...prev,
      medicines: [...prev.medicines, { 
        name: '', 
        dosage: '', 
        frequency: '', 
        duration: '', 
        instructions: '', 
        type: 'tablet' 
      }]
    }));
  };

  const handleRemoveMedicine = (index) => {
    setPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.map((medicine, i) => 
        i === index ? { ...medicine, [field]: value } : medicine
      )
    }));
  };

  const handleAddTest = (test) => {
    if (!prescription.tests.includes(test)) {
      setPrescription(prev => ({
        ...prev,
        tests: [...prev.tests, test]
      }));
    }
  };

  const handleRemoveTest = (test) => {
    setPrescription(prev => ({
      ...prev,
      tests: prev.tests.filter(t => t !== test)
    }));
  };

  const handleToggleRestriction = (restriction) => {
    setPrescription(prev => ({
      ...prev,
      lifestyle: {
        ...prev.lifestyle,
        restrictions: prev.lifestyle.restrictions.includes(restriction)
          ? prev.lifestyle.restrictions.filter(r => r !== restriction)
          : [...prev.lifestyle.restrictions, restriction]
      }
    }));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file: file
    }));
    
    setPrescription(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const handleRemoveAttachment = (index) => {
    setPrescription(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validatePrescription = () => {
    if (!prescription.diagnosis.trim()) {
      alert('Please enter a diagnosis');
      return false;
    }
    
    const validMedicines = prescription.medicines.filter(med => med.name.trim());
    if (validMedicines.length === 0) {
      alert('Please add at least one medicine');
      return false;
    }
    
    for (const medicine of validMedicines) {
      if (!medicine.dosage.trim() || !medicine.frequency.trim() || !medicine.duration.trim()) {
        alert('Please fill in all medicine details');
        return false;
      }
    }
    
    return true;
  };

  const handleUpdatePrescription = async () => {
    if (!validatePrescription()) return;
    
    setSaving(true);
    try {
      const validMedicines = prescription.medicines.filter(med => med.name.trim());
      
      const prescriptionData = {
        appointmentId: appointmentId,
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        doctorId: user?._id || user?.id,
        doctorName: user?.name || 'Dr. ' + user?.email?.split('@')[0],
        diagnosis: prescription.diagnosis,
        symptoms: prescription.symptoms,
        medicines: validMedicines,
        notes: prescription.notes,
        followUpDate: prescription.followUpDate,
        followUpNotes: prescription.followUpNotes,
        tests: prescription.tests,
        lifestyle: prescription.lifestyle,
        attachments: prescription.attachments.map(att => ({
          name: att.name,
          size: att.size,
          type: att.type
        }))
      };

      const response = await fetch(`http://localhost:5025/api/prescriptions/${existingPrescription._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Prescription updated successfully!');
        navigate(`/doctor/prescriptions/${appointmentId}`);
      } else {
        alert('Failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prescription data...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Appointment Not Found</h2>
          <button
            onClick={() => navigate('/doctor/prescriptions')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Prescriptions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/doctor/prescriptions/${appointmentId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Edit Prescription</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handleUpdatePrescription}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Prescription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {appointment.patientName?.charAt(0) || 'P'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{appointment.patientName}</h2>
              <p className="text-gray-500">{appointment.patientEmail}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(appointment.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {appointment.startTime} - {appointment.endTime}
                </span>
              </div>
            </div>
            {existingPrescription && (
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                Existing Prescription
              </div>
            )}
          </div>
        </div>

        {!showPreview ? (
          <div className="space-y-8">
            {/* Diagnosis Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                Diagnosis & Symptoms
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={prescription.diagnosis}
                    onChange={(e) => setPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter diagnosis based on symptoms and examination..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms (from appointment)
                  </label>
                  <textarea
                    value={prescription.symptoms}
                    onChange={(e) => setPrescription(prev => ({ ...prev, symptoms: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Patient's reported symptoms..."
                  />
                </div>
              </div>
            </motion.div>

            {/* Medicines Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-green-600" />
                  Medicines <span className="text-red-500">*</span>
                </h3>
                <button
                  onClick={handleAddMedicine}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Medicine
                </button>
              </div>
              
              <div className="space-y-4">
                {prescription.medicines.map((medicine, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Medicine name *"
                        value={medicine.name}
                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={medicine.type}
                        onChange={(e) => handleMedicineChange(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {medicineTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Dosage * (e.g., 500mg)"
                        value={medicine.dosage}
                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Frequency * (e.g., 2x daily)"
                        value={medicine.frequency}
                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Duration * (e.g., 7 days)"
                        value={medicine.duration}
                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Special instructions (optional)"
                        value={medicine.instructions}
                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {prescription.medicines.length > 1 && (
                        <button
                          onClick={() => handleRemoveMedicine(index)}
                          className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Additional Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Additional Notes
              </h3>
              <textarea
                value={prescription.notes}
                onChange={(e) => setPrescription(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Additional instructions for the patient..."
              />
            </motion.div>
          </div>
        ) : (
          /* Preview Mode */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Prescription Preview</h2>
                <p className="text-gray-500">Review before updating</p>
              </div>
              
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="font-bold text-gray-900 mb-2">Patient: {appointment.patientName}</h3>
                  <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Doctor: {user?.name || 'Dr. ' + user?.email?.split('@')[0]}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Diagnosis:</h4>
                  <p className="text-gray-700">{prescription.diagnosis || 'Not specified'}</p>
                </div>
                
                {prescription.symptoms && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Symptoms:</h4>
                    <p className="text-gray-700">{prescription.symptoms}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Medicines:</h4>
                  <div className="space-y-2">
                    {prescription.medicines.filter(m => m.name).map((medicine, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-green-900">{medicine.name} ({medicine.type})</p>
                        <p className="text-sm text-green-700">
                          {medicine.dosage} - {medicine.frequency} - {medicine.duration}
                        </p>
                        {medicine.instructions && (
                          <p className="text-sm text-green-600">Instructions: {medicine.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {prescription.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Additional Notes:</h4>
                    <p className="text-gray-700">{prescription.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EditPrescription;