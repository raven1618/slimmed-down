
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ambulance, Clock, MapPin, User } from 'lucide-react';
import { Transport } from '@/types/medicalTransport';
import { updateTransport } from '@/services/transport/operations';
import { toast } from 'sonner';

interface ActiveTransportCardProps {
  transport: Transport;
  onUpdate?: () => void;
}

export default function ActiveTransportCard({ transport, onUpdate }: ActiveTransportCardProps) {
  const handleCompleteTransport = async () => {
    try {
      const result = await updateTransport(transport.id, {
        end_time: new Date().toISOString()
      });
      
      if (result && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error completing transport:', error);
      toast.error('Failed to complete transport');
    }
  };

  const getElapsedTime = () => {
    if (!transport.start_time) return 'Unknown';
    
    const start = new Date(transport.start_time);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ambulance className="h-5 w-5" />
            {transport.ambulance_id || 'Unknown Unit'}
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-800">
            Active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            Case: {transport.patientcase_id?.slice(0, 8)}...
          </span>
        </div>
        
        {transport.billing_level && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Level: {transport.billing_level}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            Duration: {getElapsedTime()}
          </span>
        </div>

        {transport.crew && (
          <div className="text-sm text-gray-600">
            <div>Driver: {transport.crew.driver || 'Unknown'}</div>
            <div>Medic: {transport.crew.medic || 'Unknown'}</div>
          </div>
        )}
        
        <div className="pt-2">
          <Button 
            onClick={handleCompleteTransport}
            size="sm"
            className="w-full"
          >
            Complete Transport
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
