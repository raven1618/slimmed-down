
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CasePriority } from '@/types/medicalTransport';

interface PriorityFieldProps {
  value: CasePriority;
  onChange: (value: CasePriority) => void;
}

export default function PriorityField({ value, onChange }: PriorityFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="priority">Priority</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Emergency">Emergency</SelectItem>
          <SelectItem value="Routine">Routine</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
