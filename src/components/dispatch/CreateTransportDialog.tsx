
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateTransportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateTransportDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateTransportDialogProps) {
  const [formData, setFormData] = useState({
    patientcase_id: '',
    ambulance_id: '',
    priority: 'Routine' as const,
    billing_level: 'BLS' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientcase_id) {
      toast.error('Patient Case ID is required');
      return;
    }

    // For now, just show success - we'll implement actual creation later
    toast.success('Transport created successfully');
    onSuccess();
    
    // Reset form
    setFormData({
      patientcase_id: '',
      ambulance_id: '',
      priority: 'Routine',
      billing_level: 'BLS'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Transport</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientcase_id">Patient Case ID</Label>
            <Input
              id="patientcase_id"
              value={formData.patientcase_id}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                patientcase_id: e.target.value 
              }))}
              placeholder="Enter patient case ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ambulance_id">Ambulance ID</Label>
            <Input
              id="ambulance_id"
              value={formData.ambulance_id}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                ambulance_id: e.target.value 
              }))}
              placeholder="Enter ambulance ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority}
              onValueChange={(value: 'Emergency' | 'Routine') => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_level">Billing Level</Label>
            <Select 
              value={formData.billing_level}
              onValueChange={(value: 'BLS' | 'ALS' | 'MICU') => 
                setFormData(prev => ({ ...prev, billing_level: value }))
              }
            >
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

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Transport
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
