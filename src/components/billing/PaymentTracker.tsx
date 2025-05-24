
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Check } from 'lucide-react';

interface Payment {
  id: string;
  invoiceNumber: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  patientCase: string;
}

export default function PaymentTracker() {
  const payments: Payment[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      amount: 2500,
      method: 'Insurance',
      status: 'pending',
      date: '2024-01-20',
      patientCase: 'PC-2024-001',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      amount: 1800,
      method: 'Credit Card',
      status: 'completed',
      date: '2024-01-18',
      patientCase: 'PC-2024-002',
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-003',
      amount: 850,
      method: 'Bank Transfer',
      status: 'failed',
      date: '2024-01-15',
      patientCase: 'PC-2024-003',
    },
  ];

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment History</h3>
        
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">{payment.invoiceNumber}</h4>
                  <p className="text-sm text-gray-600">
                    {payment.patientCase} • {payment.method}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(payment.date).toLocaleDateString()}
                  </p>
                </div>
                
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
                
                {payment.status === 'failed' && (
                  <Button size="sm" variant="outline">
                    Retry
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
