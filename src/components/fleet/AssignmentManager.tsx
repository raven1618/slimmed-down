
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Plus, User, Truck, Clock } from 'lucide-react';

interface Assignment {
  id: string;
  vehicle_id: string;
  crew_member_id?: string;
  assigned_date: string;
  assignment_type: string;
  start_time?: string;
  end_time?: string;
  status: string;
  notes?: string;
  vehicles: {
    vehicle_number: string;
    make?: string;
    model?: string;
  };
  crewmember?: {
    full_name?: string;
    role?: string;
  };
}

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          vehicles (
            vehicle_number,
            make,
            model
          ),
          crewmember (
            full_name,
            role
          )
        `)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'shift': return <Clock className="h-4 w-4" />;
      case 'transport': return <Truck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vehicle Assignments</h3>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No vehicle assignments found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getAssignmentTypeIcon(assignment.assignment_type)}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {assignment.vehicles.vehicle_number}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {assignment.vehicles.make} {assignment.vehicles.model}
                      </p>
                      {assignment.crewmember?.full_name && (
                        <p className="text-sm text-gray-500 mt-1">
                          Assigned to: {assignment.crewmember.full_name}
                          {assignment.crewmember.role && ` (${assignment.crewmember.role})`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <Badge className={getStatusBadgeColor(assignment.status)}>
                      {assignment.status}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {assignment.assignment_type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(assignment.assigned_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                
                {(assignment.start_time || assignment.end_time) && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {assignment.start_time && (
                      <div>
                        <span className="text-gray-600">Start:</span>
                        <span className="ml-1 font-medium">
                          {format(new Date(assignment.start_time), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                    {assignment.end_time && (
                      <div>
                        <span className="text-gray-600">End:</span>
                        <span className="ml-1 font-medium">
                          {format(new Date(assignment.end_time), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {assignment.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="text-gray-600">Notes:</span>
                    <p className="mt-1">{assignment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
