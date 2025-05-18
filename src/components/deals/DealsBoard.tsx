
import React, { useState } from 'react';
import { Deal } from '@/data/sampleData';
import { DollarSign, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface DealsBoardProps {
  deals: Deal[];
}

type Stage = Deal['stage'];
type StageColumn = {
  id: Stage;
  title: string;
  deals: Deal[];
};

export default function DealsBoard({ deals }: DealsBoardProps) {
  const [view, setView] = useState<'board' | 'table'>('board');
  
  const stageColumns: StageColumn[] = [
    { id: 'Lead', title: 'Lead', deals: [] },
    { id: 'Qualified', title: 'Qualified', deals: [] },
    { id: 'Proposal', title: 'Proposal', deals: [] },
    { id: 'Negotiation', title: 'Negotiation', deals: [] },
    { id: 'Closed Won', title: 'Closed Won', deals: [] },
    { id: 'Closed Lost', title: 'Closed Lost', deals: [] },
  ];
  
  // Populate the columns with deals
  deals.forEach(deal => {
    const column = stageColumns.find(col => col.id === deal.stage);
    if (column) {
      column.deals.push(deal);
    }
  });

  const getColumnTotal = (column: StageColumn) => {
    return column.deals.reduce((sum, deal) => sum + deal.value, 0);
  };

  const getStageColorClass = (stage: Stage) => {
    switch (stage) {
      case 'Lead':
        return 'bg-blue-50 border-blue-200';
      case 'Qualified':
        return 'bg-purple-50 border-purple-200';
      case 'Proposal':
        return 'bg-yellow-50 border-yellow-200';
      case 'Negotiation':
        return 'bg-orange-50 border-orange-200';
      case 'Closed Won':
        return 'bg-green-50 border-green-200';
      case 'Closed Lost':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'board' ? 'default' : 'outline'}
              onClick={() => setView('board')}
              className={cn(
                view === 'board' ? 'bg-crm-blue hover:bg-blue-700' : ''
              )}
            >
              Board View
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              onClick={() => setView('table')}
              className={cn(
                view === 'table' ? 'bg-crm-blue hover:bg-blue-700' : ''
              )}
              disabled
            >
              Table View
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button className="bg-crm-blue hover:bg-blue-700">Add Deal</Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 overflow-x-auto pb-4">
        {stageColumns.map((column) => (
          <div key={column.id} className={`rounded-lg border ${getStageColorClass(column.id)} p-4 min-w-[300px] flex-1`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">{column.title}</h3>
              <span className="text-sm text-gray-500">{column.deals.length}</span>
            </div>
            
            <div className="mb-3 flex justify-between items-center">
              <div className="text-xs text-gray-500">Total: ${getColumnTotal(column).toLocaleString()}</div>
            </div>
            
            <div className="space-y-3">
              {column.deals.map((deal) => (
                <div 
                  key={deal.id} 
                  className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between">
                    <div className="font-medium">{deal.name}</div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-6 w-6">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Move</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-1">{deal.company}</div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center text-sm font-medium">
                      <DollarSign className="h-3.5 w-3.5 mr-1" />
                      {deal.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{deal.owner}</div>
                  </div>
                </div>
              ))}

              {column.deals.length === 0 && (
                <div className="bg-white bg-opacity-60 border border-dashed border-gray-300 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-500">No deals</p>
                </div>
              )}

              <button className="w-full text-sm py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 flex items-center justify-center hover:bg-white hover:border-gray-400 transition-colors">
                <span className="mr-1">+</span> Add Deal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
