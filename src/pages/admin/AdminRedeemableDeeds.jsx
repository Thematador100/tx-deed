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
import { format } from 'date-fns';

const AdminRedeemableDeeds = () => {
  const [deeds, setDeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDeed, setEditingDeed] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deedToDelete, setDeedToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDeeds();
  }, []);

  const fetchDeeds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('redeemable_deeds')
      .select('*')
      .order('redemption_date', { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setDeeds([]);
    } else {
      setDeeds(data || []);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    const defaultRedemptionDate = new Date();
    defaultRedemptionDate.setFullYear(defaultRedemptionDate.getFullYear() + 1);

    setEditingDeed({
      address: '',
      original_owner: '',
      new_owner: '',
      sale_price: '',
      estimated_value: '',
      redemption_date: format(defaultRedemptionDate, 'yyyy-MM-dd'),
      status: 'Redeemable',
      state: '',
      county: '',
      parcel_id: '',
      property_type: '',
      interest_rate: '20',
      penalty_rate: '',
      total_redemption_amount: '',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (deed) => {
    setEditingDeed({...deed});
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingDeed || !editingDeed.address) {
      toast({ title: "Error", description: "Address is required", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const deedData = {
      address: editingDeed.address,
      original_owner: editingDeed.original_owner,
      new_owner: editingDeed.new_owner,
      sale_price: editingDeed.sale_price || null,
      estimated_value: editingDeed.estimated_value || null,
      redemption_date: editingDeed.redemption_date,
      status: editingDeed.status,
      state: editingDeed.state,
      county: editingDeed.county,
      parcel_id: editingDeed.parcel_id,
      property_type: editingDeed.property_type,
      interest_rate: editingDeed.interest_rate || null,
      penalty_rate: editingDeed.penalty_rate || null,
      total_redemption_amount: editingDeed.total_redemption_amount || null,
      notes: editingDeed.notes
    };

    if (editingDeed.id) {
      // Update existing deed
      const { error } = await supabase
        .from('redeemable_deeds')
        .update(deedData)
        .eq('id', editingDeed.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Redeemable deed updated successfully" });
        setIsDialogOpen(false);
        fetchDeeds();
      }
    } else {
      // Create new deed
      const { error } = await supabase
        .from('redeemable_deeds')
        .insert([deedData]);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Redeemable deed created successfully" });
        setIsDialogOpen(false);
        fetchDeeds();
      }
    }
    setIsSaving(false);
  };

  const handleDeleteClick = (deed) => {
    setDeedToDelete(deed);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deedToDelete) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('redeemable_deeds')
      .delete()
      .eq('id', deedToDelete.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Redeemable deed deleted successfully" });
      setIsDeleteDialogOpen(false);
      fetchDeeds();
    }
    setIsSaving(false);
  };

  const filteredDeeds = deeds.filter(deed =>
    deed.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deed.original_owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deed.new_owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBulkImport = () => {
    toast({
      title: "Bulk Import",
      description: "CSV import functionality will be available in the next update. For now, add deeds individually."
    });
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Manage Redeemable Deeds - Admin</title>
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Redeemable Deeds</h1>
            <p className="text-slate-600">Manage all redeemable deed opportunities</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBulkImport}>
              <Upload className="w-4 h-4 mr-2" /> Import CSV
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add Deed
            </Button>
          </div>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by address, owner..."
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
                  <TableHead>Address</TableHead>
                  <TableHead>New Owner</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Redemption Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeeds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center text-slate-500 py-8">
                      No redeemable deeds found. Click "Add Deed" to create your first entry.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeeds.map(deed => (
                    <TableRow key={deed.id}>
                      <TableCell className="font-medium max-w-xs truncate">{deed.address}</TableCell>
                      <TableCell>{deed.new_owner || 'N/A'}</TableCell>
                      <TableCell>${Number(deed.sale_price || 0).toLocaleString()}</TableCell>
                      <TableCell>{deed.redemption_date ? format(new Date(deed.redemption_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          deed.status === 'Redeemable' ? 'bg-green-100 text-green-800' :
                          deed.status === 'Redeemed' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {deed.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(deed)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(deed)}>
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
            <DialogTitle>{editingDeed?.id ? 'Edit Redeemable Deed' : 'Add New Redeemable Deed'}</DialogTitle>
          </DialogHeader>
          {editingDeed && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label>Address *</Label>
                <Input
                  value={editingDeed.address}
                  onChange={(e) => setEditingDeed({...editingDeed, address: e.target.value})}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
              <div>
                <Label>Original Owner</Label>
                <Input
                  value={editingDeed.original_owner || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, original_owner: e.target.value})}
                />
              </div>
              <div>
                <Label>New Owner (Buyer)</Label>
                <Input
                  value={editingDeed.new_owner || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, new_owner: e.target.value})}
                />
              </div>
              <div>
                <Label>Sale Price</Label>
                <Input
                  type="number"
                  value={editingDeed.sale_price || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, sale_price: e.target.value})}
                  placeholder="50000.00"
                />
              </div>
              <div>
                <Label>Estimated Value</Label>
                <Input
                  type="number"
                  value={editingDeed.estimated_value || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, estimated_value: e.target.value})}
                />
              </div>
              <div>
                <Label>Redemption Date</Label>
                <Input
                  type="date"
                  value={editingDeed.redemption_date || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, redemption_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editingDeed.status}
                  onValueChange={(value) => setEditingDeed({...editingDeed, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Redeemable">Redeemable</SelectItem>
                    <SelectItem value="Redeemed">Redeemed</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={editingDeed.state || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, state: e.target.value})}
                  placeholder="GA"
                />
              </div>
              <div>
                <Label>County</Label>
                <Input
                  value={editingDeed.county || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, county: e.target.value})}
                />
              </div>
              <div>
                <Label>Parcel ID</Label>
                <Input
                  value={editingDeed.parcel_id || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, parcel_id: e.target.value})}
                />
              </div>
              <div>
                <Label>Property Type</Label>
                <Input
                  value={editingDeed.property_type || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, property_type: e.target.value})}
                  placeholder="Single Family, Commercial, etc."
                />
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingDeed.interest_rate || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, interest_rate: e.target.value})}
                  placeholder="20.00"
                />
              </div>
              <div>
                <Label>Penalty Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingDeed.penalty_rate || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, penalty_rate: e.target.value})}
                />
              </div>
              <div>
                <Label>Total Redemption Amount</Label>
                <Input
                  type="number"
                  value={editingDeed.total_redemption_amount || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, total_redemption_amount: e.target.value})}
                  placeholder="Calculated automatically if left blank"
                />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={editingDeed.notes || ''}
                  onChange={(e) => setEditingDeed({...editingDeed, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Deed
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
            Are you sure you want to delete the redeemable deed for <strong>{deedToDelete?.address}</strong>?
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

export default AdminRedeemableDeeds;
