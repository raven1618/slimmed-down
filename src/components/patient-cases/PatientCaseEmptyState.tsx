
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface PatientCaseEmptyStateProps {
  searchTerm: string;
  onCreateCase: () => void;
}

export default function PatientCaseEmptyState({ searchTerm, onCreateCase }: PatientCaseEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 mb-4">
          {searchTerm ? 'No cases found matching your search' : 'No patient cases yet'}
        </p>
        <Button variant="outline" onClick={onCreateCase}>
          Create First Case
        </Button>
      </CardContent>
    </Card>
  );
}
