
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, Transport } from '@/types/medicalTransport';
import { mockVehicles, mockActiveTransports } from '@/data/mockData';

interface ResourceContextType {
  vehicles: Vehicle[];
  activeTransports: Transport[];
  refreshTransports: () => void;
  updateVehicleStatus: (vehicleId: string, status: string) => void;
  loading: boolean;
}

const ResourceContext = createContext<ResourceContextType>({
  vehicles: [],
  activeTransports: [],
  refreshTransports: () => {},
  updateVehicleStatus: () => {},
  loading: true,
});

export const useResource = () => {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error('useResource must be used within a ResourceProvider');
  }
  return context;
};

export const ResourceProvider = ({ children }: { children: React.ReactNode }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [activeTransports, setActiveTransports] = useState<Transport[]>(mockActiveTransports);

  // Don't show loading for too long - use mock data for demo
  const loading = false;

  const refreshTransports = () => {
    console.log('Refreshing transports...');
    setActiveTransports([...mockActiveTransports]);
  };

  const updateVehicleStatus = async (vehicleId: string, status: string) => {
    console.log('Updating vehicle status:', vehicleId, status);
    setVehicles(prev => prev.map(v => 
      v.id === vehicleId ? { ...v, status } : v
    ));
  };

  return (
    <ResourceContext.Provider value={{
      vehicles,
      activeTransports,
      refreshTransports,
      updateVehicleStatus,
      loading,
    }}>
      {children}
    </ResourceContext.Provider>
  );
};
