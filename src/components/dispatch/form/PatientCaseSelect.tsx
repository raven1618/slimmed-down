
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
      <Label htmlFor="patientcase">Patient Case</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading cases..." : "Select a patient case"} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : patientCases.length === 0 ? (
            <SelectItem value="empty" disabled>No patient cases available</SelectItem>
          ) : (
            patientCases.map((patientCase) => (
              <SelectItem key={patientCase.id} value={patientCase.id}>
                {patientCase.patient_hash || 'Unknown Patient'} - {patientCase.priority} ({patientCase.status})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
