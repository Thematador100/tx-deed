import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  Table,
  FileSpreadsheet,
  Brain,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const AdminSmartImport = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [classification, setClassification] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files[0] || e.target.files[0];

    if (!droppedFile) return;

    setFile(droppedFile);
    await analyzeFile(droppedFile);
  };

  const analyzeFile = async (file) => {
    setAnalyzing(true);
    setClassification(null);

    try {
      // Read file content
      let fileData;
      const fileType = getFileType(file.name);

      if (fileType === 'csv' || fileType === 'text') {
        fileData = await file.text();
      } else if (fileType === 'excel') {
        // Would use a library like xlsx to parse
        fileData = await file.arrayBuffer();
        toast({
          title: 'Excel Support Coming Soon',
          description: 'For now, please convert to CSV',
        });
        setAnalyzing(false);
        return;
      } else if (fileType === 'pdf') {
        toast({
          title: 'PDF Support Coming Soon',
          description: 'For now, please copy-paste the text',
        });
        setAnalyzing(false);
        return;
      }

      // Call AI classifier function
      const { data, error } = await supabase.functions.invoke('ai-classifier', {
        body: {
          data: fileData,
          dataType: fileType,
          filename: file.name
        }
      });

      if (error) throw error;

      setClassification(data.classification);

      toast({
        title: '✨ Analysis Complete!',
        description: `Detected: ${data.classification.classification}`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!classification) return;

    setImporting(true);

    try {
      // Parse file based on classification
      const records = await parseFileForImport(file, classification);

      // Import to appropriate table
      const tableName = classification.table_name;

      const { error } = await supabase
        .from(tableName)
        .insert(records);

      if (error) throw error;

      toast({
        title: '✅ Import Successful!',
        description: `Imported ${records.length} records to ${tableName}`,
      });

      // Reset form
      setFile(null);
      setClassification(null);
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'csv') return 'csv';
    if (ext === 'txt') return 'text';
    if (ext === 'xls' || ext === 'xlsx') return 'excel';
    if (ext === 'pdf') return 'pdf';
    return 'unknown';
  };

  const parseFileForImport = async (file, classification) => {
    // Simple CSV parsing (would use proper library in production)
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',');
      const record = {};

      headers.forEach((header, index) => {
        record[header] = values[index]?.trim();
      });

      records.push(record);
    }

    return records;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Helmet>
        <title>Smart Import - Admin - Win With Deeds</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🤖 Smart Import Wizard
          </h1>
          <p className="text-slate-600">
            Drop any file - AI will figure out what it is and where it goes
          </p>
        </div>

        {/* Upload Area */}
        {!file && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center bg-white hover:border-purple-500 transition-colors cursor-pointer"
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <Upload className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Drop your file here
            </h2>
            <p className="text-slate-600 mb-6">
              or click to browse
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Table className="w-4 h-4" />
                CSV
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileText className="w-4 h-4" />
                Text/PDF
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 inline-block">
              <div className="flex items-center gap-2 text-purple-700">
                <Brain className="w-5 h-5" />
                <span className="font-medium">AI-Powered Classification</span>
              </div>
              <p className="text-sm text-purple-600 mt-1">
                Platform automatically detects data type and destination
              </p>
            </div>

            <input
              id="fileInput"
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls,.txt,.pdf"
              onChange={handleFileDrop}
            />
          </motion.div>
        )}

        {/* Analysis Results */}
        {file && analyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Analyzing with AI...
            </h2>
            <p className="text-slate-600">
              {file.name}
            </p>
          </motion.div>
        )}

        {/* Classification Results */}
        {file && !analyzing && classification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-2xl font-bold">AI Analysis Complete</h2>
              </div>
              <p className="text-purple-100">{file.name}</p>
            </div>

            {/* Results */}
            <div className="p-6 space-y-6">
              {/* Classification */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-slate-900">Detected Data Type</h3>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900 mb-1">
                    {classification.classification}
                  </div>
                  <div className="text-sm text-green-700">
                    Confidence: {Math.round(classification.confidence * 100)}%
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-slate-900">Import Destination</h3>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-lg font-bold text-purple-900 mb-1">
                    {classification.table_name}
                  </div>
                  <div className="text-sm text-purple-700">
                    {classification.record_count} records detected
                  </div>
                </div>
              </div>

              {/* Fields */}
              {classification.extracted_fields && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">Detected Fields</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(classification.extracted_fields).map(([key, value]) => (
                      <div key={key} className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">{key}:</span>{' '}
                        <span className="text-slate-600">{String(value).substring(0, 50)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {classification.warnings && classification.warnings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <h3 className="font-bold text-slate-900">Warnings</h3>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1 text-sm text-orange-900">
                      {classification.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Suggested Action */}
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Suggested Action</h3>
                <p className="text-slate-700">{classification.suggested_action}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirm Import
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setFile(null);
                    setClassification(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminSmartImport;
