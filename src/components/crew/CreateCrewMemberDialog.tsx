
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { createCrewMember } from '@/services/crewMemberService';
import { toast } from 'sonner';

interface CreateCrewMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreateCrewMemberForm {
  full_name: string;
  cert_level: string;
  cert_expiry?: string;
  safety_score: number;
  status: string;
  employee_id?: string;
  phone?: string;
  email?: string;
}

export default function CreateCrewMemberDialog({ open, onOpenChange, onSuccess }: CreateCrewMemberDialogProps) {
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<CreateCrewMemberForm>({
    defaultValues: {
      safety_score: 100,
      status: 'Active'
    }
  });

  const onSubmit = async (data: CreateCrewMemberForm) => {
    try {
      await createCrewMember(data);
      toast.success('Crew member created successfully');
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating crew member:', error);
      toast.error('Failed to create crew member');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Crew Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              {...register('full_name', { required: 'Full name is required' })}
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cert_level">Certification Level</Label>
            <Select onValueChange={(value) => setValue('cert_level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select certification level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMT-Basic">EMT-Basic</SelectItem>
                <SelectItem value="EMT-Intermediate">EMT-Intermediate</SelectItem>
                <SelectItem value="EMT-Paramedic">EMT-Paramedic</SelectItem>
                <SelectItem value="RN">Registered Nurse</SelectItem>
                <SelectItem value="Driver">Driver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="employee_id">Employee ID</Label>
            <Input
              id="employee_id"
              {...register('employee_id')}
              placeholder="EMP-001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cert_expiry">Certification Expiry</Label>
              <Input
                id="cert_expiry"
                type="date"
                {...register('cert_expiry')}
              />
            </div>
            <div>
              <Label htmlFor="safety_score">Safety Score</Label>
              <Input
                id="safety_score"
                type="number"
                min="0"
                max="100"
                {...register('safety_score', { 
                  required: 'Safety score is required',
                  min: { value: 0, message: 'Must be at least 0' },
                  max: { value: 100, message: 'Must be at most 100' }
                })}
                placeholder="100"
              />
              {errors.safety_score && (
                <p className="text-sm text-red-600">{errors.safety_score.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => setValue('status', value)} defaultValue="Active">
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Add Crew Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
