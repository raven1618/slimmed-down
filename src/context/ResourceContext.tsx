
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, Transport } from '@/types/medicalTransport';
import { mockVehicles, mockActiveTransports } from '@/data/mockData';

interface ResourceContextType {
  vehicles: Vehicle[];
  activeTransports: Transport[];
  refreshTransports: () => void;
  loading: boolean;
}

const ResourceContext = createContext<ResourceContextType>({
  vehicles: [],
  activeTransports: [],
  refreshTransports: () => {},
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

  // Fetch vehicles with fallback to mock data
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('vehicle_number');
        
        if (error) throw error;
        return data as Vehicle[];
      } catch (error) {
        console.error('Error fetching vehicles, using mock data:', error);
        return mockVehicles;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch active transports with fallback to mock data
  const { data: transportsData, isLoading: transportsLoading, refetch: refetchTransports } = useQuery({
    queryKey: ['activeTransports'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('transport')
          .select('*')
          .is('end_time', null)
          .order('start_time', { ascending: false });
        
        if (error) throw error;
        return data as Transport[];
      } catch (error) {
        console.error('Error fetching active transports, using mock data:', error);
        return mockActiveTransports;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (vehiclesData) {
      setVehicles(vehiclesData);
    }
  }, [vehiclesData]);

  useEffect(() => {
    if (transportsData) {
      setActiveTransports(transportsData);
    }
  }, [transportsData]);

  const refreshTransports = () => {
    refetchTransports();
  };

  // Don't show loading for too long - use mock data for demo
  const loading = false;

  return (
    <ResourceContext.Provider value={{
      vehicles,
      activeTransports,
      refreshTransports,
      loading,
    }}>
      {children}
    </ResourceContext.Provider>
  );
};
