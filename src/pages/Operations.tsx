
import React from 'react';
import UnifiedResourceDashboard from '@/components/shared/UnifiedResourceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Truck, Radio, BarChart3 } from 'lucide-react';

const Operations = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Operations Overview</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/dispatch')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Radio className="h-4 w-4" />
            Dispatch Center
          </Button>
          <Button 
            onClick={() => navigate('/fleet')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Truck className="h-4 w-4" />
            Fleet Management
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Real-time Operations Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedResourceDashboard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Operations;
