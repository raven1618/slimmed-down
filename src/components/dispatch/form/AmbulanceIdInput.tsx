
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AmbulanceIdInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AmbulanceIdInput({ value, onChange }: AmbulanceIdInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="ambulance_id">Ambulance ID</Label>
      <Input
        id="ambulance_id"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter ambulance ID (e.g., AMB-001)"
        required
      />
    </div>
  );
}
