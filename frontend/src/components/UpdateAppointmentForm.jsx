import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const UpdateAppointmentForm = ({ appointment, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    symptoms: appointment?.symptoms || '',
    medicalHistory: appointment?.medicalHistory || '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingReports] = useState(appointment?.uploadedReports || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleViewReport = (report) => {
    try {
      let fileUrl;
      const baseUrl = 'http://localhost:5015';
      
      if (report.filePath) {
        if (report.filePath.startsWith('http')) {
          fileUrl = report.filePath;
        } else if (report.filePath.startsWith('/uploads')) {
          fileUrl = `${baseUrl}${report.filePath}`;
        } else {
          const filename = report.filePath.split(/[\\/]/).pop();
          fileUrl = `${baseUrl}/uploads/appointments/${filename}`;
        }
      } else if (report.fileName) {
        fileUrl = `${baseUrl}/uploads/appointments/${report.fileName}`;
      } else {
        alert('Unable to view report: Invalid file path');
        return;
      }
      
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error opening report:', error);
      alert('Unable to view report. Please try again later.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const submitFormData = new FormData();
      submitFormData.append('symptoms', formData.symptoms);
      submitFormData.append('medicalHistory', formData.medicalHistory);
      
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
        // Call the onUpdate callback with the updated appointment data
        if (onUpdate) {
          onUpdate(data.appointment);
        }
        onClose();
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

  if (!appointment) return null;

  return (
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
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-3xl z-10">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Symptoms / Reason for Visit
            </label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              placeholder="Describe your symptoms..."
            />
          </div>

          {/* Medical History */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Medical History
            </label>
            <textarea
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              placeholder="Any relevant medical history..."
            />
          </div>

          {/* Existing Reports */}
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
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Reports */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload New Reports (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-all hover:bg-blue-50"
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
            />
            
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">New files to upload:</p>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText size={14} className="text-blue-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600 truncate">{file.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Message */}
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Only symptoms, medical history, and reports can be updated. 
              Doctor, date, time, and fee cannot be changed. Please cancel and rebook if you need to change these details.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UpdateAppointmentForm;