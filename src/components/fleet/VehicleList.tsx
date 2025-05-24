
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useResource } from '@/context/ResourceContext';
import { useNavigate } from 'react-router-dom';
import VehicleCard from './VehicleCard';

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
  current_transport_id?: string;
}

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeTransports, updateVehicleStatus } = useResource();
  const navigate = useNavigate();

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

  const getTransportForVehicle = (vehicleId: string) => {
    return activeTransports.find(t => t.ambulance_id === vehicleId);
  };

  const handleQuickDispatch = (vehicle: Vehicle) => {
    navigate('/dispatch', { state: { selectedVehicle: vehicle } });
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
          {vehicles.map((vehicle) => {
            const assignedTransport = getTransportForVehicle(vehicle.id);
            
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                assignedTransport={assignedTransport}
                onQuickDispatch={handleQuickDispatch}
                onUpdateStatus={updateVehicleStatus}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
