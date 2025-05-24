
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Plus, Wrench, Calendar, DollarSign } from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description?: string;
  cost?: number;
  service_date: string;
  next_service_date?: string;
  mechanic_name?: string;
  service_provider?: string;
  status: string;
  vehicles: {
    vehicle_number: string;
    make?: string;
    model?: string;
  };
}

export default function MaintenanceTracker() {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  const fetchMaintenanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select(`
          *,
          vehicles (
            vehicle_number,
            make,
            model
          )
        `)
        .order('service_date', { ascending: false });

      if (error) throw error;
      setMaintenanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaintenanceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'oil_change':
      case 'routine':
        return <Wrench className="h-4 w-4" />;
      case 'inspection':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading maintenance records...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Maintenance Records</h3>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      {maintenanceRecords.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No maintenance records found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {maintenanceRecords.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getMaintenanceTypeIcon(record.maintenance_type)}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {record.vehicles.vehicle_number} - {record.maintenance_type.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {record.vehicles.make} {record.vehicles.model}
                      </p>
                      {record.description && (
                        <p className="text-sm text-gray-500 mt-1">{record.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <Badge className={getStatusBadgeColor(record.status)}>
                      {record.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {format(new Date(record.service_date), 'MMM dd, yyyy')}
                    </div>
                    {record.cost && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {record.cost.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {record.service_provider && (
                    <div>
                      <span className="text-gray-600">Provider:</span>
                      <span className="ml-1 font-medium">{record.service_provider}</span>
                    </div>
                  )}
                  {record.mechanic_name && (
                    <div>
                      <span className="text-gray-600">Mechanic:</span>
                      <span className="ml-1 font-medium">{record.mechanic_name}</span>
                    </div>
                  )}
                  {record.next_service_date && (
                    <div>
                      <span className="text-gray-600">Next Service:</span>
                      <span className="ml-1 font-medium">
                        {format(new Date(record.next_service_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
