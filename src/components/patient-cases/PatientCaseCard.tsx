
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, MapPin } from 'lucide-react';
import { PatientCase, CasePriority, CaseStatus } from '@/types/medicalTransport';

interface PatientCaseWithFacilities extends PatientCase {
  origin_facility_name?: string;
  destination_facility_name?: string;
}

interface PatientCaseCardProps {
  case: PatientCaseWithFacilities;
  onClick: (case: PatientCaseWithFacilities) => void;
}

export default function PatientCaseCard({ case: case_, onClick }: PatientCaseCardProps) {
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

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={() => onClick(case_)}
    >
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
            <div className="font-medium">{case_.origin_facility_name}</div>
            {case_.destination_facility_name && case_.destination_facility_name !== 'Unknown Facility' && (
              <>
                <div className="text-gray-500">↓</div>
                <div className="font-medium">{case_.destination_facility_name}</div>
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
  );
}
