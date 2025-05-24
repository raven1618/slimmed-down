
import React from 'react';
import ScheduleDashboard from '@/components/schedule/ScheduleDashboard';

const Schedule = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Schedule Management</h1>
      </div>
      
      <ScheduleDashboard />
    </div>
  );
};

export default Schedule;
