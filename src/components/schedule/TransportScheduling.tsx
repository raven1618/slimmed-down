
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Clock, MapPin, Search, Filter, Users, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TransportScheduling() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Mock data for demonstration
  const scheduledTransports = [
    {
      id: '1',
      scheduledDate: new Date(),
      scheduledTime: '10:30',
      pickupLocation: 'St. Mary\'s Hospital',
      destinationLocation: 'General Hospital',
      assignedCrew: 'John Doe',
      assignedVehicle: 'AMB-001',
      transportType: 'routine',
      priority: 'routine',
      status: 'scheduled',
      estimatedDuration: 45,
      specialRequirements: 'Wheelchair accessible',
      notes: 'Patient requires oxygen support'
    },
    {
      id: '2',
      scheduledDate: new Date(),
      scheduledTime: '14:15',
      pickupLocation: 'Downtown Clinic',
      destinationLocation: 'St. Mary\'s Hospital',
      assignedCrew: 'Jane Smith',
      assignedVehicle: 'AMB-002',
      transportType: 'emergency',
      priority: 'high',
      status: 'in_progress',
      estimatedDuration: 30,
      specialRequirements: 'Critical care equipment',
      notes: 'Emergency cardiac transport'
    },
    {
      id: '3',
      scheduledDate: new Date(),
      scheduledTime: '16:00',
      pickupLocation: 'Rehabilitation Center',
      destinationLocation: 'Home Care',
      assignedCrew: 'Mike Johnson',
      assignedVehicle: 'AMB-003',
      transportType: 'routine',
      priority: 'low',
      status: 'completed',
      estimatedDuration: 60,
      specialRequirements: 'Stretcher required',
      notes: 'Regular discharge transport'
    },
    {
      id: '4',
      scheduledDate: new Date(),
      scheduledTime: '18:30',
      pickupLocation: 'Emergency Room',
      destinationLocation: 'Trauma Center',
      assignedCrew: 'Sarah Wilson',
      assignedVehicle: 'AMB-004',
      transportType: 'emergency',
      priority: 'critical',
      status: 'delayed',
      estimatedDuration: 25,
      specialRequirements: 'Life support equipment',
      notes: 'Multi-trauma patient - urgent'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'routine':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransports = scheduledTransports.filter(transport => {
    const matchesSearch = 
      transport.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transport.destinationLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transport.assignedCrew.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transport.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || transport.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Transport Scheduling
          </CardTitle>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransports.map((transport) => (
              <div key={transport.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {format(transport.scheduledDate, 'MMM d, yyyy')} at {transport.scheduledTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Est. {transport.estimatedDuration} min
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {transport.pickupLocation} → {transport.destinationLocation}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{transport.assignedCrew}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        <span>{transport.assignedVehicle}</span>
                      </div>
                    </div>
                    
                    {transport.specialRequirements && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-orange-600">{transport.specialRequirements}</span>
                      </div>
                    )}
                    
                    {transport.notes && (
                      <div className="text-sm text-gray-600">
                        <strong>Notes:</strong> {transport.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(transport.priority)}>
                        {transport.priority}
                      </Badge>
                      <Badge className={getStatusColor(transport.status)}>
                        {transport.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
