import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { ShieldCheck, FileText, AlertTriangle, CheckCircle, Search, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DealDossier() {
  const [propertyAddress, setPropertyAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalyze = async () => {
    if (!propertyAddress.trim()) return;
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysisResult({
        address: propertyAddress,
        titleStatus: 'Clear',
        liens: [],
        courtRecords: [],
        redFlags: [],
        overallScore: 92,
        recommendation: 'This property appears to be a solid investment opportunity with clear title and no significant issues found.'
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>AI Deal Dossier - Win With Deeds</title>
        <meta name="description" content="Get instant, comprehensive due diligence reports with AI-powered analysis" />
      </Helmet>
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-6">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">AI Deal Dossier</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get instant, comprehensive due diligence reports. Our AI summarizes title information, 
              checks for liens, analyzes court records, and flags potential red flags.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Property Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter property address (e.g., 123 Main St, Houston, TX 77001)"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAnalyze} disabled={isAnalyzing || !propertyAddress.trim()}>
                  {isAnalyzing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    'Generate Dossier'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {analysisResult && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Analysis Results</span>
                    <span className="text-2xl font-bold text-green-600">{analysisResult.overallScore}/100</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">Title Status</p>
                          <p className="text-sm text-slate-600">{analysisResult.titleStatus}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Liens Found</p>
                          <p className="text-sm text-slate-600">{analysisResult.liens.length || 'None'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Court Records</p>
                          <p className="text-sm text-slate-600">{analysisResult.courtRecords.length || 'None found'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Red Flags</p>
                          <p className="text-sm text-slate-600">{analysisResult.redFlags.length || 'None identified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800">AI Recommendation</p>
                    <p className="text-sm text-green-700 mt-1">{analysisResult.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Title Search</h3>
                <p className="text-sm text-slate-600">Comprehensive title history and ownership chain verification</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Lien Detection</h3>
                <p className="text-sm text-slate-600">Automated scanning for tax liens, mechanic's liens, and judgments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Risk Assessment</h3>
                <p className="text-sm text-slate-600">AI-powered risk scoring with clear investment recommendations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
