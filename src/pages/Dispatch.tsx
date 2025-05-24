
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveTransports } from '@/services/transportService';
import { Plus, Ambulance, MapPin, Clock, Phone } from 'lucide-react';
import CreateTransportDialog from '@/components/dispatch/CreateTransportDialog';
import ActiveTransportCard from '@/components/dispatch/ActiveTransportCard';

export default function Dispatch() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: activeTransports, isLoading, refetch } = useQuery({
    queryKey: ['activeTransports'],
    queryFn: fetchActiveTransports,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dispatch Center</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Transport
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Transports</span>
                <span className="font-semibold">{activeTransports?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Available Crews</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Emergency Calls</span>
                <span className="font-semibold text-red-600">2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>911 Emergency</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>Dispatch: (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>Supervisor: (555) 987-6543</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">GPS Tracking</span>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Radio System</span>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Database</span>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ambulance className="mr-2 h-5 w-5" />
            Active Transports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Loading transports...</p>
          ) : activeTransports && activeTransports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTransports.map((transport) => (
                <ActiveTransportCard key={transport.id} transport={transport} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ambulance className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No active transports</p>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create First Transport
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTransportDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setIsCreateDialogOpen(false);
        }}
      />
    </div>
  );
}
