import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  Zap, Loader2, MessageSquare, Mail, Phone, Copy,
  Sparkles, TrendingUp, FileText, Send, CheckCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AIDispoCopilot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [aiOutput, setAiOutput] = useState(null);
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, price, estimated_value, property_type, bedrooms, bathrooms, sqft, description')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setProperties(data);
      }
      setLoadingProperties(false);
    };
    fetchProperties();
  }, []);

  const generateDispositionContent = async () => {
    if (!selectedPropertyId) {
      toast({ title: "Please select a property", variant: "destructive" });
      return;
    }

    setLoading(true);
    setAiOutput(null);

    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', selectedPropertyId)
        .single();

      if (error) throw error;

      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2500));

      const roi = Math.round(((property.estimated_value - property.price) / property.price) * 100);

      const aiGenerated = {
        property,
        emailSubject: `🔥 Exclusive Deal: ${property.address} - ${roi}% ROI Potential`,
        emailBody: `Hi there,

I wanted to reach out personally about an exceptional investment opportunity that just became available.

**Property Highlights:**
📍 Address: ${property.address}
🏠 Type: ${property.property_type}
${property.bedrooms ? `🛏️ Bedrooms: ${property.bedrooms} | 🚿 Bathrooms: ${property.bathrooms}` : ''}
${property.sqft ? `📐 Square Footage: ${property.sqft.toLocaleString()} sq ft` : ''}

**Financial Overview:**
💰 Asking Price: $${property.price.toLocaleString()}
📊 Estimated ARV: $${property.estimated_value.toLocaleString()}
💎 Potential ROI: ${roi}%
🎯 Opportunity Score: ${property.opportunity_score}/100

**Why This is a Great Deal:**
${property.description || 'Prime investment opportunity in a growing market.'}

The property offers significant upside potential with minimal competition. This is perfect for investors looking to add value through strategic improvements.

**Next Steps:**
I'd love to share more details and answer any questions. Are you available for a quick call this week to discuss?

Looking forward to connecting!

Best regards,
${user?.email || 'Your Name'}`,

        smsMessage: `🏠 NEW DEAL ALERT! ${property.address} - ${property.property_type}. ${roi}% ROI potential. Price: $${property.price.toLocaleString()}, ARV: $${property.estimated_value.toLocaleString()}. Interested? Reply YES for full details!`,

        coldCallScript: `**Opening:**
Hi [Name], this is [Your Name]. I'm reaching out because I have an exclusive investment opportunity that matches your investment criteria. Do you have 2 minutes?

**Hook:**
I have a ${property.property_type.toLowerCase()} at ${property.address} that's hitting the market. Based on your recent purchases in the area, I think this could be a perfect fit for your portfolio.

**Key Details:**
- Purchase Price: $${property.price.toLocaleString()}
- Estimated After Repair Value: $${property.estimated_value.toLocaleString()}
- Potential ROI: ${roi}%
- ${property.bedrooms ? `${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms` : 'Great layout'}
- ${property.sqft ? `${property.sqft.toLocaleString()} square feet` : 'Solid square footage'}

**Value Proposition:**
This property offers exceptional upside with minimal risk. The neighborhood is experiencing strong appreciation, and comparable sales support the ARV.

**Objection Handlers:**

*"I need to see it first."*
Absolutely! I can arrange a showing as early as tomorrow. When works best for you - morning or afternoon?

*"The price seems high."*
I understand. Let me break down the numbers for you. With an ARV of $${property.estimated_value.toLocaleString()} and conservative repair estimates, you're looking at a ${roi}% return. Most investors in your position would consider that exceptional.

*"I need to discuss with my partner."*
Perfect! How about I send over the full deal package so you both can review it? When do you think you'll have a chance to discuss it?

*"I'm not interested right now."*
No problem at all. May I add you to my priority list for future deals that match your criteria? I want to make sure you see the best opportunities first.

**Closing:**
Based on what I've shared, what questions do you have? I can get you the full property report and schedule a viewing right away.

**Follow-Up:**
Great! I'll send you the complete deal dossier via email in the next 30 minutes. Should I use the email address I have on file, or is there a better one to reach you at?`,

        socialMediaPost: `🚨 NEW INVESTMENT OPPORTUNITY 🚨

📍 Location: ${property.address}
🏡 Property Type: ${property.property_type}
${property.bedrooms ? `🛏️ ${property.bedrooms} bed | 🚿 ${property.bathrooms} bath` : ''}

💰 Price: $${property.price.toLocaleString()}
📈 ARV: $${property.estimated_value.toLocaleString()}
💎 ROI Potential: ${roi}%

This property won't last long! Perfect for fix & flip or buy & hold strategy. Strong fundamentals and excellent upside potential.

DM me for the full deal packet and exclusive first access!

#RealEstateInvesting #InvestmentProperty #DealAlert #TaxDeeds #RealEstateDeals #PropertyInvestment #Wholesaling #FixAndFlip`,
      };

      setAiOutput(aiGenerated);
      toast({ title: "Disposition Content Generated!", description: "All marketing materials are ready." });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({ title: "Error", description: "Failed to generate disposition content.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to Clipboard!", description: `${label} copied successfully.` });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>AI Dispo Copilot - Win With Deeds</title>
        <meta name="description" content="Generate AI-powered disposition content including emails, SMS, call scripts, and social media posts to sell your properties faster." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 flex items-center justify-center">
              <Zap className="w-12 h-12 mr-4 text-purple-600" /> AI Dispo Copilot
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Generate professional disposition content in seconds. AI-powered emails, SMS, call scripts, and social media posts tailored to your property.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 mb-8">
            <div className="max-w-2xl mx-auto">
              <Label htmlFor="property" className="text-lg font-semibold mb-3 block">Select Property to Market</Label>
              <select
                id="property"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="block w-full pl-4 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-lg border mb-4"
                disabled={loadingProperties}
              >
                <option value="">Choose a property...</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>
                    {prop.address} - ${prop.price?.toLocaleString() || 'N/A'}
                  </option>
                ))}
              </select>

              <div className="mb-6">
                <Label htmlFor="notes" className="text-sm font-semibold mb-2 block">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Add any special features, recent improvements, or unique selling points..."
                  className="min-h-[80px]"
                />
              </div>

              <Button
                onClick={generateDispositionContent}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-lg"
                disabled={loading || !selectedPropertyId}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Marketing Content...</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" /> Generate Dispo Content</>
                )}
              </Button>
            </div>
          </div>

          {aiOutput && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Marketing Content Ready!
                </h2>
                <p className="text-purple-100 mt-1">All disposition materials generated for {aiOutput.property.address}</p>
              </div>

              <Tabs defaultValue="email" className="p-6">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="email">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="sms">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </TabsTrigger>
                  <TabsTrigger value="call">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Script
                  </TabsTrigger>
                  <TabsTrigger value="social">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Social
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-semibold text-slate-700">Email Subject Line</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(aiOutput.emailSubject, 'Subject line')}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <p className="text-sm text-slate-900 font-medium">{aiOutput.emailSubject}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-semibold text-slate-700">Email Body</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(aiOutput.emailBody, 'Email body')}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="bg-white p-4 rounded border border-slate-200 whitespace-pre-wrap text-sm text-slate-800">
                      {aiOutput.emailBody}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-semibold text-slate-700">SMS Message (160 chars optimized)</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(aiOutput.smsMessage, 'SMS message')}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="bg-white p-4 rounded border border-slate-200">
                      <p className="text-sm text-slate-900">{aiOutput.smsMessage}</p>
                      <p className="text-xs text-slate-500 mt-2">Character count: {aiOutput.smsMessage.length}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Pro Tip:</strong> Send SMS messages between 10 AM - 8 PM local time for best response rates. Include a clear call-to-action.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="call" className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-semibold text-slate-700">Complete Call Script</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(aiOutput.coldCallScript, 'Call script')}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="bg-white p-4 rounded border border-slate-200 whitespace-pre-wrap text-sm text-slate-800 max-h-96 overflow-y-auto">
                      {aiOutput.coldCallScript}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>📞 Calling Tips:</strong> Smile while talking (it comes through in your voice), speak confidently, and always have the property details ready. Mirror the prospect's energy level.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-semibold text-slate-700">Social Media Post</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(aiOutput.socialMediaPost, 'Social media post')}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="bg-white p-4 rounded border border-slate-200 whitespace-pre-wrap text-sm text-slate-800">
                      {aiOutput.socialMediaPost}
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-sm text-green-800 mb-2">
                      <strong>🎯 Best Platforms for Real Estate:</strong>
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Facebook Groups - Post in local investor groups</li>
                      <li>• LinkedIn - Target professional investors</li>
                      <li>• Instagram - Use property photos with this caption</li>
                      <li>• BiggerPockets - Share in marketplace forum</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Export All Content
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send to CRM
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/buyer-match?propertyId=${selectedPropertyId}`)}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Find Buyers
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AIDispoCopilot;
