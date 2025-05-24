
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BillingLevel } from '@/types/medicalTransport';

interface BillingLevelSelectProps {
  value: BillingLevel;
  onValueChange: (value: BillingLevel) => void;
}

export default function BillingLevelSelect({ value, onValueChange }: BillingLevelSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="billing_level">Billing Level</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BLS">BLS - Basic Life Support</SelectItem>
          <SelectItem value="ALS">ALS - Advanced Life Support</SelectItem>
          <SelectItem value="MICU">MICU - Mobile Intensive Care</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
