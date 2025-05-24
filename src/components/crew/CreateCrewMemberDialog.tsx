
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
import { CrewRole } from '@/types/medicalTransport';

interface CreateCrewMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  full_name: string;
  role: CrewRole;
  safety_score: number;
}

export default function CreateCrewMemberDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateCrewMemberDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    role: 'EMT',
    safety_score: 100
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast.error('Please enter crew member name');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('crewmember')
        .insert({
          full_name: formData.full_name.trim(),
          role: formData.role,
          safety_score: formData.safety_score
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating crew member:', error);
        toast.error(`Failed to create crew member: ${error.message}`);
        return;
      }

      toast.success('Crew member created successfully');
      
      // Reset form
      setFormData({
        full_name: '',
        role: 'EMT',
        safety_score: 100
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating crew member:', error);
      toast.error('Failed to create crew member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Crew Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter crew member name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: CrewRole) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMT">EMT</SelectItem>
                <SelectItem value="Paramedic">Paramedic</SelectItem>
                <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="safety_score">Safety Score</Label>
            <Input
              id="safety_score"
              type="number"
              value={formData.safety_score}
              onChange={(e) => setFormData(prev => ({ ...prev, safety_score: parseInt(e.target.value) || 100 }))}
              placeholder="100"
              min="0"
              max="100"
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
              {loading ? 'Creating...' : 'Create Crew Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
