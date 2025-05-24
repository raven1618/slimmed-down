
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveTransports } from '@/services/transportService';
import { Ambulance, Clock, MapPin } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Fetch active transports for the dashboard with simpler error handling
  const { data: activeTransports, isLoading, error } = useQuery({
    queryKey: ['activeTransports'],
    queryFn: async () => {
      console.log('Dashboard: Starting to fetch active transports...');
      try {
        const data = await fetchActiveTransports();
        console.log('Dashboard: Received data:', data);
        
        // Ensure we return a proper array
        if (!Array.isArray(data)) {
          console.warn('Dashboard: Data is not an array, returning empty array');
          return [];
        }
        
        return data.map((transport: any) => ({
          ...transport,
          crew: typeof transport.crew === 'object' && transport.crew !== null 
            ? transport.crew as Record<string, any>
            : undefined
        }));
      } catch (err) {
        console.error('Dashboard: Error fetching active transports:', err);
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1, // Only retry once
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnWindowFocus: false
  });
  
  console.log('Dashboard render - isLoading:', isLoading, 'error:', error, 'activeTransports:', activeTransports);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button 
          onClick={() => navigate('/dispatch')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Ambulance className="mr-2 h-4 w-4" />
          Dispatch
        </Button>
      </div>
      
      <DashboardStats />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ambulance className="mr-2 h-5 w-5" />
              Active Transports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading active transports...</p>
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <p className="text-red-500 mb-4">Unable to load transports</p>
                <p className="text-sm text-gray-500 mb-4">
                  This might be because the database tables haven't been set up yet.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dispatch')}
                  className="mx-auto"
                >
                  Go to Dispatch
                </Button>
              </div>
            ) : activeTransports && activeTransports.length > 0 ? (
              <div className="space-y-4">
                {activeTransports.slice(0, 3).map((transport) => (
                  <div key={transport.id} className="border rounded-lg p-3">
                    <div className="flex justify-between">
                      <div className="font-medium">Transport #{transport.id?.slice(-6)}</div>
                      <div className="text-sm text-blue-600 font-medium">In Progress</div>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      <span>Active Transport Route</span>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>
                        Started {transport.start_time ? new Date(transport.start_time).toLocaleTimeString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
                
                {activeTransports.length > 3 && (
                  <Button variant="outline" className="w-full" onClick={() => navigate('/dispatch')}>
                    View All {activeTransports.length} Active Transports
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Ambulance className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No active transports at the moment</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dispatch')}
                  className="mx-auto"
                >
                  Create New Transport
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={() => navigate('/patient-cases')} 
                variant="outline" 
                className="justify-start"
              >
                View Patient Cases
              </Button>
              <Button 
                onClick={() => navigate('/facilities')} 
                variant="outline" 
                className="justify-start"
              >
                Manage Facilities
              </Button>
              <Button 
                onClick={() => navigate('/authorizations')} 
                variant="outline"
                className="justify-start"
              >
                Treatment Authorizations
              </Button>
              <Button 
                onClick={() => navigate('/crew')} 
                variant="outline"
                className="justify-start"
              >
                View Crew Members
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
