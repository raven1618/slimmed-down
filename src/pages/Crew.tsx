
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Phone, Mail, Shield, Calendar, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CrewMember } from '@/types/medicalTransport';
import { getCrewMembers } from '@/services/crewMemberService';
import { toast } from 'sonner';
import CreateCrewMemberDialog from '@/components/crew/CreateCrewMemberDialog';
import CrewMemberDetailDialog from '@/components/crew/CrewMemberDetailDialog';

export default function Crew() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCrewMember, setSelectedCrewMember] = useState<CrewMember | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCrewMembers = async () => {
    try {
      setLoading(true);
      const data = await getCrewMembers();
      setCrewMembers(data);
    } catch (error) {
      console.error('Error fetching crew members:', error);
      toast.error('Failed to load crew members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrewMembers();
  }, []);

  const handleViewCrewMember = (crewMember: CrewMember) => {
    setSelectedCrewMember(crewMember);
    setIsDetailDialogOpen(true);
  };

  const handleCrewMemberUpdate = () => {
    fetchCrewMembers();
    setIsDetailDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'Training':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCertLevelColor = (level: string) => {
    switch (level) {
      case 'EMT-Paramedic':
        return 'bg-purple-100 text-purple-800';
      case 'EMT-Intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'EMT-Basic':
        return 'bg-green-100 text-green-800';
      case 'RN':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCrewMembers = crewMembers.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.cert_level.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeMembers = crewMembers.filter(member => member.status === 'Active').length;
  const averageSafetyScore = crewMembers.length > 0 
    ? Math.round(crewMembers.reduce((sum, member) => sum + member.safety_score, 0) / crewMembers.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Crew Management</h1>
        <div className="text-center py-8">Loading crew members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Crew Management</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Crew Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Crew</p>
                <p className="text-2xl font-bold">{crewMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl font-bold">{activeMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Safety Score</p>
                <p className="text-2xl font-bold">{averageSafetyScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search crew members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            All Members ({crewMembers.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crew Members</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCrewMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Safety Score</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Cert Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCrewMembers.map((member) => (
                  <TableRow 
                    key={member.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewCrewMember(member)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {member.full_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.employee_id ? (
                        <Badge variant="outline">{member.employee_id}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCertLevelColor(member.cert_level)}>
                        {member.cert_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-gray-500" />
                        {member.safety_score}/100
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {member.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {member.phone}
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {member.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.cert_expiry ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(member.cert_expiry).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No crew members found matching your search' : 'No crew members yet'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Add First Crew Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCrewMemberDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          fetchCrewMembers();
        }}
      />

      <CrewMemberDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        crewMember={selectedCrewMember}
        onUpdate={handleCrewMemberUpdate}
      />
    </div>
  );
}
