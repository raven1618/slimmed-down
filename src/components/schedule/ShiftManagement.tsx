
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, Calendar, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function ShiftManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState('all');

  // Mock data for demonstration
  const shifts = [
    {
      id: '1',
      crewMember: 'John Doe',
      crewMemberId: '1',
      date: new Date(),
      startTime: '08:00',
      endTime: '16:00',
      shiftType: 'regular',
      status: 'scheduled',
      notes: 'Regular day shift'
    },
    {
      id: '2',
      crewMember: 'Jane Smith',
      crewMemberId: '2',
      date: new Date(),
      startTime: '16:00',
      endTime: '00:00',
      shiftType: 'night',
      status: 'scheduled',
      notes: 'Night shift coverage'
    },
    {
      id: '3',
      crewMember: 'Mike Johnson',
      crewMemberId: '3',
      date: new Date(),
      startTime: '00:00',
      endTime: '08:00',
      shiftType: 'overnight',
      status: 'completed',
      notes: 'Overnight emergency coverage'
    },
    {
      id: '4',
      crewMember: 'Sarah Wilson',
      crewMemberId: '4',
      date: new Date(),
      startTime: '12:00',
      endTime: '20:00',
      shiftType: 'overtime',
      status: 'cancelled',
      notes: 'Extra coverage - cancelled due to low demand'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'regular':
        return 'bg-blue-100 text-blue-800';
      case 'night':
        return 'bg-purple-100 text-purple-800';
      case 'overnight':
        return 'bg-indigo-100 text-indigo-800';
      case 'overtime':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.crewMember.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shift.status === statusFilter;
    const matchesType = shiftTypeFilter === 'all' || shift.shiftType === shiftTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shift Management
          </CardTitle>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search crew members..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={shiftTypeFilter} onValueChange={setShiftTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Shift Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="night">Night</SelectItem>
                <SelectItem value="overnight">Overnight</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredShifts.map((shift) => (
              <div key={shift.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{shift.crewMember}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(shift.date, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getShiftTypeColor(shift.shiftType)}>
                      {shift.shiftType}
                    </Badge>
                    <Badge className={getStatusColor(shift.status)}>
                      {shift.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
                
                {shift.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Notes:</strong> {shift.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
