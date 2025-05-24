
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building, Phone, MapPin, Clock } from 'lucide-react';
import { Facility } from '@/types/medicalTransport';
import { getFacilities } from '@/services/facilityService';
import { toast } from 'sonner';
import CreateFacilityDialog from '@/components/facilities/CreateFacilityDialog';
import FacilityDetailDialog from '@/components/facilities/FacilityDetailDialog';

export default function Facilities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const data = await getFacilities();
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      toast.error('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleViewFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsDetailDialogOpen(true);
  };

  const handleFacilityUpdate = () => {
    fetchFacilities();
    setIsDetailDialogOpen(false);
  };

  const getFacilityTypeColor = (type: string) => {
    switch (type) {
      case 'Hospital':
        return 'bg-blue-100 text-blue-800';
      case 'FSER':
        return 'bg-red-100 text-red-800';
      case 'Behavioral':
        return 'bg-purple-100 text-purple-800';
      case 'NursingHome':
        return 'bg-green-100 text-green-800';
      case 'Event':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Facilities</h1>
        <div className="text-center py-8">Loading facilities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Facilities</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Facility
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search facilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            All Facilities ({facilities.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => (
          <Card key={facility.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewFacility(facility)}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {facility.name}
                  </CardTitle>
                </div>
                <Badge className={getFacilityTypeColor(facility.type)}>
                  {facility.type}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {facility.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    {facility.address}
                  </div>
                </div>
              )}
              
              {facility.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{facility.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  SLA: {facility.sla_target_mins} minutes
                </span>
              </div>
              
              <div className="text-xs text-gray-500 pt-2 border-t">
                Created {new Date(facility.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFacilities.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No facilities found matching your search' : 'No facilities yet'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create First Facility
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateFacilityDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          fetchFacilities();
        }}
      />

      <FacilityDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        facility={selectedFacility}
        onUpdate={handleFacilityUpdate}
      />
    </div>
  );
}
