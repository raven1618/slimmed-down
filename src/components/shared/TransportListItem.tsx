
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Transport } from '@/types/medicalTransport';

interface TransportListItemProps {
  transport: Transport;
  vehicleNumber?: string;
}

export default function TransportListItem({ transport, vehicleNumber }: TransportListItemProps) {
  return (
    <div className="border rounded p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-sm">
            {vehicleNumber || 'Unassigned'}
          </h4>
          <p className="text-xs text-gray-600">
            {transport.billing_level} • Case: {transport.patientcase_id?.slice(0, 8)}...
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 text-xs">Active</Badge>
      </div>
      {transport.start_time && (
        <p className="text-xs text-gray-500">
          Started: {new Date(transport.start_time).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
