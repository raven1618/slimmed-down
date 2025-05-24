
import React from 'react';
import FleetDashboard from '@/components/fleet/FleetDashboard';
import UnifiedResourceDashboard from '@/components/shared/UnifiedResourceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowRight } from 'lucide-react';

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
          <Truck className="h-4 w-4" />
          View Dispatch
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Unified Resource Overview */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fleet & Dispatch Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedResourceDashboard />
          </CardContent>
        </Card>
      </div>
      
      <FleetDashboard />
    </div>
  );
};

export default Fleet;
