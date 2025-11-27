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

    try {
      // Call the deal-dossier Edge Function
      const { data, error } = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deal-dossier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ address: propertyAddress })
      }).then(res => res.json());

      if (error) throw error;

      if (data && data.dossier) {
        setAnalysisResult({
          address: data.dossier.address,
          titleStatus: data.dossier.title_status,
          liens: data.dossier.liens || [],
          courtRecords: data.dossier.court_records || [],
          redFlags: data.dossier.red_flags || [],
          overallScore: data.dossier.overall_score,
          recommendation: data.dossier.recommendation,
          actionItems: data.dossier.action_items || [],
          riskLevel: data.dossier.risk_level || 'Medium',
          detailedAnalysis: data.dossier.detailed_analysis || data.dossier.recommendation,
          titleRecords: data.dossier.title_records || []
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult({
        address: propertyAddress,
        titleStatus: 'Error',
        liens: [],
        courtRecords: [],
        redFlags: ['Could not complete analysis. Please try again.'],
        overallScore: 0,
        recommendation: 'Analysis failed. Please verify the address and try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
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
                    <div className="flex items-center gap-3">
                      {analysisResult.riskLevel && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          analysisResult.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                          analysisResult.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {analysisResult.riskLevel} Risk
                        </span>
                      )}
                      <span className="text-2xl font-bold text-green-600">{analysisResult.overallScore}/100</span>
                    </div>
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

                  {/* AI Recommendation */}
                  <div className={`mt-6 p-4 rounded-lg border ${
                    analysisResult.overallScore >= 80 ? 'bg-green-50 border-green-200' :
                    analysisResult.overallScore >= 50 ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <p className={`font-medium ${
                      analysisResult.overallScore >= 80 ? 'text-green-800' :
                      analysisResult.overallScore >= 50 ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>AI Recommendation</p>
                    <p className={`text-sm mt-1 ${
                      analysisResult.overallScore >= 80 ? 'text-green-700' :
                      analysisResult.overallScore >= 50 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>{analysisResult.recommendation}</p>
                  </div>

                  {/* Action Items */}
                  {analysisResult.actionItems && analysisResult.actionItems.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium text-blue-800 mb-2">Action Items:</p>
                      <ul className="space-y-1">
                        {analysisResult.actionItems.map((item, idx) => (
                          <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Title Records */}
                  {analysisResult.titleRecords && analysisResult.titleRecords.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Title History ({analysisResult.titleRecords.length} records)</h3>
                      <div className="space-y-2">
                        {analysisResult.titleRecords.slice(0, 5).map((record, idx) => (
                          <div key={idx} className="bg-slate-50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-slate-900">{record.type}</span>
                                <span className="text-slate-500 ml-2">{new Date(record.date).toLocaleDateString()}</span>
                              </div>
                              {record.amount && (
                                <span className="font-semibold text-green-600">${record.amount.toLocaleString()}</span>
                              )}
                            </div>
                            {record.grantor && record.grantee && (
                              <p className="text-slate-600 mt-1">{record.grantor} → {record.grantee}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Liens Detail */}
                  {analysisResult.liens && analysisResult.liens.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Liens Detail ({analysisResult.liens.length} liens)</h3>
                      <div className="space-y-2">
                        {analysisResult.liens.map((lien, idx) => (
                          <div key={idx} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-yellow-900">{lien.type}</span>
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                  lien.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {lien.status}
                                </span>
                              </div>
                              <span className="font-semibold text-yellow-900">${lien.amount.toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">
                              Filed: {new Date(lien.filed_date).toLocaleDateString()}
                              {lien.creditor && ` • ${lien.creditor}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Court Records Detail */}
                  {analysisResult.courtRecords && analysisResult.courtRecords.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Court Records ({analysisResult.courtRecords.length} cases)</h3>
                      <div className="space-y-2">
                        {analysisResult.courtRecords.map((record, idx) => (
                          <div key={idx} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-purple-900">{record.case_type}</span>
                                <span className="text-sm text-purple-600 ml-2">#{record.case_number}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                record.status === 'Active' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {record.status}
                              </span>
                            </div>
                            <p className="text-sm text-purple-700 mt-1">
                              Filed: {new Date(record.filed_date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Red Flags */}
                  {analysisResult.redFlags && analysisResult.redFlags.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="font-medium text-red-800 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        Red Flags Identified:
                      </p>
                      <ul className="space-y-1">
                        {analysisResult.redFlags.map((flag, idx) => (
                          <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">⚠</span>
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
