
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Clock, MapPin, User } from 'lucide-react';
import CreatePatientCaseDialog from '@/components/patient-cases/CreatePatientCaseDialog';

// Mock data for demonstration
const mockPatientCases = [
  {
    id: '1',
    patient_hash: 'PAT-001-XYZ',
    priority: 'Emergency' as const,
    status: 'En Route' as const,
    created_at: '2024-01-20T10:30:00Z',
    origin_facility: 'General Hospital',
    destination_facility: 'Specialist Center'
  },
  {
    id: '2',
    patient_hash: 'PAT-002-ABC',
    priority: 'Routine' as const,
    status: 'Pending' as const,
    created_at: '2024-01-20T11:15:00Z',
    origin_facility: 'Care Home',
    destination_facility: 'Regional Hospital'
  },
  {
    id: '3',
    patient_hash: 'PAT-003-DEF',
    priority: 'Emergency' as const,
    status: 'At Destination' as const,
    created_at: '2024-01-20T09:45:00Z',
    origin_facility: 'Emergency Clinic',
    destination_facility: 'Trauma Center'
  }
];

export default function PatientCases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const filteredCases = mockPatientCases.filter(case_ =>
    case_.patient_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.origin_facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.destination_facility?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            All Cases ({mockPatientCases.length})
          </Button>
          <Button variant="outline" size="sm">
            Emergency (2)
          </Button>
          <Button variant="outline" size="sm">
            Active (1)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((case_) => (
          <Card key={case_.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {case_.patient_hash}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Case #{case_.id}
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
              
              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
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
        onSuccess={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}
