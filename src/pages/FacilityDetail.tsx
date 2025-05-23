
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function FacilityDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Facility Details</h1>
      <Card>
        <CardHeader>
          <CardTitle>Facility ID: {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Facility details will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
