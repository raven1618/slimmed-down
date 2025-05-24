
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FacilityType } from '@/types/medicalTransport';

interface CreateFacilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  type: FacilityType;
  address: string;
  phone: string;
  sla_target_mins: number;
}

export default function CreateFacilityDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateFacilityDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'Hospital',
    address: '',
    phone: '',
    sla_target_mins: 30
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a facility name');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('facility')
        .insert({
          name: formData.name.trim(),
          type: formData.type,
          address: formData.address.trim() || null,
          phone: formData.phone.trim() || null,
          sla_target_mins: formData.sla_target_mins
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating facility:', error);
        toast.error(`Failed to create facility: ${error.message}`);
        return;
      }

      toast.success('Facility created successfully');
      
      // Reset form
      setFormData({
        name: '',
        type: 'Hospital',
        address: '',
        phone: '',
        sla_target_mins: 30
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating facility:', error);
      toast.error('Failed to create facility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Facility</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Facility Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter facility name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Facility Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: FacilityType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select facility type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hospital">Hospital</SelectItem>
                <SelectItem value="FSER">FSER</SelectItem>
                <SelectItem value="Behavioral">Behavioral</SelectItem>
                <SelectItem value="NursingHome">Nursing Home</SelectItem>
                <SelectItem value="Event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter facility address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sla_target_mins">SLA Target (Minutes)</Label>
            <Input
              id="sla_target_mins"
              type="number"
              value={formData.sla_target_mins}
              onChange={(e) => setFormData(prev => ({ ...prev, sla_target_mins: parseInt(e.target.value) || 30 }))}
              placeholder="30"
              min="1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Facility'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
