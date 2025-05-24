
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Clock } from 'lucide-react';

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patientCase: string;
  insuranceProvider: string;
  amount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'partial';
  submittedDate: string;
  responseDate?: string;
}

export default function InsuranceProcessor() {
  const claims: InsuranceClaim[] = [
    {
      id: '1',
      claimNumber: 'CLM-2024-001',
      patientCase: 'PC-2024-001',
      insuranceProvider: 'Blue Cross Blue Shield',
      amount: 2500,
      status: 'under_review',
      submittedDate: '2024-01-15',
    },
    {
      id: '2',
      claimNumber: 'CLM-2024-002',
      patientCase: 'PC-2024-002',
      insuranceProvider: 'Medicare',
      amount: 1800,
      status: 'approved',
      submittedDate: '2024-01-10',
      responseDate: '2024-01-18',
    },
    {
      id: '3',
      claimNumber: 'CLM-2024-003',
      patientCase: 'PC-2024-003',
      insuranceProvider: 'Aetna',
      amount: 3200,
      status: 'partial',
      submittedDate: '2024-01-08',
      responseDate: '2024-01-16',
    },
  ];

  const getStatusColor = (status: InsuranceClaim['status']) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Insurance Claims</h3>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Submit New Claim
          </Button>
        </div>
        
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">{claim.claimNumber}</h4>
                  <p className="text-sm text-gray-600">
                    {claim.patientCase} • {claim.insuranceProvider}
                  </p>
                  <p className="text-xs text-gray-500">
                    Submitted: {new Date(claim.submittedDate).toLocaleDateString()}
                    {claim.responseDate && ` • Response: ${new Date(claim.responseDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">${claim.amount.toLocaleString()}</p>
                </div>
                
                <Badge className={getStatusColor(claim.status)}>
                  {claim.status.replace('_', ' ').charAt(0).toUpperCase() + claim.status.replace('_', ' ').slice(1)}
                </Badge>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4" />
                  </Button>
                  {claim.status === 'denied' && (
                    <Button size="sm" variant="outline">
                      Appeal
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
