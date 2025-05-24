
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CasePriority, BillingLevel, PatientCase } from '@/types/medicalTransport';
import { supabase } from '@/integrations/supabase/client';
import { createTransport } from '@/services/transport/operations';
import TransportFormFields from './form/TransportFormFields';

interface CreateTransportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  patientcase_id: string;
  ambulance_id: string;
  billing_level: BillingLevel;
}

export default function CreateTransportDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateTransportDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    patientcase_id: '',
    ambulance_id: '',
    billing_level: 'BLS'
  });
  const [patientCases, setPatientCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    const fetchPatientCases = async () => {
      if (!open) return;
      
      try {
        setLoadingCases(true);
        const { data, error } = await supabase
          .from('patientcase')
          .select('*')
          .in('status', ['Pending', 'En Route'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const typedData = (data || []).map(item => ({
          ...item,
          priority: item.priority as CasePriority,
          status: item.status as any
        }));
        
        setPatientCases(typedData);
      } catch (error) {
        console.error('Error fetching patient cases:', error);
        toast.error('Failed to load patient cases');
      } finally {
        setLoadingCases(false);
      }
    };

    fetchPatientCases();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientcase_id) {
      toast.error('Please select a patient case');
      return;
    }

    if (!formData.ambulance_id) {
      toast.error('Please enter an ambulance ID');
      return;
    }

    try {
      setLoading(true);
      
      const now = new Date().toISOString();
      const transportData = {
        patientcase_id: formData.patientcase_id,
        ambulance_id: formData.ambulance_id,
        billing_level: formData.billing_level,
        start_time: now,
        crew: {
          driver: 'John Smith',
          medic: 'Jane Doe'
        },
        created_at: now,
        updated_at: now
      };

      const result = await createTransport(transportData);
      
      if (result) {
        // Update patient case status to En Route
        await supabase
          .from('patientcase')
          .update({ status: 'En Route' })
          .eq('id', formData.patientcase_id);

        toast.success('Transport created successfully');
        
        // Reset form
        setFormData({
          patientcase_id: '',
          ambulance_id: '',
          billing_level: 'BLS'
        });
        
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating transport:', error);
      toast.error('Failed to create transport');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Transport</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <TransportFormFields
            formData={formData}
            setFormData={setFormData}
            patientCases={patientCases}
            loadingCases={loadingCases}
          />

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
              {loading ? 'Creating...' : 'Create Transport'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
