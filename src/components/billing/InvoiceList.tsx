
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Send } from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  patientCase: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export default function InvoiceList() {
  const invoices: Invoice[] = [
    {
      id: '1',
      number: 'INV-2024-001',
      patientCase: 'PC-2024-001',
      amount: 2500,
      status: 'sent',
      dueDate: '2024-02-15',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      number: 'INV-2024-002',
      patientCase: 'PC-2024-002',
      amount: 1800,
      status: 'paid',
      dueDate: '2024-02-10',
      createdAt: '2024-01-12',
    },
    {
      id: '3',
      number: 'INV-2024-003',
      patientCase: 'PC-2024-003',
      amount: 3200,
      status: 'overdue',
      dueDate: '2024-01-30',
      createdAt: '2024-01-05',
    },
  ];

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Invoices</h3>
        
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{invoice.number}</h4>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Case: {invoice.patientCase} • Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="text-right mr-4">
                <p className="text-lg font-semibold">${invoice.amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  Created {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
                {invoice.status === 'draft' && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4" />
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
