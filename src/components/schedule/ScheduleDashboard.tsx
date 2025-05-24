
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Truck, Plus, AlertTriangle } from 'lucide-react';
import ScheduleOverview from './ScheduleOverview';
import ShiftManagement from './ShiftManagement';
import TransportScheduling from './TransportScheduling';
import ConflictResolution from './ConflictResolution';
import CreateShiftDialog from './CreateShiftDialog';
import CreateScheduledTransportDialog from './CreateScheduledTransportDialog';

export default function ScheduleDashboard() {
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [showCreateTransport, setShowCreateTransport] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Shifts</p>
              <p className="text-2xl font-bold text-gray-800">12</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Scheduled Transports</p>
              <p className="text-2xl font-bold text-gray-800">8</p>
            </div>
            <Truck className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Conflicts</p>
              <p className="text-2xl font-bold text-red-600">3</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Utilization Rate</p>
              <p className="text-2xl font-bold text-gray-800">85%</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-4 w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
            <TabsTrigger value="transports">Transports</TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            {activeTab === 'shifts' && (
              <Button onClick={() => setShowCreateShift(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Shift
              </Button>
            )}
            {activeTab === 'transports' && (
              <Button onClick={() => setShowCreateTransport(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Transport
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="overview" className="mt-4">
          <ScheduleOverview />
        </TabsContent>

        <TabsContent value="shifts" className="mt-4">
          <ShiftManagement />
        </TabsContent>

        <TabsContent value="transports" className="mt-4">
          <TransportScheduling />
        </TabsContent>

        <TabsContent value="conflicts" className="mt-4">
          <ConflictResolution />
        </TabsContent>
      </Tabs>

      <CreateShiftDialog 
        open={showCreateShift} 
        onOpenChange={setShowCreateShift} 
      />
      
      <CreateScheduledTransportDialog 
        open={showCreateTransport} 
        onOpenChange={setShowCreateTransport} 
      />
    </div>
  );
}
