import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  User, 
  Calendar, 
  DollarSign,
  ExternalLink,
  RefreshCw,
  Filter,
  Search,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';

interface FranchiseRequest {
  id: string;
  google_form_id: string | null;
  google_sheet_row_id: string | null;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  investment_amount: number | null;
  preferred_territory: string | null;
  business_experience: string | null;
  current_business: string | null;
  why_franchise: string | null;
  expected_timeline: string | null;
  additional_notes: string | null;
  status: 'new' | 'reviewing' | 'approved' | 'rejected' | 'contacted';
  assigned_to: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  created_at: string | null;
  updated_at: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

export default function FranchiseRequests() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<FranchiseRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    investment_amount: '',
    preferred_territory: '',
    business_experience: '',
    current_business: '',
    why_franchise: '',
    expected_timeline: '',
    status: '',
    priority: '',
    assigned_to: '',
    additional_notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch franchise requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['franchise-requests'],
    queryFn: async (): Promise<FranchiseRequest[]> => {
      const { data, error } = await supabase
        .from('franchise_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch profiles for assignment
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      return data || [];
    }
  });

  // Update franchise request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FranchiseRequest> }) => {
      const { data: result, error } = await supabase
        .from('franchise_requests')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchise-requests'] });
      toast.success('Franchise request updated successfully');
      setIsEditDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error(`Failed to update request: ${error.message}`);
    }
  });

  // Delete franchise request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('franchise_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchise-requests'] });
      toast.success('Franchise request deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete request: ${error.message}`);
    }
  });

  // Filter requests
  const filteredRequests = requests?.filter(request => {
    const matchesSearch = 
      (request.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      request.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  // Handle view request
  const handleViewRequest = (request: FranchiseRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  // Handle edit request
  const handleEditRequest = (request: FranchiseRequest) => {
    setSelectedRequest(request);
    setEditForm({
      business_name: request.business_name || '',
      owner_name: request.owner_name || '',
      email: request.email || '',
      phone: request.phone || '',
      city: request.city || '',
      state: request.state || '',
      investment_amount: request.investment_amount?.toString() || '',
      preferred_territory: request.preferred_territory || '',
      business_experience: request.business_experience || '',
      current_business: request.current_business || '',
      why_franchise: request.why_franchise || '',
      expected_timeline: request.expected_timeline || '',
      status: request.status,
      priority: request.priority,
      assigned_to: request.assigned_to || '',
      additional_notes: request.additional_notes || ''
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete request
  const handleDeleteRequest = (request: FranchiseRequest) => {
    setSelectedRequest(request);
    setIsDeleteDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!selectedRequest) return;

    updateRequestMutation.mutate({
      id: selectedRequest.id,
      data: {
        business_name: editForm.business_name || null,
        owner_name: editForm.owner_name,
        email: editForm.email,
        phone: editForm.phone,
        city: editForm.city || null,
        state: editForm.state || null,
        investment_amount: editForm.investment_amount ? parseInt(editForm.investment_amount) : null,
        preferred_territory: editForm.preferred_territory || null,
        business_experience: editForm.business_experience || null,
        current_business: editForm.current_business || null,
        why_franchise: editForm.why_franchise || null,
        expected_timeline: editForm.expected_timeline || null,
        status: editForm.status as FranchiseRequest['status'],
        priority: editForm.priority as FranchiseRequest['priority'],
        assigned_to: editForm.assigned_to || null,
        additional_notes: editForm.additional_notes || null,
        updated_at: new Date().toISOString()
      }
    });
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!selectedRequest) return;
    deleteRequestMutation.mutate(selectedRequest.id);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'reviewing': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'contacted': return 'outline';
      default: return 'default';
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'low': return 'outline';
      case 'medium': return 'secondary';
      case 'high': return 'default';
      case 'urgent': return 'destructive';
      default: return 'outline';
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format amount in Indian number format
  const formatIndianAmount = (amount: number | null) => {
    if (!amount) return 'N/A';
    
    // Convert to string and split by decimal point
    const parts = amount.toString().split('.');
    const integerPart = parts[0];
    
    // Add commas in Indian format (last 3 digits, then every 2 digits)
    let formatted = '';
    const len = integerPart.length;
    
    for (let i = 0; i < len; i++) {
      if (i > 0 && (len - i) % 2 === 1 && i !== len - 3) {
        formatted += ',';
      }
      formatted += integerPart[i];
    }
    
    // Add decimal part if exists
    if (parts.length > 1) {
      formatted += '.' + parts[1];
    }
    
    return `₹${formatted}`;
  };

  if (requestsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Franchise Requests</h1>
            <p className="text-muted-foreground">Manage franchise requests from Google Forms</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Franchise Requests</h1>
          <p className="text-muted-foreground">
            Manage franchise requests from Google Forms ({filteredRequests.length} requests)
          </p>
        </div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['franchise-requests'] })}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                                 <div className="space-y-1">
                   <CardTitle className="text-lg">{request.business_name || request.owner_name}</CardTitle>
                   <CardDescription className="flex items-center gap-1">
                     <User className="h-3 w-3" />
                     {request.owner_name}
                   </CardDescription>
                 </div>
                <div className="flex flex-col gap-1">
                  <Badge variant={getStatusBadgeVariant(request.status)}>
                    {request.status}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(request.priority)}>
                    {request.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{request.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{request.phone}</span>
                </div>
                {request.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{request.city}, {request.state}</span>
                  </div>
                )}
                {request.investment_amount_text && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>{request.investment_amount_text}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  {formatDate(request.created_at)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRequest(request)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRequest(request)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRequest(request)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No franchise requests found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Franchise requests from Google Forms will appear here.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Franchise Request Details</DialogTitle>
            <DialogDescription>
              View complete details of the franchise request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Business Name</Label>
                  <p className="text-sm">{selectedRequest.business_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Owner Name</Label>
                  <p className="text-sm">{selectedRequest.owner_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{selectedRequest.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">City</Label>
                  <p className="text-sm">{selectedRequest.city || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">State</Label>
                  <p className="text-sm">{selectedRequest.state || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Investment Amount</Label>
                  <p className="text-sm">
                    {selectedRequest.investment_amount_text || formatIndianAmount(selectedRequest.investment_amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Preferred Territory</Label>
                  <p className="text-sm">{selectedRequest.preferred_territory || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Business Experience</Label>
                  <p className="text-sm">{selectedRequest.business_experience || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Business</Label>
                  <p className="text-sm">{selectedRequest.current_business || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Why Franchise</Label>
                  <p className="text-sm">{selectedRequest.why_franchise || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Expected Timeline</Label>
                  <p className="text-sm">{selectedRequest.expected_timeline || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Additional Notes</Label>
                  <p className="text-sm">{selectedRequest.additional_notes || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(selectedRequest.priority)}>
                    {selectedRequest.priority}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  Created: {formatDate(selectedRequest.created_at)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Franchise Request</DialogTitle>
            <DialogDescription>
              Update the details of this franchise request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={editForm.business_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <Input
                    id="owner_name"
                    value={editForm.owner_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, owner_name: e.target.value }))}
                    placeholder="Owner name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={editForm.city}
                    onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={editForm.state}
                    onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investment_amount">Investment Amount (₹)</Label>
                  <Input
                    id="investment_amount"
                    type="number"
                    value={editForm.investment_amount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, investment_amount: e.target.value }))}
                    placeholder="Investment amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_territory">Preferred Territory</Label>
                  <Input
                    id="preferred_territory"
                    value={editForm.preferred_territory}
                    onChange={(e) => setEditForm(prev => ({ ...prev, preferred_territory: e.target.value }))}
                    placeholder="Preferred territory"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_experience">Business Experience</Label>
                  <Input
                    id="business_experience"
                    value={editForm.business_experience}
                    onChange={(e) => setEditForm(prev => ({ ...prev, business_experience: e.target.value }))}
                    placeholder="Business experience"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_business">Current Business</Label>
                  <Input
                    id="current_business"
                    value={editForm.current_business}
                    onChange={(e) => setEditForm(prev => ({ ...prev, current_business: e.target.value }))}
                    placeholder="Current business"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="why_franchise">Why Franchise</Label>
                  <Textarea
                    id="why_franchise"
                    value={editForm.why_franchise}
                    onChange={(e) => setEditForm(prev => ({ ...prev, why_franchise: e.target.value }))}
                    placeholder="Why do they want to take the franchise?"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_timeline">Expected Timeline</Label>
                  <Input
                    id="expected_timeline"
                    value={editForm.expected_timeline}
                    onChange={(e) => setEditForm(prev => ({ ...prev, expected_timeline: e.target.value }))}
                    placeholder="Expected timeline"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Additional Notes</Label>
                  <Textarea
                    id="additional_notes"
                    value={editForm.additional_notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, additional_notes: e.target.value }))}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Management</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={editForm.priority} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select value={editForm.assigned_to} onValueChange={(value) => setEditForm(prev => ({ ...prev, assigned_to: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {profiles?.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateRequestMutation.isPending}>
              {updateRequestMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Franchise Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this franchise request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Request Details:</h4>
                <p className="text-sm">
                  <strong>Name:</strong> {selectedRequest.owner_name}
                </p>
                <p className="text-sm">
                  <strong>Business:</strong> {selectedRequest.business_name || 'N/A'}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {selectedRequest.email}
                </p>
                <p className="text-sm">
                  <strong>Phone:</strong> {selectedRequest.phone}
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmDelete}
                  disabled={deleteRequestMutation.isPending}
                >
                  {deleteRequestMutation.isPending ? 'Deleting...' : 'Delete Request'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
