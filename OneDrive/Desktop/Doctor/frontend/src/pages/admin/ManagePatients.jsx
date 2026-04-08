// src/pages/admin/ManagePatients.jsx
import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, X, User, Mail, Phone, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import api from '../../services/api';

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Delete Confirmation State
  const [patientToDelete, setPatientToDelete] = useState(null);

  // Custom Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 1. Fetch all patients on load
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/patients');
      setPatients(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      showToast("Failed to load patients.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Show Custom Toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000); 
  };

  // 2. Handle Search Filter
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Edit Patient Controls
  const openEditModal = (patient) => {
    // We initialize the modal with a blank password field
    setSelectedPatient({ ...patient, password: '' }); 
    setIsEditModalOpen(true);
  };

  const handleModalChange = (e) => {
    setSelectedPatient({ ...selectedPatient, [e.target.name]: e.target.value });
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    try {
      // API call includes the optional password field
      await api.put(`/admin/patients/${selectedPatient._id}`, selectedPatient);
      
      setPatients(patients.map(p => p._id === selectedPatient._id ? selectedPatient : p));
      setIsEditModalOpen(false);
      showToast("Patient profile updated successfully!", "success");
    } catch (error) {
      showToast("Failed to update patient details.", "error");
    }
  };

  // 4. Delete Patient Controls
  const openDeleteModal = (patient) => {
    setPatientToDelete(patient);
  };

  const executeDelete = async () => {
    if (!patientToDelete) return;

    try {
      await api.delete(`/admin/patients/${patientToDelete._id}`);
      setPatients(patients.filter(p => p._id !== patientToDelete._id));
      setPatientToDelete(null); 
      showToast("Patient permanently deleted.", "success");
    } catch (error) {
      setPatientToDelete(null);
      showToast("Failed to delete patient.", "error");
    }
  };

  return (
    <div className="p-8 font-body bg-surface min-h-screen text-on-surface relative">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Manage Patients</h1>
          <p className="text-on-surface-variant text-sm mt-1">View, update, and remove patient accounts from the system.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant text-sm uppercase tracking-wider">
                <th className="p-4 font-bold">Patient</th>
                <th className="p-4 font-bold">Contact</th>
                <th className="p-4 font-bold">Joined Date</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant font-bold">Loading patients...</td></tr>
              ) : filteredPatients.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant font-bold">No patients found.</td></tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* --- UPDATED: PROFILE PICTURE LOGIC --- */}
                        <div className="w-10 h-10 bg-primary-container text-primary rounded-full flex items-center justify-center font-bold shrink-0 overflow-hidden border border-primary/20">
                          {patient.profilePicture ? (
                            <img src={patient.profilePicture} alt={patient.name} className="w-full h-full object-cover" />
                          ) : (
                            patient.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{patient.name}</p>
                          <p className="text-xs text-on-surface-variant">ID: {patient._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-on-surface flex items-center gap-2"><Mail size={14} className="text-outline"/> {patient.email}</p>
                      <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-1"><Phone size={14} className="text-outline"/> {patient.contactNumber || 'N/A'}</p>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEditModal(patient)} className="p-2 bg-secondary-container text-secondary rounded-lg hover:opacity-80 transition-opacity" title="Edit Patient">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => openDeleteModal(patient)} className="p-2 bg-error-container text-error rounded-lg hover:opacity-80 transition-opacity" title="Delete Patient">
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

      {/* --- 1. UPDATE MODAL --- */}
      {isEditModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-[2rem] shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <h3 className="text-xl font-bold font-headline text-primary">Update Patient Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-on-surface-variant hover:text-error transition-colors"><X size={24}/></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleUpdatePatient} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold ml-1">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input name="name" value={selectedPatient.name} onChange={handleModalChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input name="email" type="email" value={selectedPatient.email} onChange={handleModalChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input name="contactNumber" value={selectedPatient.contactNumber || ''} onChange={handleModalChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                {/* --- NEW PASSWORD RESET FIELD --- */}
                <div className="space-y-1 border-t border-outline-variant/20 pt-4">
                  <label className="text-sm font-bold ml-1">Reset Password <span className="text-on-surface-variant font-normal italic">(Optional)</span></label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input 
                      name="password" 
                      type="password"
                      value={selectedPatient.password || ''} 
                      onChange={handleModalChange} 
                      placeholder="Enter new password to reset"
                      className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner text-sm" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 justify-end">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-primary text-white shadow-md hover:bg-primary-container transition-colors">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. DELETE CONFIRMATION MODAL --- */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-[2rem] shadow-2xl border border-outline-variant/30 overflow-hidden p-6 text-center transform transition-all">
            
            <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle size={32} />
            </div>
            
            <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Delete Patient Account?</h3>
            <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
              Are you absolutely sure you want to delete <span className="font-bold text-on-surface">{patientToDelete.name}</span>? This action cannot be undone and will erase all associated records.
            </p>

            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setPatientToDelete(null)} 
                className="flex-1 px-5 py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-colors border border-outline-variant/50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                className="flex-1 px-5 py-3 rounded-xl font-bold bg-error text-white shadow-md hover:bg-error/90 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 3. CUSTOM TOAST NOTIFICATION --- */}
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

export default ManagePatients;