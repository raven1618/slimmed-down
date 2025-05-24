
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateVehicleDialog({ open, onOpenChange }: CreateVehicleDialogProps) {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'ambulance',
    make: '',
    model: '',
    year: '',
    vin: '',
    license_plate: '',
    status: 'available',
    mileage: '',
    location: '',
    fuel_level: '100'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vehicleData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        fuel_level: formData.fuel_level ? parseFloat(formData.fuel_level) : null
      };

      const { error } = await supabase
        .from('vehicles')
        .insert([vehicleData]);

      if (error) throw error;

      toast.success('Vehicle created successfully');
      onOpenChange(false);
      setFormData({
        vehicle_number: '',
        vehicle_type: 'ambulance',
        make: '',
        model: '',
        year: '',
        vin: '',
        license_plate: '',
        status: 'available',
        mileage: '',
        location: '',
        fuel_level: '100'
      });
      window.location.reload(); // Refresh to show new vehicle
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast.error('Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vehicle_number">Vehicle Number *</Label>
            <Input
              id="vehicle_number"
              value={formData.vehicle_number}
              onChange={(e) => handleInputChange('vehicle_number', e.target.value)}
              placeholder="e.g., AMB-001"
              required
            />
          </div>

          <div>
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select value={formData.vehicle_type} onValueChange={(value) => handleInputChange('vehicle_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambulance">Ambulance</SelectItem>
                <SelectItem value="supervisor">Supervisor Vehicle</SelectItem>
                <SelectItem value="support">Support Vehicle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleInputChange('make', e.target.value)}
                placeholder="Ford"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Transit"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2023"
              />
            </div>
            <div>
              <Label htmlFor="mileage">Mileage</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => handleInputChange('mileage', e.target.value)}
                placeholder="50000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="license_plate">License Plate</Label>
            <Input
              id="license_plate"
              value={formData.license_plate}
              onChange={(e) => handleInputChange('license_plate', e.target.value)}
              placeholder="ABC-123"
            />
          </div>

          <div>
            <Label htmlFor="vin">VIN</Label>
            <Input
              id="vin"
              value={formData.vin}
              onChange={(e) => handleInputChange('vin', e.target.value)}
              placeholder="1HGBH41JXMN109186"
            />
          </div>

          <div>
            <Label htmlFor="location">Current Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Main Station"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Vehicle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
