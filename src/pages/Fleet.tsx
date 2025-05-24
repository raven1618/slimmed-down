
import React from 'react';
import FleetDashboard from '@/components/fleet/FleetDashboard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Eye, ArrowRight } from 'lucide-react';

const Fleet = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Fleet Management</h1>
        <Button 
          onClick={() => navigate('/dispatch')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View Operations
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      <FleetDashboard />
    </div>
  );
};

export default Fleet;
