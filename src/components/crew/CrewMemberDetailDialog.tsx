
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { updateCrewMember, deleteCrewMember } from '@/services/crewMemberService';
import { CrewMember } from '@/types/medicalTransport';
import { toast } from 'sonner';
import { Trash2, Edit2, User, Phone, Mail, Calendar, Shield } from 'lucide-react';

interface CrewMemberDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewMember: CrewMember | null;
  onUpdate: () => void;
}

interface UpdateCrewMemberForm {
  full_name: string;
  cert_level: string;
  cert_expiry?: string;
  safety_score: number;
  status: string;
  employee_id?: string;
  phone?: string;
  email?: string;
}

export default function CrewMemberDetailDialog({ open, onOpenChange, crewMember, onUpdate }: CrewMemberDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<UpdateCrewMemberForm>();

  useEffect(() => {
    if (crewMember) {
      reset({
        full_name: crewMember.full_name,
        cert_level: crewMember.cert_level,
        cert_expiry: crewMember.cert_expiry ? new Date(crewMember.cert_expiry).toISOString().split('T')[0] : '',
        safety_score: crewMember.safety_score,
        status: crewMember.status,
        employee_id: crewMember.employee_id || '',
        phone: crewMember.phone || '',
        email: crewMember.email || ''
      });
    }
  }, [crewMember, reset]);

  const onSubmit = async (data: UpdateCrewMemberForm) => {
    if (!crewMember) return;

    try {
      await updateCrewMember(crewMember.id, data);
      toast.success('Crew member updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating crew member:', error);
      toast.error('Failed to update crew member');
    }
  };

  const handleDelete = async () => {
    if (!crewMember) return;
    
    if (!confirm('Are you sure you want to delete this crew member? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCrewMember(crewMember.id);
      toast.success('Crew member deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting crew member:', error);
      toast.error('Failed to delete crew member');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'Training':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCertLevelColor = (level: string) => {
    switch (level) {
      case 'EMT-Paramedic':
        return 'bg-purple-100 text-purple-800';
      case 'EMT-Intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'EMT-Basic':
        return 'bg-green-100 text-green-800';
      case 'RN':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!crewMember) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {crewMember.full_name}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                {...register('full_name', { required: 'Full name is required' })}
              />
              {errors.full_name && (
                <p className="text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cert_level">Certification Level</Label>
              <Select onValueChange={(value) => setValue('cert_level', value)} defaultValue={crewMember.cert_level}>
                <SelectTrigger>
                  <SelectValue />
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
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
                />
                {errors.safety_score && (
                  <p className="text-sm text-red-600">{errors.safety_score.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setValue('status', value)} defaultValue={crewMember.status}>
                <SelectTrigger>
                  <SelectValue />
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
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Crew Member'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-3">
              <Badge className={getStatusColor(crewMember.status)}>
                {crewMember.status}
              </Badge>
              <Badge className={getCertLevelColor(crewMember.cert_level)}>
                {crewMember.cert_level}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {crewMember.employee_id && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">ID: {crewMember.employee_id}</Badge>
                  </div>
                )}
                
                {crewMember.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{crewMember.phone}</span>
                  </div>
                )}
                
                {crewMember.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{crewMember.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Safety Score: {crewMember.safety_score}/100</span>
                </div>
                
                {crewMember.cert_expiry && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Cert Expires: {new Date(crewMember.cert_expiry).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-4 border-t">
              Created {new Date(crewMember.created_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
