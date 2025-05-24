
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { createFacility } from '@/services/facilityService';
import { FacilityType } from '@/types/medicalTransport';
import { toast } from 'sonner';

interface CreateFacilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreateFacilityForm {
  name: string;
  type: FacilityType;
  address?: string;
  phone?: string;
  sla_target_mins: number;
}

export default function CreateFacilityDialog({ open, onOpenChange, onSuccess }: CreateFacilityDialogProps) {
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<CreateFacilityForm>({
    defaultValues: {
      sla_target_mins: 60
    }
  });

  const onSubmit = async (data: CreateFacilityForm) => {
    try {
      await createFacility(data);
      toast.success('Facility created successfully');
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating facility:', error);
      toast.error('Failed to create facility');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Facility</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Facility Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Facility name is required' })}
              placeholder="General Hospital"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Facility Type</Label>
            <Select onValueChange={(value) => setValue('type', value as FacilityType)}>
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

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="sla_target_mins">SLA Target (minutes)</Label>
            <Input
              id="sla_target_mins"
              type="number"
              {...register('sla_target_mins', { 
                required: 'SLA target is required',
                min: { value: 1, message: 'Must be at least 1 minute' }
              })}
              placeholder="60"
            />
            {errors.sla_target_mins && (
              <p className="text-sm text-red-600">{errors.sla_target_mins.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Facility'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
