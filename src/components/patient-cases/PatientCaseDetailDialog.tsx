
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PatientCase, CasePriority, CaseStatus, Facility } from '@/types/medicalTransport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Edit2, Save, X } from 'lucide-react';

interface PatientCaseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  case: any;
  onUpdate: () => void;
  facilities: Facility[];
}

export default function PatientCaseDetailDialog({ open, onOpenChange, case: patientCase, onUpdate, facilities }: PatientCaseDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<PatientCase>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (patientCase) {
      setEditData(patientCase);
    }
  }, [patientCase]);

  if (!patientCase) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('patientcase')
        .update({
          patient_hash: editData.patient_hash,
          origin_facility: editData.origin_facility,
          destination_facility: editData.destination_facility,
          priority: editData.priority,
          status: editData.status
        })
        .eq('id', patientCase.id);

      if (error) throw error;

      toast.success('Patient case updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating patient case:', error);
      toast.error('Failed to update patient case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'En Route':
        return 'bg-blue-100 text-blue-800';
      case 'At Destination':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'Emergency' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Patient Case Details</DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {setIsEditing(false); setEditData(patientCase);}}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Patient ID</Label>
            {isEditing ? (
              <Input
                value={editData.patient_hash || ''}
                onChange={(e) => setEditData({...editData, patient_hash: e.target.value})}
              />
            ) : (
              <p className="text-sm font-medium">{patientCase.patient_hash}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              {isEditing ? (
                <Select 
                  value={editData.priority} 
                  onValueChange={(value) => setEditData({...editData, priority: value as CasePriority})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Routine">Routine</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getPriorityColor(patientCase.priority)}>
                  {patientCase.priority}
                </Badge>
              )}
            </div>

            <div>
              <Label>Status</Label>
              {isEditing ? (
                <Select 
                  value={editData.status} 
                  onValueChange={(value) => setEditData({...editData, status: value as CaseStatus})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="En Route">En Route</SelectItem>
                    <SelectItem value="At Destination">At Destination</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getStatusColor(patientCase.status)}>
                  {patientCase.status}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <Label>Origin Facility</Label>
            {isEditing ? (
              <Select 
                value={editData.origin_facility} 
                onValueChange={(value) => setEditData({...editData, origin_facility: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">{patientCase.origin_facility_name}</p>
            )}
          </div>

          <div>
            <Label>Destination Facility</Label>
            {isEditing ? (
              <Select 
                value={editData.destination_facility || ''} 
                onValueChange={(value) => setEditData({...editData, destination_facility: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">{patientCase.destination_facility_name || 'Not specified'}</p>
            )}
          </div>

          <div>
            <Label>Created</Label>
            <p className="text-sm text-gray-600">
              {new Date(patientCase.created_at).toLocaleDateString()} at{' '}
              {new Date(patientCase.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
