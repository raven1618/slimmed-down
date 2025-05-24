
import React from 'react';
import { Truck } from 'lucide-react';
import { Transport } from '@/types/medicalTransport';

interface VehicleTransportInfoProps {
  transport: Transport;
}

export default function VehicleTransportInfo({ transport }: VehicleTransportInfoProps) {
  return (
    <div className="bg-blue-50 p-2 rounded text-sm">
      <div className="flex items-center gap-1 mb-1">
        <Truck className="h-3 w-3 text-blue-600" />
        <span className="font-medium text-blue-800">Active Transport</span>
      </div>
      <p className="text-blue-700">
        Case: {transport.patientcase_id?.slice(0, 8)}...
      </p>
      <p className="text-blue-600 text-xs">
        Level: {transport.billing_level}
      </p>
    </div>
  );
}
