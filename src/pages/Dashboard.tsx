
import React from 'react';
import { Card } from '@/components/ui/card';
import DashboardStats from '@/components/dashboard/DashboardStats';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <DashboardStats />
      
      <Card className="p-6">
        <p>Welcome to the Medical Transport Dashboard</p>
      </Card>
    </div>
  );
}
