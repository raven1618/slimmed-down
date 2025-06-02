
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Facility } from '@/types/medicalTransport';

interface FacilityFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  facilities: Facility[];
  loading: boolean;
  placeholder?: string;
  showNoneOption?: boolean;
}

export default function FacilityField({ 
  label, 
  value, 
  onChange, 
  facilities, 
  loading, 
  placeholder,
  showNoneOption = false 
}: FacilityFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {showNoneOption && <SelectItem value="none">None</SelectItem>}
          {facilities.map((facility) => (
            <SelectItem key={facility.id} value={facility.id}>
              {facility.name} ({facility.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
