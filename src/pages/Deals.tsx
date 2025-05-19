
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import DealsBoard from '@/components/deals/DealsBoard';
import { fetchDeals } from '@/services/dealService';
import { Deal } from '@/data/sampleData';

const Deals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDeals = async () => {
    setIsLoading(true);
    try {
      const dealsData = await fetchDeals();
      setDeals(dealsData);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Deals Pipeline</h1>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crm-blue"></div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <DealsBoard deals={deals} onDealsChange={loadDeals} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Deals;
