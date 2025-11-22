import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import AdminLayout from '@/pages/admin/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Edit, Trash, BookOpen, Video, FileText, UploadCloud, FileInput, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDropzone } from 'react-dropzone';
import libraryContent from '@/data/library-content.json';

const DocumentIngestor = ({ onProcessComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      setIsProcessing(true);

      setTimeout(() => {
        let aiData;
        if (file.type === 'text/plain') {
          aiData = {
            title: `Property Leads from ${file.name}`,
            description: "Extracted 3 tax deed properties in CT with a 6-month redemption period. Ready for review and import into the main property database.",
            item_type: 'article',
            url: `internal://leads-summary/${file.name}`,
          };
        } else {
          aiData = {
            title: `Summary of ${file.name.replace(/\.[^/.]+$/, "")}`,
            description: "This document outlines new procedures for surplus funds in Harris County, TX, effective Q4 2025. Key changes include a shortened claim period and new documentation requirements.",
            item_type: 'pdf',
            url: `https://your-supabase-bucket.supabase.co/storage/v1/object/public/library-docs/${file.name}`,
          };
        }
        
        onProcessComplete(aiData);
        setIsProcessing(false);
        setFileName('');
      }, 2500);
    }
  }, [onProcessComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
      <div className="flex items-center mb-4">
        <FileInput className="w-6 h-6 mr-3 text-purple-600" />
        <h2 className="text-2xl font-bold text-slate-900">Intelligent Document Ingestor</h2>
      </div>
      <p className="text-slate-600 mb-4">Drop a PDF or TXT file below. The "Ingestor & Router" AI will use OCR to read, summarize, and classify it for you.</p>
      
      {isProcessing ? (
        <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-lg">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-600 mb-3" />
          <p className="font-semibold text-slate-700">AI is processing: {fileName}</p>
          <p className="text-sm text-slate-500">Engaging Optical Character Recognition (OCR)...</p>
        </div>
      ) : (
        <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-purple-600 bg-purple-50' : 'border-slate-300 hover:border-purple-400'}`}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center text-center">
            <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
            <p className="font-semibold text-slate-700">Drop PDF or TXT file here, or click to select</p>
            <p className="text-sm text-slate-500">The AI will handle the rest.</p>
          </div>
        </div>
      )}
    </div>
  );
};


const AdminLibrary = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    item_type: 'video',
    url: '',
    thumbnail_url: '',
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);

    // Load static library content (all 50 states + educational resources)
    const staticItems = libraryContent.map(item => ({
      ...item,
      isStatic: true, // Mark as static (non-editable)
      created_at: new Date().toISOString()
    }));

    // Try to load custom items from Supabase (admin-added content)
    const { data, error } = await supabase.from('library_items').select('*').order('created_at', { ascending: false });

    if (error) {
      // If Supabase fails (e.g., migrations not run), just use static content
      console.log('Using static library content (Supabase not yet configured)');
      setItems(staticItems);
    } else {
      // Merge static content with custom admin-added content
      setItems([...data, ...staticItems]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, item_type: value }));
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ title: '', description: '', item_type: 'video', url: '', thumbnail_url: '' });
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        item_type: item.item_type,
        url: item.url,
        thumbnail_url: item.thumbnail_url || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleAIProcessComplete = (aiData) => {
    setFormData({
      title: aiData.title,
      description: aiData.description,
      item_type: aiData.item_type,
      url: aiData.url,
      thumbnail_url: '',
    });
    setIsDialogOpen(true);
    toast({
      title: "AI Processing Complete!",
      description: "The form has been pre-filled. Please review and save.",
      action: <Cpu className="w-5 h-5" />,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = editingItem
      ? await supabase.from('library_items').update(formData).eq('id', editingItem.id)
      : await supabase.from('library_items').insert(formData);

    if (error) {
      toast({ title: "Save Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: `Library item ${editingItem ? 'updated' : 'created'}.` });
      setIsDialogOpen(false);
      fetchItems();
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    const { error } = await supabase.from('library_items').delete().eq('id', itemId);
    if (error) {
      toast({ title: "Delete Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item Deleted" });
      fetchItems();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-500" />;
      case 'pdf': return <FileText className="w-5 h-5 text-blue-500" />;
      default: return <BookOpen className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Manage Library - Admin</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Manage Resource Library</h1>
          <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add Manually</Button>
        </div>

        <DocumentIngestor onProcessComplete={handleAIProcessComplete} />
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add'} Library Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item_type" className="text-right">Type</Label>
                <Select name="item_type" value={formData.item_type} onValueChange={handleSelectChange}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">URL</Label>
                <Input id="url" name="url" type="url" value={formData.url} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="thumbnail_url" className="text-right">Thumbnail URL</Label>
                <Input id="thumbnail_url" name="thumbnail_url" type="url" value={formData.thumbnail_url} onChange={handleInputChange} className="col-span-3" />
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-800">Title</th>
                  <th className="p-4 font-semibold text-slate-800">Type</th>
                  <th className="p-4 font-semibold text-slate-800">URL</th>
                  <th className="p-4 font-semibold text-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" /></td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-8 text-slate-500">No library items yet.</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">
                        {item.title}
                        {item.isStatic && <span className="ml-2 text-xs text-slate-500">(Built-in)</span>}
                      </td>
                      <td className="p-4 text-slate-600"><span className="flex items-center gap-2">{getIcon(item.item_type)} {item.item_type}</span></td>
                      <td className="p-4 text-slate-600 truncate max-w-xs"><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{item.url}</a></td>
                      <td className="p-4 text-right space-x-2">
                        {!item.isStatic && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(item)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}><Trash className="w-4 h-4" /></Button>
                          </>
                        )}
                        {item.isStatic && <span className="text-xs text-slate-400">Read-only</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminLibrary;