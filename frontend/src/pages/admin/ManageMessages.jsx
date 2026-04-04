// src/pages/admin/ManageMessages.jsx
import React, { useState, useEffect } from 'react';
import { Search, Mail, CheckCircle2, Trash2, X, AlertTriangle, Eye, Clock } from 'lucide-react';
import api from '../../services/api';

const ManageMessages = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/messages');
      setMessages(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredMessages = messages.filter(msg => 
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openMessage = async (msg) => {
    setSelectedMessage(msg);
    setIsViewModalOpen(true);
    
    // Automatically mark as 'read' if it was 'unread'
    if (msg.status === 'unread') {
      try {
        await api.put(`/admin/messages/${msg._id}`, { status: 'read' });
        setMessages(messages.map(m => m._id === msg._id ? { ...m, status: 'read' } : m));
      } catch (error) {
        console.error("Failed to update status");
      }
    }
  };

  const markAsResolved = async (id) => {
    try {
      await api.put(`/admin/messages/${id}`, { status: 'resolved' });
      setMessages(messages.map(m => m._id === id ? { ...m, status: 'resolved' } : m));
      setIsViewModalOpen(false);
    } catch (error) {
      console.error("Failed to resolve message");
    }
  };

  const deleteMessage = async (id) => {
    if(!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await api.delete(`/admin/messages/${id}`);
      setMessages(messages.filter(m => m._id !== id));
      setIsViewModalOpen(false);
    } catch (error) {
      console.error("Failed to delete message");
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'unread': return <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-sm">New</span>;
      case 'read': return <span className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded-full">Read</span>;
      case 'resolved': return <span className="px-3 py-1 bg-secondary-container text-secondary text-xs font-bold rounded-full">Resolved</span>;
      default: return null;
    }
  };

  return (
    <div className="p-8 font-body bg-surface min-h-screen text-on-surface relative">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
            <Mail size={28} /> Support Inbox
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Review and manage inquiries from patients and doctors.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Inbox Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant text-sm uppercase tracking-wider">
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Sender</th>
                <th className="p-4 font-bold">Subject</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant font-bold">Loading inbox...</td></tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4 text-outline">
                      <CheckCircle2 size={32} />
                    </div>
                    <p className="text-on-surface font-bold text-lg">You're all caught up!</p>
                    <p className="text-on-surface-variant text-sm">No messages found.</p>
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg._id} className={`hover:bg-surface-container-lowest/50 transition-colors ${msg.status === 'unread' ? 'bg-primary/5' : ''}`}>
                    <td className="p-4">{getStatusBadge(msg.status)}</td>
                    <td className="p-4">
                      <p className={`text-sm ${msg.status === 'unread' ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant'}`}>{msg.name}</p>
                      <p className="text-xs text-outline">{msg.email}</p>
                    </td>
                    <td className="p-4">
                      <p className={`text-sm truncate max-w-[250px] ${msg.status === 'unread' ? 'font-bold text-primary' : 'font-medium text-on-surface'}`}>
                        {msg.subject}
                      </p>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => openMessage(msg)} className="px-4 py-2 bg-surface-container-high hover:bg-outline-variant/30 text-on-surface text-sm font-bold rounded-xl transition-colors flex items-center gap-2 mx-auto">
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Read Message Modal */}
      {isViewModalOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-[2rem] shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-start bg-surface-container-low">
              <div>
                <h3 className="text-xl font-bold font-headline text-primary mb-1">{selectedMessage.subject}</h3>
                <p className="text-sm text-on-surface-variant flex items-center gap-2">
                  From: <span className="font-bold text-on-surface">{selectedMessage.name}</span> ({selectedMessage.email})
                </p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-on-surface-variant hover:text-error transition-colors p-1"><X size={24}/></button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[60vh] bg-surface">
              <div className="flex items-center gap-2 text-xs text-outline mb-6">
                <Clock size={14} /> Received on {new Date(selectedMessage.createdAt).toLocaleString()}
              </div>
              <p className="text-on-surface leading-relaxed whitespace-pre-wrap font-medium text-[15px]">
                {selectedMessage.message}
              </p>
            </div>

            <div className="p-6 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-between items-center">
              <button 
                onClick={() => deleteMessage(selectedMessage._id)} 
                className="flex items-center gap-2 px-4 py-2.5 text-error hover:bg-error-container rounded-xl font-bold text-sm transition-colors"
              >
                <Trash2 size={18} /> Delete
              </button>
              
              <div className="flex gap-3">
                <button onClick={() => setIsViewModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors text-sm">
                  Close
                </button>
                {selectedMessage.status !== 'resolved' && (
                  <button 
                    onClick={() => markAsResolved(selectedMessage._id)} 
                    className="px-5 py-2.5 rounded-xl font-bold bg-secondary text-white shadow-md hover:bg-secondary/90 transition-colors flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2 size={18} /> Mark Resolved
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ManageMessages;