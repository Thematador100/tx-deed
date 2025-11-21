import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import AdminLayout from '@/pages/admin/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Trash, Plus, Upload, Search } from 'lucide-react';

const AdminTaxLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tax_delinquent_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLeads([]);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingLead({
      name: '',
      address: '',
      delinquent_amount: '',
      status: 'Initial Notice',
      parcel_id: '',
      county: '',
      state: '',
      zip_code: '',
      owner_phone: '',
      owner_email: '',
      years_delinquent: '',
      property_type: '',
      estimated_value: '',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (lead) => {
    setEditingLead({...lead});
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingLead || !editingLead.address) {
      toast({ title: "Error", description: "Address is required", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const leadData = {
      name: editingLead.name,
      address: editingLead.address,
      delinquent_amount: editingLead.delinquent_amount || null,
      status: editingLead.status,
      parcel_id: editingLead.parcel_id,
      county: editingLead.county,
      state: editingLead.state,
      zip_code: editingLead.zip_code,
      owner_phone: editingLead.owner_phone,
      owner_email: editingLead.owner_email,
      years_delinquent: editingLead.years_delinquent || null,
      property_type: editingLead.property_type,
      estimated_value: editingLead.estimated_value || null,
      notes: editingLead.notes
    };

    if (editingLead.id) {
      // Update existing lead
      const { error } = await supabase
        .from('tax_delinquent_leads')
        .update(leadData)
        .eq('id', editingLead.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Lead updated successfully" });
        setIsDialogOpen(false);
        fetchLeads();
      }
    } else {
      // Create new lead
      const { error } = await supabase
        .from('tax_delinquent_leads')
        .insert([leadData]);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Lead created successfully" });
        setIsDialogOpen(false);
        fetchLeads();
      }
    }
    setIsSaving(false);
  };

  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('tax_delinquent_leads')
      .delete()
      .eq('id', leadToDelete.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Lead deleted successfully" });
      setIsDeleteDialogOpen(false);
      fetchLeads();
    }
    setIsSaving(false);
  };

  const filteredLeads = leads.filter(lead =>
    lead.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.parcel_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBulkImport = () => {
    toast({
      title: "Bulk Import",
      description: "CSV import functionality will be available in the next update. For now, add leads individually."
    });
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Manage Tax Delinquent Leads - Admin</title>
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Tax Delinquent Leads</h1>
            <p className="text-slate-600">Manage all tax delinquent property leads</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBulkImport}>
              <Upload className="w-4 h-4 mr-2" /> Import CSV
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add Lead
            </Button>
          </div>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by address, owner, or parcel ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcel ID</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Delinquent Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center text-slate-500 py-8">
                      No tax delinquent leads found. Click "Add Lead" to create your first entry.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.parcel_id || 'N/A'}</TableCell>
                      <TableCell>{lead.name || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">{lead.address}</TableCell>
                      <TableCell>${Number(lead.delinquent_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          lead.status === 'Initial Notice' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'Final Notice' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'Lien Filed' ? 'bg-red-100 text-red-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(lead)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(lead)}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead?.id ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label>Address *</Label>
                <Input
                  value={editingLead.address}
                  onChange={(e) => setEditingLead({...editingLead, address: e.target.value})}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
              <div>
                <Label>Owner Name</Label>
                <Input
                  value={editingLead.name || ''}
                  onChange={(e) => setEditingLead({...editingLead, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Parcel ID</Label>
                <Input
                  value={editingLead.parcel_id || ''}
                  onChange={(e) => setEditingLead({...editingLead, parcel_id: e.target.value})}
                />
              </div>
              <div>
                <Label>Delinquent Amount</Label>
                <Input
                  type="number"
                  value={editingLead.delinquent_amount || ''}
                  onChange={(e) => setEditingLead({...editingLead, delinquent_amount: e.target.value})}
                  placeholder="5000.00"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editingLead.status}
                  onValueChange={(value) => setEditingLead({...editingLead, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Initial Notice">Initial Notice</SelectItem>
                    <SelectItem value="Final Notice">Final Notice</SelectItem>
                    <SelectItem value="Payment Plan">Payment Plan</SelectItem>
                    <SelectItem value="Lien Filed">Lien Filed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>County</Label>
                <Input
                  value={editingLead.county || ''}
                  onChange={(e) => setEditingLead({...editingLead, county: e.target.value})}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={editingLead.state || ''}
                  onChange={(e) => setEditingLead({...editingLead, state: e.target.value})}
                  placeholder="GA"
                />
              </div>
              <div>
                <Label>ZIP Code</Label>
                <Input
                  value={editingLead.zip_code || ''}
                  onChange={(e) => setEditingLead({...editingLead, zip_code: e.target.value})}
                />
              </div>
              <div>
                <Label>Owner Phone</Label>
                <Input
                  value={editingLead.owner_phone || ''}
                  onChange={(e) => setEditingLead({...editingLead, owner_phone: e.target.value})}
                />
              </div>
              <div>
                <Label>Owner Email</Label>
                <Input
                  type="email"
                  value={editingLead.owner_email || ''}
                  onChange={(e) => setEditingLead({...editingLead, owner_email: e.target.value})}
                />
              </div>
              <div>
                <Label>Years Delinquent</Label>
                <Input
                  type="number"
                  value={editingLead.years_delinquent || ''}
                  onChange={(e) => setEditingLead({...editingLead, years_delinquent: e.target.value})}
                />
              </div>
              <div>
                <Label>Property Type</Label>
                <Input
                  value={editingLead.property_type || ''}
                  onChange={(e) => setEditingLead({...editingLead, property_type: e.target.value})}
                  placeholder="Single Family, Condo, etc."
                />
              </div>
              <div>
                <Label>Estimated Value</Label>
                <Input
                  type="number"
                  value={editingLead.estimated_value || ''}
                  onChange={(e) => setEditingLead({...editingLead, estimated_value: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({...editingLead, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete the lead for <strong>{leadToDelete?.address}</strong>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTaxLeads;
