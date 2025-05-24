
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PatientCase } from '@/types/medicalTransport';

interface PatientCaseSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  patientCases: PatientCase[];
  loading: boolean;
}

export default function PatientCaseSelect({
  value,
  onValueChange,
  patientCases,
  loading
}: PatientCaseSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="patientcase_id">Patient Case</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading cases..." : "Select patient case"} />
        </SelectTrigger>
        <SelectContent>
          {patientCases.map((case_) => (
            <SelectItem key={case_.id} value={case_.id}>
              {case_.patient_hash} - {case_.priority} ({case_.status})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
