
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Clock, MapPin } from 'lucide-react';
import { PatientCase } from '@/types/medicalTransport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CreatePatientCaseDialog from '@/components/patient-cases/CreatePatientCaseDialog';
import PatientCaseDetailDialog from '@/components/patient-cases/PatientCaseDetailDialog';

export default function PatientCases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [patientCases, setPatientCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatientCases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patientcase')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure proper types for enum fields
      const typedData = (data || []).map(item => ({
        ...item,
        priority: item.priority as CasePriority,
        status: item.status as CaseStatus
      }));
      
      setPatientCases(typedData);
    } catch (error) {
      console.error('Error fetching patient cases:', error);
      toast.error('Failed to load patient cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientCases();
  }, []);

  const handleViewCase = (patientCase: PatientCase) => {
    setSelectedCase(patientCase);
    setIsDetailDialogOpen(true);
  };

  const handleCaseUpdate = () => {
    fetchPatientCases();
    setIsDetailDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'En Route':
        return 'bg-blue-100 text-blue-800';
      case 'At Destination':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'Emergency' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const filteredCases = patientCases.filter(case_ =>
    case_.patient_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.origin_facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.destination_facility?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const emergencyCases = patientCases.filter(c => c.priority === 'Emergency');
  const activeCases = patientCases.filter(c => c.status === 'En Route' || c.status === 'At Destination');

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Patient Cases</h1>
        <div className="text-center py-8">Loading patient cases...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patient Cases</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            All Cases ({patientCases.length})
          </Button>
          <Button variant="outline" size="sm">
            Emergency ({emergencyCases.length})
          </Button>
          <Button variant="outline" size="sm">
            Active ({activeCases.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((case_) => (
          <Card key={case_.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewCase(case_)}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {case_.patient_hash}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Case #{case_.id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={getPriorityColor(case_.priority)}>
                    {case_.priority}
                  </Badge>
                  <Badge className={getStatusColor(case_.status)}>
                    {case_.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">{case_.origin_facility}</div>
                  {case_.destination_facility && (
                    <>
                      <div className="text-gray-500">↓</div>
                      <div className="font-medium">{case_.destination_facility}</div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Created {new Date(case_.created_at).toLocaleDateString()} at{' '}
                  {new Date(case_.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No cases found matching your search' : 'No patient cases yet'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create First Case
            </Button>
          </CardContent>
        </Card>
      )}

      <CreatePatientCaseDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          fetchPatientCases();
        }}
      />

      <PatientCaseDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        case={selectedCase}
        onUpdate={handleCaseUpdate}
      />
    </div>
  );
}
