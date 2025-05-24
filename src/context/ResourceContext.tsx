
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transport } from '@/types/medicalTransport';

interface Vehicle {
  id: string;
  vehicle_number: string;
  status: string;
  location?: string;
  current_transport_id?: string;
}

interface ResourceContextType {
  vehicles: Vehicle[];
  activeTransports: Transport[];
  refreshVehicles: () => void;
  refreshTransports: () => void;
  updateVehicleStatus: (vehicleId: string, status: string) => void;
  assignVehicleToTransport: (vehicleId: string, transportId: string) => void;
  releaseVehicleFromTransport: (vehicleId: string) => void;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

export function ResourceProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTransports, setActiveTransports] = useState<Transport[]>([]);

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
    }
  };

  const fetchActiveTransports = async () => {
    try {
      const { data, error } = await supabase
        .from('transport')
        .select('*')
        .is('end_time', null)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      
      const typedData = (data || []).map((transport: any): Transport => ({
        ...transport,
        crew: typeof transport.crew === 'object' && transport.crew !== null 
          ? transport.crew as Record<string, any>
          : undefined
      }));
      
      setActiveTransports(typedData);
    } catch (error) {
      console.error('Error fetching active transports:', error);
    }
  };

  const updateVehicleStatus = async (vehicleId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status })
        .eq('id', vehicleId);
      
      if (error) throw error;
      await fetchVehicles();
    } catch (error) {
      console.error('Error updating vehicle status:', error);
    }
  };

  const assignVehicleToTransport = async (vehicleId: string, transportId: string) => {
    try {
      await supabase
        .from('vehicles')
        .update({ 
          status: 'in_service',
          current_transport_id: transportId 
        })
        .eq('id', vehicleId);
      
      await fetchVehicles();
      await fetchActiveTransports();
    } catch (error) {
      console.error('Error assigning vehicle to transport:', error);
    }
  };

  const releaseVehicleFromTransport = async (vehicleId: string) => {
    try {
      await supabase
        .from('vehicles')
        .update({ 
          status: 'available',
          current_transport_id: null 
        })
        .eq('id', vehicleId);
      
      await fetchVehicles();
      await fetchActiveTransports();
    } catch (error) {
      console.error('Error releasing vehicle from transport:', error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchActiveTransports();

    // Set up real-time subscriptions
    const vehiclesSubscription = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vehicles' },
        () => fetchVehicles()
      )
      .subscribe();

    const transportsSubscription = supabase
      .channel('transports-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transport' },
        () => fetchActiveTransports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesSubscription);
      supabase.removeChannel(transportsSubscription);
    };
  }, []);

  return (
    <ResourceContext.Provider value={{
      vehicles,
      activeTransports,
      refreshVehicles: fetchVehicles,
      refreshTransports: fetchActiveTransports,
      updateVehicleStatus,
      assignVehicleToTransport,
      releaseVehicleFromTransport
    }}>
      {children}
    </ResourceContext.Provider>
  );
}

export function useResource() {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error('useResource must be used within a ResourceProvider');
  }
  return context;
}
