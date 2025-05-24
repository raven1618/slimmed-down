
import React from 'react';
import BillingDashboard from '@/components/billing/BillingDashboard';

const Billing = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Billing & Financial Management</h1>
      </div>
      
      <BillingDashboard />
    </div>
  );
};

export default Billing;
