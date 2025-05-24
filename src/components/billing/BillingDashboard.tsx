
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import InvoiceList from './InvoiceList';
import PaymentTracker from './PaymentTracker';
import InsuranceProcessor from './InsuranceProcessor';
import BillingStats from './BillingStats';
import CreateInvoiceDialog from './CreateInvoiceDialog';
import { Plus } from 'lucide-react';

export default function BillingDashboard() {
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  return (
    <div className="space-y-6">
      <BillingStats />
      
      <Tabs defaultValue="invoices" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setShowCreateInvoice(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        <TabsContent value="invoices" className="mt-4">
          <InvoiceList />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentTracker />
        </TabsContent>

        <TabsContent value="insurance" className="mt-4">
          <InsuranceProcessor />
        </TabsContent>
      </Tabs>

      <CreateInvoiceDialog 
        open={showCreateInvoice} 
        onOpenChange={setShowCreateInvoice} 
      />
    </div>
  );
}
