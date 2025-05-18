
import React from 'react';
import { Users, Briefcase, DollarSign, ClipboardCheck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { sampleActivities, getDashboardStats } from '@/data/sampleData';

const Dashboard = () => {
  const stats = getDashboardStats();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <div className="text-sm text-gray-500">Today, {new Date().toLocaleDateString()}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
              <StatCard 
                title="New Contacts" 
                value={stats.newContacts} 
                icon={<Users className="h-6 w-6" />}
                change={{ value: '+5 from last week', positive: true }}
                color="blue"
              />
              <StatCard 
                title="Active Deals" 
                value={stats.activeDeals}
                icon={<Briefcase className="h-6 w-6" />}
                color="green"
              />
              <StatCard 
                title="Pipeline Value" 
                value={`$${stats.totalPipeline.toLocaleString()}`}
                icon={<DollarSign className="h-6 w-6" />}
                change={{ value: '+15% from last month', positive: true }}
                color="orange"
              />
              <StatCard 
                title="Tasks Due" 
                value={stats.tasksDue}
                icon={<ClipboardCheck className="h-6 w-6" />}
                change={{ value: '2 urgent', positive: false }}
                color="purple"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivity activities={sampleActivities} />
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-lg mb-5">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-crm-blue text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Add New Contact
                  </button>
                  <button className="w-full bg-white border border-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                    Create New Deal
                  </button>
                  <button className="w-full bg-white border border-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                    Schedule Meeting
                  </button>
                  <button className="w-full bg-white border border-gray-300 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                    Add Task
                  </button>
                </div>
                
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <h4 className="font-medium mb-3 text-sm text-gray-700">This Month's Goals</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>New Contacts (15/20)</span>
                        <span className="font-medium">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Deals Closed (3/10)</span>
                        <span className="font-medium">30%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Revenue ($75k/$150k)</span>
                        <span className="font-medium">50%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
