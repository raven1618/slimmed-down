
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { Ambulance, MapPin, Clock, Activity } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Mock data for active transports to avoid database issues
  const mockTransports = [
    {
      id: '001',
      status: 'In Progress',
      start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    },
    {
      id: '002', 
      status: 'In Progress',
      start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Medical Transport Management System</p>
        </div>
        <Button 
          onClick={() => navigate('/dispatch')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Ambulance className="mr-2 h-4 w-4" />
          Open Dispatch
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
            {mockTransports.length > 0 ? (
              <div className="space-y-4">
                {mockTransports.map((transport) => (
                  <div key={transport.id} className="border rounded-lg p-3">
                    <div className="flex justify-between">
                      <div className="font-medium">Transport #{transport.id}</div>
                      <div className="text-sm text-blue-600 font-medium">{transport.status}</div>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      <span>Active Transport Route</span>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>
                        Started {new Date(transport.start_time).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full" onClick={() => navigate('/dispatch')}>
                  View All in Dispatch Center
                </Button>
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
                  Open Dispatch Center
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">System Status</span>
                <span className="text-green-600 font-semibold">Operational</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Dispatch Center</span>
                <span className="text-blue-600 font-semibold">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Emergency Mode</span>
                <span className="text-orange-600 font-semibold">Standby</span>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/performance')}
              >
                View Performance Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
