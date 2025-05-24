
import React from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function BillingStats() {
  const stats = [
    {
      title: 'Total Outstanding',
      value: '$45,230',
      change: '+12%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      title: 'Pending Invoices',
      value: '23',
      change: '+5',
      changeType: 'neutral',
      icon: Clock,
    },
    {
      title: 'Paid This Month',
      value: '$78,540',
      change: '+18%',
      changeType: 'positive',
      icon: CheckCircle,
    },
    {
      title: 'Overdue',
      value: '$8,320',
      change: '-15%',
      changeType: 'negative',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className={`text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {stat.change} from last month
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              stat.changeType === 'positive' ? 'bg-green-100' : 
              stat.changeType === 'negative' ? 'bg-red-100' : 
              'bg-blue-100'
            }`}>
              <stat.icon className={`h-6 w-6 ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 
                'text-blue-600'
              }`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
