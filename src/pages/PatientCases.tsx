
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreatePatientCaseDialog from '@/components/patient-cases/CreatePatientCaseDialog';
import PatientCaseDetailDialog from '@/components/patient-cases/PatientCaseDetailDialog';
import PatientCaseCard from '@/components/patient-cases/PatientCaseCard';
import PatientCaseFilters from '@/components/patient-cases/PatientCaseFilters';
import PatientCaseEmptyState from '@/components/patient-cases/PatientCaseEmptyState';
import { usePatientCases } from '@/hooks/usePatientCases';

interface PatientCaseWithFacilities {
  id: string;
  patient_hash?: string;
  origin_facility: string;
  destination_facility?: string;
  priority: string;
  status: string;
  created_by: string;
  created_at: string;
  origin_facility_name?: string;
  destination_facility_name?: string;
}

export default function PatientCases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<PatientCaseWithFacilities | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { patientCases, facilities, loading, refreshData } = usePatientCases();

  const handleViewCase = (patientCase: PatientCaseWithFacilities) => {
    setSelectedCase(patientCase);
    setIsDetailDialogOpen(true);
  };

  const handleCaseUpdate = () => {
    refreshData();
    setIsDetailDialogOpen(false);
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refreshData();
  };

  const filteredCases = patientCases.filter(case_ =>
    case_.patient_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.origin_facility_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.destination_facility_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

      <PatientCaseFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalCases={patientCases.length}
        emergencyCases={emergencyCases.length}
        activeCases={activeCases.length}
      />

      {filteredCases.length === 0 ? (
        <PatientCaseEmptyState
          searchTerm={searchTerm}
          onCreateCase={() => setIsCreateDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((case_) => (
            <PatientCaseCard
              key={case_.id}
              case={case_}
              onClick={handleViewCase}
            />
          ))}
        </div>
      )}

      <CreatePatientCaseDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <PatientCaseDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        case={selectedCase}
        onUpdate={handleCaseUpdate}
        facilities={facilities}
      />
    </div>
  );
}
