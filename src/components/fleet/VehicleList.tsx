
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Eye, Edit, Fuel, Calendar } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  make?: string;
  model?: string;
  year?: number;
  status: string;
  mileage?: number;
  fuel_level?: number;
  next_inspection?: string;
  location?: string;
}

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_number');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'in_service': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFuelLevelColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level < 25) return 'text-red-600';
    if (level < 50) return 'text-orange-600';
    return 'text-green-600';
  };

  if (loading) {
    return <div className="text-center py-8">Loading vehicles...</div>;
  }

  return (
    <div className="space-y-4">
      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No vehicles found. Add your first vehicle to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{vehicle.vehicle_number}</CardTitle>
                  <Badge className={getStatusBadgeColor(vehicle.status)}>
                    {vehicle.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{vehicle.vehicle_type}</span>
                </div>
                
                {vehicle.mileage && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mileage:</span>
                    <span className="font-medium">{vehicle.mileage.toLocaleString()} mi</span>
                  </div>
                )}
                
                {vehicle.fuel_level && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Fuel className="h-3 w-3 mr-1" />
                      Fuel:
                    </div>
                    <span className={`font-medium ${getFuelLevelColor(vehicle.fuel_level)}`}>
                      {vehicle.fuel_level}%
                    </span>
                  </div>
                )}
                
                {vehicle.next_inspection && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      Next Inspection:
                    </div>
                    <span className="font-medium">
                      {format(new Date(vehicle.next_inspection), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
                
                {vehicle.location && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{vehicle.location}</span>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
