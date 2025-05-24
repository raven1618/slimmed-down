
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { seedSampleData, clearSampleData } from '@/data/sampleDataSeeder';
import { toast } from 'sonner';

export default function SampleDataManager() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastAction, setLastAction] = useState<'seed' | 'clear' | null>(null);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedSampleData();
      setLastAction('seed');
      toast.success('Sample data seeded successfully!');
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed sample data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearSampleData();
      setLastAction('clear');
      toast.success('Sample data cleared successfully!');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear sample data');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Data Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tool helps you manage sample data for demo purposes. The sample data includes:
            facilities, vehicles, crew members, patient cases, transports, tasks, and activities.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Seed Sample Data</h3>
            <p className="text-sm text-gray-600">
              Add comprehensive demo data including 5 facilities, 5 vehicles, 5 crew members, 
              8 patient cases, 3 transports, 5 tasks, 5 activities, and 2 maintenance records.
            </p>
            <Button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="w-full"
              variant="default"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Data...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Sample Data
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Clear All Data</h3>
            <p className="text-sm text-gray-600">
              Remove all existing data from the database. This will clear all tables
              and reset the application to a clean state.
            </p>
            <Button
              onClick={handleClearData}
              disabled={isClearing}
              className="w-full"
              variant="destructive"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Clearing Data...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </>
              )}
            </Button>
          </div>
        </div>

        {lastAction && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {lastAction === 'seed' 
                ? 'Sample data has been successfully seeded! You can now explore all features with realistic demo data.'
                : 'All data has been cleared! The application is now in a clean state.'
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Sample Data Includes:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 5 Healthcare facilities (Hospital, Nursing Home, FSER, Behavioral, Event)</li>
            <li>• 5 Vehicles (3 Ambulances, 1 Supervisor, 1 Support) with realistic statuses</li>
            <li>• 5 Crew members with different roles and certifications</li>
            <li>• 8 Patient cases with various priorities and statuses</li>
            <li>• 3 Active transports with crew assignments</li>
            <li>• 5 Tasks with different priorities and due dates</li>
            <li>• 5 Recent activities showing system usage</li>
            <li>• 2 Maintenance records for fleet management demo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
