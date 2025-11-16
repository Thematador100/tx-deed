import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import AdminLayout from '@/pages/admin/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit, Search } from 'lucide-react';

const AdminProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error fetching properties", description: error.message, variant: "destructive" });
    } else {
      setProperties(data);
    }
    setLoading(false);
  };

  const handleEdit = (property) => {
    setEditingProperty({ ...property });
  };

  const handleSave = async () => {
    if (!editingProperty) return;
    setIsSaving(true);
    
    const { id, ...updateData } = editingProperty;

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error saving property", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Property saved successfully!" });
      setProperties(properties.map(p => p.id === id ? data : p));
      setEditingProperty(null);
    }
    setIsSaving(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProperty(prev => ({ ...prev, [name]: value }));
  };

  const filteredProperties = properties.filter(p =>
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <Helmet>
        <title>Manage Properties - Admin</title>
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Manage Properties</h1>
        <p className="text-slate-600 mb-8">View and edit all property data in the system.</p>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Est. Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map(property => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.address}</TableCell>
                    <TableCell>${Number(property.price).toLocaleString()}</TableCell>
                    <TableCell>${Number(property.estimated_value).toLocaleString()}</TableCell>
                    <TableCell>{property.property_type}</TableCell>
                    <TableCell>{property.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(property)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>

      {editingProperty && (
        <Dialog open={!!editingProperty} onOpenChange={() => setEditingProperty(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Property: {editingProperty.address}</DialogTitle>
            </DialogHeader>
            <div className="py-4 max-h-[70vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Address</Label><Input name="address" value={editingProperty.address} onChange={handleInputChange} /></div>
              <div><Label>Price</Label><Input type="number" name="price" value={editingProperty.price} onChange={handleInputChange} /></div>
              <div><Label>Estimated Value</Label><Input type="number" name="estimated_value" value={editingProperty.estimated_value} onChange={handleInputChange} /></div>
              <div><Label>Property Type</Label><Input name="property_type" value={editingProperty.property_type} onChange={handleInputChange} /></div>
              <div><Label>Bedrooms</Label><Input type="number" name="bedrooms" value={editingProperty.bedrooms} onChange={handleInputChange} /></div>
              <div><Label>Bathrooms</Label><Input type="number" name="bathrooms" value={editingProperty.bathrooms} onChange={handleInputChange} /></div>
              <div><Label>Sqft</Label><Input type="number" name="sqft" value={editingProperty.sqft} onChange={handleInputChange} /></div>
              <div><Label>Year Built</Label><Input type="number" name="year_built" value={editingProperty.year_built} onChange={handleInputChange} /></div>
              <div><Label>Status</Label><Input name="status" value={editingProperty.status} onChange={handleInputChange} /></div>
              <div><Label>Opportunity Score</Label><Input type="number" name="opportunity_score" value={editingProperty.opportunity_score} onChange={handleInputChange} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Textarea name="description" value={editingProperty.description} onChange={handleInputChange} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProperty(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
};

export default AdminProperties;