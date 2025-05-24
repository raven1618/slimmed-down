
import React from 'react';
import SampleDataManager from '@/components/admin/SampleDataManager';

export default function SampleDataDemo() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Demo Data Management</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Quickly set up your application with realistic sample data for demonstrations.
          This page helps you populate the database with comprehensive test data
          across all major features.
        </p>
      </div>
      
      <SampleDataManager />
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          After seeding data, navigate to different sections like Patient Cases, 
          Facilities, Fleet, or Dispatch to see the demo data in action.
        </p>
      </div>
    </div>
  );
}
