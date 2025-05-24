
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

interface CreateVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  vehicle_number: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  status: string;
}

export default function CreateVehicleDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateVehicleDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    vehicle_number: '',
    vehicle_type: 'ambulance',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    status: 'available'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_number.trim()) {
      toast.error('Please enter a vehicle number');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          vehicle_number: formData.vehicle_number.trim(),
          vehicle_type: formData.vehicle_type,
          make: formData.make.trim() || null,
          model: formData.model.trim() || null,
          year: formData.year,
          status: formData.status,
          mileage: 0,
          fuel_level: 100
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating vehicle:', error);
        toast.error(`Failed to create vehicle: ${error.message}`);
        return;
      }

      toast.success('Vehicle created successfully');
      
      // Reset form
      setFormData({
        vehicle_number: '',
        vehicle_type: 'ambulance',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        status: 'available'
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast.error('Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle_number">Vehicle Number</Label>
            <Input
              id="vehicle_number"
              value={formData.vehicle_number}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value }))}
              placeholder="Enter vehicle number (e.g., AMB-001)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select 
              value={formData.vehicle_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambulance">Ambulance</SelectItem>
                <SelectItem value="supervisor">Supervisor Vehicle</SelectItem>
                <SelectItem value="support">Support Vehicle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                placeholder="e.g., Ford"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="e.g., Transit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
              min="1990"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in_use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
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
              {loading ? 'Creating...' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
