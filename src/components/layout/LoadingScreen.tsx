
import React, { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [loadingText, setLoadingText] = useState('Loading...');
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  useEffect(() => {
    const messages = [
      'Loading...',
      'Initializing application...',
      'Connecting to services...',
      'Loading dashboard...'
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 2000);

    // Show troubleshoot option after 10 seconds
    const timeout = setTimeout(() => {
      setShowTroubleshoot(true);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-700 mb-2">{loadingText}</h2>
        
        {showTroubleshoot && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-3">
              Taking longer than expected? This might be because:
            </p>
            <ul className="text-xs text-yellow-700 text-left space-y-1 mb-4">
              <li>• Database connection is being established</li>
              <li>• Authentication is being verified</li>
              <li>• Network connection is slow</li>
            </ul>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
