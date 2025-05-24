
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { updateFacility, deleteFacility } from '@/services/facilityService';
import { Facility, FacilityType } from '@/types/medicalTransport';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface FacilityDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: Facility | null;
  onUpdate: () => void;
}

interface EditFacilityForm {
  name: string;
  type: FacilityType;
  address?: string;
  phone?: string;
  sla_target_mins: number;
}

export default function FacilityDetailDialog({ open, onOpenChange, facility, onUpdate }: FacilityDetailDialogProps) {
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<EditFacilityForm>();

  useEffect(() => {
    if (facility) {
      reset({
        name: facility.name,
        type: facility.type,
        address: facility.address || '',
        phone: facility.phone || '',
        sla_target_mins: facility.sla_target_mins
      });
    }
  }, [facility, reset]);

  const onSubmit = async (data: EditFacilityForm) => {
    if (!facility) return;
    
    try {
      await updateFacility(facility.id, data);
      toast.success('Facility updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error updating facility:', error);
      toast.error('Failed to update facility');
    }
  };

  const handleDelete = async () => {
    if (!facility) return;
    
    try {
      await deleteFacility(facility.id);
      toast.success('Facility deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting facility:', error);
      toast.error('Failed to delete facility');
    }
  };

  if (!facility) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Facility Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-500">Facility ID</p>
              <p className="text-sm">{facility.id.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-sm">{new Date(facility.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Facility Name</Label>
              <Input
                id="name"
                {...register('name', { required: 'Facility name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Facility Type</Label>
              <Select 
                value={facility.type} 
                onValueChange={(value) => setValue('type', value as FacilityType)}
              >
                <SelectTrigger>
                  <SelectValue />
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
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
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
              />
              {errors.sla_target_mins && (
                <p className="text-sm text-red-600">{errors.sla_target_mins.message}</p>
              )}
            </div>

            <div className="flex justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Delete Facility
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Facility</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{facility.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Facility'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
