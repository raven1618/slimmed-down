
import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="mt-4 text-lg font-medium text-gray-700">Loading...</h2>
      </div>
    </div>
  );
}
