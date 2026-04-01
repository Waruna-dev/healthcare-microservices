import React, { useState } from 'react';
import { Clock, Settings } from 'lucide-react';
import TimeSlotSidebar from './TimeSlotSidebar';

const TimeSlotButton = ({ 
  onTimeSlotUpdate, 
  initialData = null,
  buttonStyle = {},
  buttonText = "Manage Time Slots"
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSave = (timeSlotData) => {
    if (onTimeSlotUpdate) {
      onTimeSlotUpdate(timeSlotData);
    }
    handleCloseSidebar();
  };

  return (
    <>
      <button
        onClick={handleOpenSidebar}
        className={`
          inline-flex items-center gap-2 px-4 py-2.5 
          bg-emerald-600 hover:bg-emerald-700 
          text-white font-medium text-sm
          rounded-lg shadow-sm 
          transition-all duration-200 
          hover:shadow-md hover:-translate-y-0.5
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
          ${buttonStyle.className || ''}
        `}
        style={buttonStyle.style || {}}
      >
        <Clock size={16} className="flex-shrink-0" />
        <Settings size={16} className="flex-shrink-0" />
        {buttonText}
      </button>

      <TimeSlotSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onSave={handleSave}
        initialData={initialData}
      />
    </>
  );
};

export default TimeSlotButton;
