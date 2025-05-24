
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useResource } from '@/context/ResourceContext';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Clock, AlertTriangle, Plus } from 'lucide-react';

export default function UnifiedResourceDashboard() {
  const { vehicles, activeTransports, updateVehicleStatus } = useResource();
  const navigate = useNavigate();

  const getVehicleByTransport = (transportId: string) => {
    return vehicles.find(v => v.current_transport_id === transportId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'in_service': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const inServiceVehicles = vehicles.filter(v => v.status === 'in_service');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{availableVehicles.length}</div>
            <p className="text-sm text-gray-600">Available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{activeTransports.length}</div>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{inServiceVehicles.length}</div>
            <p className="text-sm text-gray-600">In Service</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{maintenanceVehicles.length}</div>
            <p className="text-sm text-gray-600">Maintenance</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Transports */}
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
                {activeTransports.slice(0, 3).map((transport) => {
                  const vehicle = getVehicleByTransport(transport.id);
                  return (
                    <div key={transport.id} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-sm">
                            {vehicle?.vehicle_number || 'Unassigned'}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {transport.billing_level} • Case: {transport.patientcase_id?.slice(0, 8)}...
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Active</Badge>
                      </div>
                      {transport.start_time && (
                        <p className="text-xs text-gray-500">
                          Started: {new Date(transport.start_time).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  );
                })}
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

        {/* Fleet Status */}
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
                <div key={vehicle.id} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">{vehicle.vehicle_number}</span>
                    {vehicle.location && (
                      <p className="text-xs text-gray-500">{vehicle.location}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(vehicle.status) + " text-xs"}>
                    {vehicle.status}
                  </Badge>
                </div>
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
      </div>
    </div>
  );
}
