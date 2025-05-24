
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useResource } from '@/context/ResourceContext';
import { Truck, Plus } from 'lucide-react';
import TransportListItem from './TransportListItem';

export default function ActiveTransportsCard() {
  const { activeTransports } = useResource();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Active Transports
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dispatch')}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTransports.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No active transports</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTransports.slice(0, 3).map((transport) => (
              <TransportListItem
                key={transport.id}
                transport={transport}
                vehicleNumber={transport.ambulance_id}
              />
            ))}
            {activeTransports.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/dispatch')}
              >
                View All ({activeTransports.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
