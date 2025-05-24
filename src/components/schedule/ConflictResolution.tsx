
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, Users, Truck, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function ConflictResolution() {
  const [searchTerm, setSearchTerm] = useState('');
  const [conflictTypeFilter, setConflictTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data for demonstration
  const conflicts = [
    {
      id: '1',
      conflictType: 'crew_overlap',
      conflictDate: new Date(),
      resourceName: 'John Doe',
      item1: {
        type: 'shift',
        description: 'Regular Shift (08:00-16:00)',
        time: '08:00-16:00'
      },
      item2: {
        type: 'transport',
        description: 'Emergency Transport to General Hospital',
        time: '15:30-17:00'
      },
      status: 'unresolved',
      priority: 'high'
    },
    {
      id: '2',
      conflictType: 'vehicle_overlap',
      conflictDate: new Date(),
      resourceName: 'AMB-002',
      item1: {
        type: 'transport',
        description: 'Routine Transport - Downtown Clinic',
        time: '14:00-15:00'
      },
      item2: {
        type: 'transport',
        description: 'Emergency Transport - St. Mary\'s',
        time: '14:30-15:30'
      },
      status: 'unresolved',
      priority: 'critical'
    },
    {
      id: '3',
      conflictType: 'time_conflict',
      conflictDate: new Date(),
      resourceName: 'Jane Smith',
      item1: {
        type: 'shift',
        description: 'Night Shift (16:00-00:00)',
        time: '16:00-00:00'
      },
      item2: {
        type: 'shift',
        description: 'Overtime Shift (22:00-06:00)',
        time: '22:00-06:00'
      },
      status: 'resolved',
      priority: 'medium',
      resolutionNotes: 'Overtime shift reassigned to Mike Johnson'
    }
  ];

  const getConflictTypeColor = (type: string) => {
    switch (type) {
      case 'crew_overlap':
        return 'bg-orange-100 text-orange-800';
      case 'vehicle_overlap':
        return 'bg-red-100 text-red-800';
      case 'time_conflict':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unresolved':
        return 'bg-red-100 text-red-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredConflicts = conflicts.filter(conflict => {
    const matchesSearch = 
      conflict.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conflict.item1.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conflict.item2.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = conflictTypeFilter === 'all' || conflict.conflictType === conflictTypeFilter;
    const matchesStatus = statusFilter === 'all' || conflict.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Schedule Conflicts
          </CardTitle>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conflicts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={conflictTypeFilter} onValueChange={setConflictTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="crew_overlap">Crew Overlap</SelectItem>
                <SelectItem value="vehicle_overlap">Vehicle Overlap</SelectItem>
                <SelectItem value="time_conflict">Time Conflict</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredConflicts.map((conflict) => (
              <div key={conflict.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">
                          Conflict on {format(conflict.conflictDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {conflict.conflictType.includes('crew') ? (
                          <Users className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Truck className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-600">{conflict.resourceName}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Item 1:</span>
                        <span>{conflict.item1.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {conflict.item1.time}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Item 2:</span>
                        <span>{conflict.item2.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {conflict.item2.time}
                        </Badge>
                      </div>
                    </div>
                    
                    {conflict.resolutionNotes && (
                      <div className="text-sm text-green-600 pl-6">
                        <strong>Resolution:</strong> {conflict.resolutionNotes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex gap-2">
                      <Badge className={getConflictTypeColor(conflict.conflictType)}>
                        {conflict.conflictType.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(conflict.priority)}>
                        {conflict.priority}
                      </Badge>
                      <Badge className={getStatusColor(conflict.status)}>
                        {conflict.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {conflict.status === 'unresolved' && (
                        <>
                          <Button variant="outline" size="sm">
                            Resolve
                          </Button>
                          <Button variant="destructive" size="sm">
                            Cancel Item
                          </Button>
                        </>
                      )}
                      {conflict.status === 'resolved' && (
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      )}
                    </div>
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
