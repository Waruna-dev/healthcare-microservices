// src/pages/admin/ManageDoctor.jsx
import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, X, User, Mail, Phone, AlertTriangle, CheckCircle, Lock, Stethoscope, FileText } from 'lucide-react';
import axios from 'axios';

const ManageDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // NEW: Tracks button loading states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Delete Confirmation State
  const [doctorToDelete, setDoctorToDelete] = useState(null);

  // Custom Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const specialties = [
    'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics',
    'Dermatology', 'Psychiatry', 'Radiology', 'Surgery',
    'Oncology', 'Gynecology', 'Urology', 'Ophthalmology',
    'Emergency Medicine', 'Family Medicine', 'Internal Medicine'
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.get('/api/admin/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allDoctors = response.data.data || [];
      const approvedDoctors = allDoctors.filter(doc => doc.status === 'approved');
      setDoctors(approvedDoctors);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      showToast("Failed to load doctors.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000); 
  };

  // FIX: Added optional chaining (?.) to prevent crashes if a field is undefined
  const filteredDoctors = doctors.filter(doc => 
    doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (doctor) => {
    setSelectedDoctor({ ...doctor, password: '' }); 
    setIsEditModalOpen(true);
  };

  const handleModalChange = (e) => {
    setSelectedDoctor({ ...selectedDoctor, [e.target.name]: e.target.value });
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    try {
      setIsProcessing(true); // Disable button
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/admin/doctors/${selectedDoctor._id}`, selectedDoctor, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // FIX: Fetch fresh data instead of guessing the array state
      await fetchDoctors(); 
      
      setIsEditModalOpen(false);
      showToast("Doctor profile updated successfully!", "success");
    } catch (error) {
      showToast("Failed to update doctor details.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openDeleteModal = (doctor) => {
    setDoctorToDelete(doctor);
  };

  const executeDelete = async () => {
    if (!doctorToDelete) return;

    try {
      setIsProcessing(true); // Disable button
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/admin/doctors/${doctorToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // FIX: Fetch fresh data to guarantee the UI matches the database perfectly
      await fetchDoctors();
      
      setDoctorToDelete(null); 
      showToast("Doctor permanently deleted.", "success");
    } catch (error) {
      setDoctorToDelete(null);
      showToast("Failed to delete doctor.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 font-body bg-surface min-h-screen text-on-surface relative">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Manage Doctors</h1>
          <p className="text-on-surface-variant text-sm mt-1">View, update, and remove approved doctor accounts.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
          <input 
            type="text" 
            placeholder="Search name, email, or license..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant text-sm uppercase tracking-wider">
                <th className="p-4 font-bold">Doctor</th>
                <th className="p-4 font-bold">Contact</th>
                <th className="p-4 font-bold">License No.</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant font-bold">Loading doctors...</td></tr>
              ) : filteredDoctors.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant font-bold">No approved doctors found.</td></tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-container text-primary rounded-full flex items-center justify-center font-bold overflow-hidden">
                          {doctor.profilePicture ? (
                            <img src={doctor.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <Stethoscope size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">Dr. {doctor.name}</p>
                          <p className="text-xs text-primary font-medium">{doctor.specialty || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-on-surface flex items-center gap-2"><Mail size={14} className="text-outline"/> {doctor.email}</p>
                      <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-1"><Phone size={14} className="text-outline"/> {doctor.phone || 'N/A'}</p>
                    </td>
                    <td className="p-4 text-sm text-on-surface font-mono tracking-wider">
                      {doctor.licenseNumber || 'N/A'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEditModal(doctor)} className="p-2 bg-secondary-container text-secondary rounded-lg hover:opacity-80 transition-opacity" title="Edit Doctor">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => openDeleteModal(doctor)} className="p-2 bg-error-container text-error rounded-lg hover:opacity-80 transition-opacity" title="Delete Doctor">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-[2rem] shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <h3 className="text-xl font-bold font-headline text-primary">Update Doctor Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-on-surface-variant hover:text-error transition-colors"><X size={24}/></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleUpdateDoctor} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold ml-1">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                      <input name="name" value={selectedDoctor.name} onChange={handleModalChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold ml-1">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                      <input name="email" type="email" value={selectedDoctor.email} onChange={handleModalChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold ml-1">Specialty</label>
                    <select name="specialty" value={selectedDoctor.specialty} onChange={handleModalChange} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select Specialty</option>
                      {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold ml-1">License Number</label>
                    <div className="relative">
                      <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                      <input name="licenseNumber" value={selectedDoctor.licenseNumber || ''} onChange={handleModalChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary font-mono" required />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input name="phone" value={selectedDoctor.phone || ''} onChange={handleModalChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                <div className="space-y-1 border-t border-outline-variant/20 pt-4">
                  <label className="text-sm font-bold ml-1">Reset Password <span className="text-on-surface-variant font-normal italic">(Optional)</span></label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input 
                      name="password" 
                      type="password"
                      value={selectedDoctor.password || ''} 
                      onChange={handleModalChange} 
                      placeholder="Enter new password to reset"
                      className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner text-sm" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 justify-end">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors" disabled={isProcessing}>Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-primary text-white shadow-md hover:bg-primary-container transition-colors disabled:opacity-50" disabled={isProcessing}>
                    {isProcessing ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {doctorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-[2rem] shadow-2xl border border-outline-variant/30 overflow-hidden p-6 text-center transform transition-all">
            
            <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle size={32} />
            </div>
            
            <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Delete Doctor Account?</h3>
            <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
              Are you absolutely sure you want to delete <span className="font-bold text-on-surface">Dr. {doctorToDelete.name}</span>? This action cannot be undone and will erase their schedule, profile, and history.
            </p>

            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDoctorToDelete(null)} 
                className="flex-1 px-5 py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-colors border border-outline-variant/50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                className="flex-1 px-5 py-3 rounded-xl font-bold bg-error text-white shadow-md hover:bg-error/90 transition-colors disabled:opacity-50"
                disabled={isProcessing}
              >
                {isProcessing ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transform transition-all duration-300 animate-in slide-in-from-bottom-5 ${
          toast.type === 'error' ? 'bg-error text-white' : 'bg-surface-container-highest text-on-surface'
        }`}>
          {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} className="text-primary" />}
          <p className="font-bold text-sm">{toast.message}</p>
        </div>
      )}

    </div>
  );
};

export default ManageDoctor;