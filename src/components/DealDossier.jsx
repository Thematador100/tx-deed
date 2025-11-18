import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, BrainCircuit, FileText, UploadCloud, CheckCircle, AlertTriangle, FileUp, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { retryEdgeFunction } from '@/lib/utils';

const DossierSection = ({ title, content, icon }) => (
  <div className="bg-slate-100 p-4 rounded-lg">
    <div className="flex items-center mb-2">
      {icon}
      <h4 className="font-semibold text-slate-800">{title}</h4>
    </div>
    <p className="text-sm text-slate-600">{content}</p>
  </div>
);

const DealDossier = ({ property }) => {
  const { user } = useAuth();
  const [dossier, setDossier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))]);
    setOcrResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    multiple: false,
  });

  const handleGenerateDossier = async () => {
    setIsLoading(true);
    setError(null);
    setDossier(null);

    try {
      const { data, error: functionError } = await retryEdgeFunction(
        supabase,
        'generate-dossier',
        { body: JSON.stringify({ address: property.address }) },
        {
          onRetry: ({ attempt }) => {
            console.log(`Retrying dossier generation (attempt ${attempt})...`);
          }
        }
      );

      if (functionError) throw functionError;

      if (data.error) {
        throw new Error(data.error);
      }

      setDossier(data);
      toast({ title: "Dossier Generated!", description: "AI analysis complete. Check the results below.", className: "bg-green-100 text-green-800" });
    } catch (err) {
      console.error("Error generating dossier:", err);
      let errorMessage = "Failed to generate AI dossier. Please ensure your API keys are correctly configured in the Admin section.";
      if (err.message.includes('openai')) {
        errorMessage = "OpenAI API key is missing or invalid. Please configure it in the Admin API Vault.";
      } else if (err.message.includes('smarty')) {
        errorMessage = "Smarty API key is missing or invalid. Please configure it in the Admin API Vault.";
      }
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOcrUpload = async () => {
    if (files.length === 0) {
      toast({ title: "No file selected", description: "Please drop a file to analyze.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    setOcrResult(null);
    toast({ title: "Uploading & Analyzing Document...", description: "Our AI is reading your document. This may take a moment." });

    const file = files[0];
    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    try {
      // 1. Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('lead-uploads')
        .upload(filePath, file);

      if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);

      // 2. Invoke the OCR function with retry
      const { data, error: functionError } = await retryEdgeFunction(
        supabase,
        'analyze-document-ocr',
        { body: { filePath } },
        {
          onRetry: ({ attempt }) => {
            console.log(`Retrying document OCR (attempt ${attempt})...`);
          }
        }
      );

      if (functionError) throw functionError;

      if (data.error) {
        // If there's a specific error from the function (like API key missing), show it
        throw new Error(data.error);
      }
      
      setOcrResult(data.text);
      toast({ title: "Document Analysis Complete!", description: "AI has summarized the document.", className: "bg-green-100 text-green-800" });

    } catch (err) {
      console.error("Error processing OCR:", err);
      let description = "Could not analyze the document.";
      // Check for a missing API key message from the backend function
      if (err.message.includes('API key for google-doc-ai not found')) {
        description = "Google Document AI key not configured. Running simulation instead.";
        // Fallback to simulation
        const simulatedText = `(SIMULATED RESULT) This is a simulated OCR result for ${file.name}. It appears to be a standard title commitment document for ${property.address}. Key findings include a utility easement and standard property tax exceptions. Add your Google Doc AI key to get live results.`;
        setOcrResult(simulatedText);
      } else {
         description = err.message;
      }
      toast({ title: "OCR Error", description, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mt-8">
      <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
        <BrainCircuit className="w-7 h-7 mr-3 text-purple-600" />
        AI Due Diligence
      </h3>
      
      {!dossier && !isLoading && !error && (
        <div className="text-center py-8">
          <p className="text-slate-600 mb-4">Generate a comprehensive due diligence report using your configured APIs.</p>
          <Button onClick={handleGenerateDossier} size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
            <BrainCircuit className="w-5 h-5 mr-2" />
            Generate Deal Dossier
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
          <p className="mt-4 text-slate-600 font-semibold">Contacting AI services... <br/> This may take up to 30 seconds.</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm">{error}</p>
          <Button onClick={handleGenerateDossier} variant="outline" className="mt-4">Try Again</Button>
        </div>
      )}

      <AnimatePresence>
        {dossier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DossierSection title="Title Report Summary" content={dossier.title_report_summary} icon={<FileText className="w-5 h-5 mr-2 text-blue-600" />} />
              <DossierSection title="Lien Check Summary" content={dossier.lien_check_summary} icon={<AlertTriangle className="w-5 h-5 mr-2 text-red-600" />} />
              <DossierSection title="Court Records Summary" content={dossier.court_records_summary} icon={<FileText className="w-5 h-5 mr-2 text-green-600" />} />
              <DossierSection title="Address & Flood Status" content={dossier.flood_status} icon={<CheckCircle className="w-5 h-5 mr-2 text-teal-600" />} />
            </div>
            <Button onClick={() => setDossier(null)} variant="outline" className="w-full mt-4">Generate New Report</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
          <KeyRound className="w-5 h-5 mr-2 text-slate-500" />
          OCR Document Analysis
        </h4>
        <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-slate-300 bg-white hover:border-purple-400'}`}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">Drop a PDF or Image file here</p>
            <p className="text-xs text-slate-500 mt-1">e.g., Title Report, Survey, Lien Document</p>
          </div>
        </div>
        {files.length > 0 && (
          <div className="mt-4">
            <ul className="space-y-2">
              {files.map(file => (
                <li key={file.path} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border">
                  <span className="text-sm font-medium">{file.path}</span>
                  <Button variant="ghost" size="sm" onClick={() => { setFiles([]); setOcrResult(null); }}>Remove</Button>
                </li>
              ))}
            </ul>
            <Button onClick={handleOcrUpload} className="w-full mt-3" disabled={isUploading}>
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
              Analyze Document with AI
            </Button>
          </div>
        )}
        <AnimatePresence>
        {ocrResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg"
          >
            <h5 className="font-bold text-blue-800 mb-2">AI Document Summary:</h5>
            <p className="text-sm text-blue-700 whitespace-pre-wrap">{ocrResult}</p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DealDossier;