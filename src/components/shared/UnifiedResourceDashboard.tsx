
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useResource } from '@/context/ResourceContext';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Clock, User, Settings, AlertTriangle } from 'lucide-react';

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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Available Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableVehicles.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Active Transports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeTransports.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">In Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inServiceVehicles.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{maintenanceVehicles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Transports with Vehicle Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Active Transports & Fleet Status
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dispatch')}
              >
                View Dispatch
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/fleet')}
              >
                Manage Fleet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTransports.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No active transports</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTransports.map((transport) => {
                const vehicle = getVehicleByTransport(transport.id);
                return (
                  <div key={transport.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {transport.ambulance_id || 'Unknown Unit'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Case: {transport.patientcase_id?.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Vehicle:</span>
                        <div className="font-medium">
                          {vehicle ? (
                            <div className="flex items-center gap-2">
                              <span>{vehicle.vehicle_number}</span>
                              <Badge className={getStatusColor(vehicle.status)}>
                                {vehicle.status}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-orange-600">Not assigned</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-600">Level:</span>
                        <div className="font-medium">{transport.billing_level || 'BLS'}</div>
                      </div>
                      
                      <div>
                        <span className="text-gray-600">Started:</span>
                        <div className="font-medium">
                          {transport.start_time 
                            ? new Date(transport.start_time).toLocaleTimeString()
                            : 'Unknown'
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/dispatch`)}
                      >
                        View in Dispatch
                      </Button>
                      {vehicle && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/fleet`)}
                        >
                          Vehicle Details
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Vehicles */}
      {availableVehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Available Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableVehicles.map((vehicle) => (
                <div key={vehicle.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{vehicle.vehicle_number}</h4>
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                  </div>
                  {vehicle.location && (
                    <p className="text-sm text-gray-600 mb-2">
                      Location: {vehicle.location}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/dispatch')}
                    >
                      Assign Transport
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateVehicleStatus(vehicle.id, 'maintenance')}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Alerts */}
      {maintenanceVehicles.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Vehicles in Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {maintenanceVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex justify-between items-center">
                  <span className="font-medium">{vehicle.vehicle_number}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateVehicleStatus(vehicle.id, 'available')}
                  >
                    Mark Available
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
