import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, FileText, CheckCircle, AlertCircle, Eye, Trash2 } from 'lucide-react';

const UpdateAppointmentForm = ({ appointment, onClose, onUpdate }) => {
  const [symptoms, setSymptoms] = useState(appointment?.symptoms || '');
  const [medicalHistory, setMedicalHistory] = useState(appointment?.medicalHistory || '');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingReports] = useState(appointment?.uploadedReports || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef(null);
  const modalContentRef = useRef(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSymptomsChange = (e) => {
    setSymptoms(e.target.value);
  };

  const handleMedicalHistoryChange = (e) => {
    setMedicalHistory(e.target.value);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      if (!isValidType) alert(`${file.name}: Invalid file type. Only PDF, JPEG, PNG allowed.`);
      if (!isValidSize) alert(`${file.name}: File too large. Max 5MB.`);
      return isValidType && isValidSize;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePreviewFile = (file) => {
    if (file.type?.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowPreviewModal(true);
    } else if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    } else {
      alert('Preview not available for this file type');
    }
  };

  const handleViewReport = (report) => {
    try {
      if (report.filePath) {
        window.open(report.filePath, '_blank');
      } else {
        alert('Unable to view report: Invalid file path');
      }
    } catch (error) {
      console.error('Error opening report:', error);
      alert('Unable to view report. Please try again later.');
    }
  };

  const closePreviewModal = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setShowPreviewModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const submitFormData = new FormData();
      submitFormData.append('symptoms', symptoms);
      submitFormData.append('medicalHistory', medicalHistory);
      
      selectedFiles.forEach(file => {
        submitFormData.append('reports', file);
      });
      
      const response = await fetch(`http://localhost:5015/api/appointments/${appointment._id}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitFormData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        if (onUpdate) {
          onUpdate(data.appointment);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to update appointment');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Error updating appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview Modal Component
  const PreviewModal = () => {
    if (!showPreviewModal || !previewUrl) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
        onClick={closePreviewModal}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
            <h3 className="text-white font-semibold">File Preview</h3>
            <button onClick={closePreviewModal} className="text-white hover:bg-white/20 rounded-lg p-1 transition">
              <X size={20} />
            </button>
          </div>
          <div className="p-4 flex justify-center items-center min-h-[300px] bg-gray-100">
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (!appointment) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ overflow: 'hidden' }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-3xl z-10 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Update Appointment</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Dr. {appointment.doctorName} - {formatDate(appointment.date)}
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/20 rounded-xl transition"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          
          <div 
            className="flex-1 overflow-y-auto p-6 space-y-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <style>
              {`
                .flex-1::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>

         
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Success!</p>
                  <p className="text-sm text-green-600">Appointment updated successfully.</p>
                </div>
              </div>
            )}

            {error && !success && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Symptoms / Reason for Visit
              </label>
              <textarea
                value={symptoms}
                onChange={handleSymptomsChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Describe your symptoms..."
                disabled={success}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical History
              </label>
              <textarea
                value={medicalHistory}
                onChange={handleMedicalHistoryChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Any relevant medical history..."
                disabled={success}
              />
            </div>

            {existingReports.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Existing Reports ({existingReports.length})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50">
                  {existingReports.map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText size={16} className="text-blue-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{report.fileName || 'Medical Report'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewReport(report)}
                        className="text-blue-600 text-xs hover:underline px-2 py-1"
                        disabled={success}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

        
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload New Reports (Optional)
              </label>
              <div
                onClick={() => !success && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition-all ${
                  !success ? 'cursor-pointer hover:border-blue-500 hover:bg-blue-50' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG (Max 5MB each)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                disabled={success}
              />
              
              {selectedFiles.length > 0 && !success && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">New files to upload ({selectedFiles.length}):</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {file.type?.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt="preview" 
                              className="w-8 h-8 rounded object-cover"
                              onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                            />
                          ) : (
                            <FileText size={16} className="text-blue-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-600 truncate block">{file.name}</span>
                            <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {file.type?.startsWith('image/') && (
                            <button
                              type="button"
                              onClick={() => handlePreviewFile(file)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Preview"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Only symptoms, medical history, and reports can be updated. 
                Doctor, date, time, and fee cannot be changed. Please cancel and rebook if you need to change these details.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 px-6 pb-6 pt-2 border-t border-gray-100">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || success}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle size={18} />
                    <span>Updated!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

     
      {showPreviewModal && <PreviewModal />}
    </>
  );
};

export default UpdateAppointmentForm;