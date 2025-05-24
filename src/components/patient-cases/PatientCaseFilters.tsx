
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface PatientCaseFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalCases: number;
  emergencyCases: number;
  activeCases: number;
}

export default function PatientCaseFilters({ 
  searchTerm, 
  onSearchChange, 
  totalCases, 
  emergencyCases, 
  activeCases 
}: PatientCaseFiltersProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search cases..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          All Cases ({totalCases})
        </Button>
        <Button variant="outline" size="sm">
          Emergency ({emergencyCases})
        </Button>
        <Button variant="outline" size="sm">
          Active ({activeCases})
        </Button>
      </div>
    </div>
  );
}
