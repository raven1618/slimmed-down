
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransportMetadataProps {
  transportType: string;
  priority: string;
  estimatedDuration: string;
  specialRequirements: string;
  notes: string;
  onTransportTypeChange: (type: string) => void;
  onPriorityChange: (priority: string) => void;
  onDurationChange: (duration: string) => void;
  onRequirementsChange: (requirements: string) => void;
  onNotesChange: (notes: string) => void;
}

export default function TransportMetadata({
  transportType,
  priority,
  estimatedDuration,
  specialRequirements,
  notes,
  onTransportTypeChange,
  onPriorityChange,
  onDurationChange,
  onRequirementsChange,
  onNotesChange
}: TransportMetadataProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transportType">Transport Type</Label>
          <Select value={transportType} onValueChange={onTransportTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="discharge">Discharge</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={onPriorityChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
        <Input
          id="estimatedDuration"
          type="number"
          value={estimatedDuration}
          onChange={(e) => onDurationChange(e.target.value)}
          placeholder="60"
          min="1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequirements">Special Requirements</Label>
        <Input
          id="specialRequirements"
          value={specialRequirements}
          onChange={(e) => onRequirementsChange(e.target.value)}
          placeholder="e.g., Wheelchair accessible, oxygen support"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add any additional notes..."
          rows={3}
        />
      </div>
    </>
  );
}
