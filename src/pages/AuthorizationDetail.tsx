
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AuthorizationDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Authorization Details</h1>
      <Card>
        <CardHeader>
          <CardTitle>Authorization ID: {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Authorization details will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
