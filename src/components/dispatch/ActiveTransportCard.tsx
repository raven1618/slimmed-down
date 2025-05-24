
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, Phone } from 'lucide-react';
import { Transport } from '@/types/medicalTransport';

interface ActiveTransportCardProps {
  transport: Transport;
}

export default function ActiveTransportCard({ transport }: ActiveTransportCardProps) {
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Unknown';
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getElapsedTime = (startTime?: string) => {
    if (!startTime) return 'Unknown';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m ago`;
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">
              Transport #{transport.id?.slice(-6)}
            </h3>
            <p className="text-sm text-gray-600">
              Patient Case #{transport.patientcase_id?.slice(-6)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              IN PROGRESS
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Transport Route Active</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              Started: {formatTime(transport.start_time)} ({getElapsedTime(transport.start_time)})
            </span>
          </div>

          {transport.crew && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                Crew: {typeof transport.crew === 'object' ? 'Assigned' : 'Unassigned'}
              </span>
            </div>
          )}

          {transport.ambulance_id && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                Vehicle: {transport.ambulance_id}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <MapPin className="h-3 w-3 mr-1" />
            Track
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Phone className="h-3 w-3 mr-1" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
