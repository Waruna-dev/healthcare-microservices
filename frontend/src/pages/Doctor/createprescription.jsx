import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, Stethoscope, CheckCircle, XCircle, 
  AlertCircle, Activity, FileText, CreditCard, Video,
  ArrowLeft, Download, Mail, Phone, MapPin, Heart, Brain,
  Pill, Syringe, FlaskConical, TrendingUp, Plus, Trash2, Save,
  Eye, EyeOff, Upload, FileImage, FileText as FileTextIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CreatePrescription = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
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
      const url = `/api/appointments/doctor/public/${doctorId}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.appointments) {
        const foundAppointment = data.appointments.find(apt => apt._id === appointmentId);
        if (foundAppointment) {
          setAppointment(foundAppointment);
          // Pre-fill symptoms from appointment
          setPrescription(prev => ({
            ...prev,
            symptoms: foundAppointment.symptoms || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
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

  const handleSavePrescription = async () => {
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

      const response = await fetch('/api/prescriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Prescription created successfully!');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
              <h1 className="text-xl font-bold text-gray-900">Create Prescription</h1>
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
                onClick={handleSavePrescription}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Prescription
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

            {/* Tests Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Recommended Tests
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Common tests (click to add):</p>
                <div className="flex flex-wrap gap-2">
                  {commonTests.map(test => (
                    <button
                      key={test}
                      onClick={() => handleAddTest(test)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        prescription.tests.includes(test)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {test}
                    </button>
                  ))}
                </div>
              </div>
              
              {prescription.tests.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-xl">
                  <p className="text-sm font-medium text-purple-900 mb-2">Selected Tests:</p>
                  <div className="flex flex-wrap gap-2">
                    {prescription.tests.map((test, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1"
                      >
                        {test}
                        <button
                          onClick={() => handleRemoveTest(test)}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          <XCircle size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Lifestyle Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Lifestyle Recommendations
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diet Instructions</label>
                  <textarea
                    value={prescription.lifestyle.diet}
                    onChange={(e) => setPrescription(prev => ({
                      ...prev,
                      lifestyle: { ...prev.lifestyle, diet: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Diet recommendations..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Instructions</label>
                  <textarea
                    value={prescription.lifestyle.exercise}
                    onChange={(e) => setPrescription(prev => ({
                      ...prev,
                      lifestyle: { ...prev.lifestyle, exercise: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Exercise recommendations..."
                  />
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Restrictions (click to toggle):</p>
                  <div className="flex flex-wrap gap-2">
                    {commonRestrictions.map(restriction => (
                      <button
                        key={restriction}
                        onClick={() => handleToggleRestriction(restriction)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          prescription.lifestyle.restrictions.includes(restriction)
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {restriction}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Follow-up Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Follow-up Plan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date (Optional)</label>
                  <input
                    type="date"
                    value={prescription.followUpDate}
                    onChange={(e) => setPrescription(prev => ({ ...prev, followUpDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Notes</label>
                  <input
                    type="text"
                    value={prescription.followUpNotes}
                    onChange={(e) => setPrescription(prev => ({ ...prev, followUpNotes: e.target.value }))}
                    placeholder="Reason for follow-up..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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

            {/* Attachments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Attachments
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-gray-600">Click to upload files</p>
                  <p className="text-sm text-gray-500">PDF, Images, Documents</p>
                </label>
              </div>
              
              {prescription.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {prescription.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {attachment.type.startsWith('image/') ? (
                          <FileImage className="w-5 h-5 text-green-600" />
                        ) : (
                          <FileTextIcon className="w-5 h-5 text-blue-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{attachment.name}</p>
                          <p className="text-sm text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                <p className="text-gray-500">Review before saving</p>
              </div>
              
              {/* Preview content here */}
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
                
                {prescription.tests.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Recommended Tests:</h4>
                    <div className="flex flex-wrap gap-2">
                      {prescription.tests.map((test, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {test}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {(prescription.lifestyle.diet || prescription.lifestyle.exercise || prescription.lifestyle.restrictions.length > 0) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Lifestyle Recommendations:</h4>
                    {prescription.lifestyle.diet && (
                      <p className="text-gray-700 mb-1"><strong>Diet:</strong> {prescription.lifestyle.diet}</p>
                    )}
                    {prescription.lifestyle.exercise && (
                      <p className="text-gray-700 mb-1"><strong>Exercise:</strong> {prescription.lifestyle.exercise}</p>
                    )}
                    {prescription.lifestyle.restrictions.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Restrictions:</p>
                        <div className="flex flex-wrap gap-1">
                          {prescription.lifestyle.restrictions.map((restriction, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                              {restriction}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {prescription.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Additional Notes:</h4>
                    <p className="text-gray-700">{prescription.notes}</p>
                  </div>
                )}
                
                {prescription.followUpDate && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Follow-up:</h4>
                    <p className="text-gray-700">Date: {new Date(prescription.followUpDate).toLocaleDateString()}</p>
                    {prescription.followUpNotes && (
                      <p className="text-gray-700">Notes: {prescription.followUpNotes}</p>
                    )}
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

export default CreatePrescription;