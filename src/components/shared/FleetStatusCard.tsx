
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useResource } from '@/context/ResourceContext';
import { MapPin, AlertTriangle } from 'lucide-react';
import VehicleListItem from './VehicleListItem';

export default function FleetStatusCard() {
  const { vehicles } = useResource();
  const navigate = useNavigate();

  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'in_service': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fleet Status
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/fleet')}
          >
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {availableVehicles.slice(0, 3).map((vehicle) => (
            <VehicleListItem key={vehicle.id} vehicle={vehicle} />
          ))}
          
          {maintenanceVehicles.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Needs Attention</span>
              </div>
              {maintenanceVehicles.slice(0, 2).map((vehicle) => (
                <div key={vehicle.id} className="flex justify-between items-center text-sm">
                  <span>{vehicle.vehicle_number}</span>
                  <Badge className={getStatusColor(vehicle.status) + " text-xs"}>
                    Maintenance
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          {availableVehicles.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/fleet')}
            >
              View All Vehicles ({vehicles.length})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
