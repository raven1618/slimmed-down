
import React from 'react';
import { 
  Phone, 
  Mail, 
  Calendar, 
  ClipboardList, 
  MessageSquare,
  Briefcase,
} from 'lucide-react';
import { Activity } from '@/data/sampleData';

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'task':
        return <ClipboardList className="h-4 w-4" />;
      case 'note':
        return <MessageSquare className="h-4 w-4" />;
      case 'deal':
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getActivityClass = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-600';
      case 'email':
        return 'bg-purple-100 text-purple-600';
      case 'meeting':
        return 'bg-green-100 text-green-600';
      case 'task':
        return 'bg-yellow-100 text-yellow-600';
      case 'note':
        return 'bg-gray-100 text-gray-600';
      case 'deal':
        return 'bg-orange-100 text-orange-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="font-semibold text-lg">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              <div className={`rounded-full p-2 ${getActivityClass(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-medium text-sm">{activity.user}</p>
                  <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                </div>
                <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                {activity.relatedTo && (
                  <p className="text-xs text-gray-500 mt-1">Related to: {activity.relatedTo}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <button className="w-full text-center text-sm text-crm-blue font-medium">
          View All Activity
        </button>
      </div>
    </div>
  );
}
