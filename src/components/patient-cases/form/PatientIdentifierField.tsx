
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PatientIdentifierFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PatientIdentifierField({ value, onChange }: PatientIdentifierFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="patient_hash">Patient Identifier</Label>
      <Input
        id="patient_hash"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter patient identifier"
        required
      />
    </div>
  );
}
