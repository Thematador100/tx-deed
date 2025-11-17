import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { UploadCloud, FileText, CheckCircle, XCircle, Loader2, BrainCircuit, Layers } from 'lucide-react';
import Papa from 'papaparse';

const LeadUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchUploadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('lead_uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching upload history:", error);
      toast({ title: "Error", description: "Could not load upload history.", variant: "destructive" });
    } else {
      setUploadHistory(data);
    }
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => {
    fetchUploadHistory();
  }, [fetchUploadHistory]);

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    }
  });

  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const normalizePropertyData = (row) => {
    // Try to map common CSV column names to our schema
    const addressFields = ['address', 'property_address', 'street_address', 'full_address', 'Address', 'Property Address'];
    const priceFields = ['price', 'opening_bid', 'minimum_bid', 'starting_bid', 'Price', 'Opening Bid'];
    const valueFields = ['assessed_value', 'market_value', 'appraised_value', 'value', 'Assessed Value', 'Market Value'];
    const parcelFields = ['parcel_id', 'parcel', 'parcel_number', 'apn', 'Parcel ID'];
    const ownerFields = ['owner', 'owner_name', 'property_owner', 'Owner', 'Owner Name'];
    const cityFields = ['city', 'City'];
    const stateFields = ['state', 'State'];
    const zipFields = ['zip', 'zipcode', 'zip_code', 'Zip', 'ZIP'];
    const bedroomFields = ['bedrooms', 'beds', 'Bedrooms', 'Beds'];
    const bathroomFields = ['bathrooms', 'baths', 'Bathrooms', 'Baths'];
    const sqftFields = ['sqft', 'square_feet', 'area', 'living_area', 'Sqft', 'Square Feet'];
    const yearFields = ['year_built', 'year', 'Year Built', 'Year'];

    const findValue = (fields) => {
      for (const field of fields) {
        if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
          return row[field];
        }
      }
      return null;
    };

    const parseNumber = (value) => {
      if (!value) return null;
      const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    };

    return {
      address: findValue(addressFields),
      parcel_id: findValue(parcelFields),
      owner: findValue(ownerFields),
      price: parseNumber(findValue(priceFields)),
      assessed_value: parseNumber(findValue(valueFields)),
      city: findValue(cityFields),
      state: findValue(stateFields),
      zip: findValue(zipFields),
      bedrooms: parseNumber(findValue(bedroomFields)),
      bathrooms: parseNumber(findValue(bathroomFields)),
      sqft: parseNumber(findValue(sqftFields)),
      year_built: parseNumber(findValue(yearFields))
    };
  };

  const handleUpload = async () => {
    if (files.length === 0 || !user) {
      toast({ title: "No files selected", description: "Please select files to upload.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    toast({ title: "Uploading...", description: "Your property lists are being processed by our AI." });

    for (const file of files) {
      const fileFormat = file.name.split('.').pop().toLowerCase();
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('lead_uploads')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_format: fileFormat,
          status: 'processing',
        })
        .select()
        .single();

      if (uploadError) {
        toast({ title: `Upload failed for ${file.name}`, description: uploadError.message, variant: "destructive" });
        continue;
      }

      try {
        let properties = [];

        // Parse file based on format
        if (fileFormat === 'csv') {
          const parsedData = await parseCSVFile(file);
          properties = parsedData
            .map(row => normalizePropertyData(row))
            .filter(prop => prop.address); // Only keep properties with addresses
        } else if (['xls', 'xlsx'].includes(fileFormat)) {
          // For Excel files, we'll need server-side processing
          toast({
            title: "Excel Processing",
            description: "Excel files require server-side processing. This feature is coming soon!",
            variant: "default"
          });
          await supabase.from('lead_uploads').update({ status: 'error' }).eq('id', uploadRecord.id);
          continue;
        } else if (fileFormat === 'pdf') {
          // PDFs need OCR processing via Google Document AI
          toast({
            title: "PDF Processing",
            description: "PDF files will be processed using OCR. This may take a few minutes.",
            variant: "default"
          });
          await supabase.from('lead_uploads').update({ status: 'error' }).eq('id', uploadRecord.id);
          continue;
        }

        if (properties.length === 0) {
          await supabase.from('lead_uploads').update({
            status: 'error',
            leads_found: 0
          }).eq('id', uploadRecord.id);
          toast({
            title: `No properties found in ${file.name}`,
            description: "Please ensure the file contains property data with addresses.",
            variant: "destructive"
          });
          continue;
        }

        // Call property-analysis edge function to enrich properties
        const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
          'property-analysis',
          {
            body: { properties }
          }
        );

        if (analysisError) {
          console.error('Analysis error:', analysisError);
          // If analysis fails, still insert the basic property data
          const { error: insertError } = await supabase.from('properties').insert(properties);

          if (insertError) {
            await supabase.from('lead_uploads').update({ status: 'error' }).eq('id', uploadRecord.id);
            toast({
              title: `Processing failed for ${file.name}`,
              description: insertError.message,
              variant: "destructive"
            });
          } else {
            await supabase.from('lead_uploads').update({
              status: 'completed',
              leads_found: properties.length
            }).eq('id', uploadRecord.id);
            toast({
              title: "Upload Complete (Basic Data)",
              description: `${properties.length} properties from ${file.name} have been added. AI analysis was unavailable.`,
            });
          }
        } else {
          // Success! Properties were analyzed and inserted by the edge function
          await supabase.from('lead_uploads').update({
            status: 'completed',
            leads_found: analysisResult.analyzed || properties.length
          }).eq('id', uploadRecord.id);

          toast({
            title: "Processing Complete!",
            description: `${analysisResult.analyzed || properties.length} properties analyzed and added to your Deal Stream.`,
            action: <Button onClick={() => navigate('/properties')}>View Properties</Button>,
          });
        }
      } catch (error) {
        console.error('Upload processing error:', error);
        await supabase.from('lead_uploads').update({ status: 'error' }).eq('id', uploadRecord.id);
        toast({
          title: `Processing failed for ${file.name}`,
          description: error.message || 'An unexpected error occurred',
          variant: "destructive"
        });
      }
    }

    setFiles([]);
    setIsUploading(false);
    fetchUploadHistory();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" />;
      case 'processing': return <Loader2 className="text-blue-500 animate-spin" />;
      case 'error': return <XCircle className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Upload Property Lists - Win With Deeds</title>
        <meta name="description" content="Easily upload your property lists from Regrid, BatchLeads, PropWire, and more. Let our AI process them for you." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 flex items-center justify-center">
            <Layers className="w-12 h-12 mr-4 text-purple-600" /> AI-Powered Property Uploader
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            Upload property lists from <span className="font-semibold text-purple-700">Regrid, BatchLeads, PropWire,</span> or any other source. Our AI will automatically parse, clean, and import them into your account.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div {...getRootProps()} className={`p-12 border-4 border-dashed rounded-2xl cursor-pointer transition-colors ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-slate-300 bg-white hover:border-purple-400'}`}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center text-center">
                <UploadCloud className="w-16 h-16 text-slate-400 mb-4" />
                {isDragActive ? (
                  <p className="text-xl font-semibold text-purple-600">Drop the files here ...</p>
                ) : (
                  <p className="text-xl font-semibold text-slate-700">Drag & drop files here, or click to select</p>
                )}
                <p className="text-sm text-slate-500 mt-2">Supports: CSV, XLS, XLSX, PDF</p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold mb-2">Files to upload:</h3>
                <ul className="space-y-2">
                  {files.map(file => (
                    <li key={file.path} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <span className="text-sm font-medium">{file.path} - {(file.size / 1024).toFixed(2)} KB</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setFiles(files.filter(f => f.path !== file.path))}>Remove</Button>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleUpload} size="lg" className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-700 text-white" disabled={isUploading}>
                  {isUploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : <><BrainCircuit className="w-5 h-5 mr-2" /> Process with AI</>}
                </Button>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Upload History</h2>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 max-h-96 overflow-y-auto">
              {loadingHistory ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin inline-block" /></div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {uploadHistory.length > 0 ? uploadHistory.map(upload => (
                    <li key={upload.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(upload.status)}
                        <div>
                          <p className="font-medium text-slate-800">{upload.file_name}</p>
                          <p className="text-xs text-slate-500">{new Date(upload.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-600 capitalize">{upload.status}</span>
                        {upload.status === 'completed' && <p className="text-xs text-green-600">{upload.leads_found} leads found</p>}
                      </div>
                    </li>
                  )) : (
                    <p className="p-8 text-center text-slate-500">No uploads yet. Drop a file to get started!</p>
                  )}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LeadUpload;