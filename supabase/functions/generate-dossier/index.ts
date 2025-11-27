// Deno Deploy Edge Function for generating AI-powered property dossiers
// This function creates comprehensive due diligence reports for tax deed properties

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateDossierRequest {
  propertyId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { propertyId }: GenerateDossierRequest = await req.json();

    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: propertyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch property details
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single();

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ error: 'Property not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch related documents
    const { data: documents } = await supabaseClient
      .from('document_library')
      .select('*')
      .eq('property_id', propertyId)
      .eq('user_id', user.id);

    // Fetch property documents via junction table
    const { data: linkedDocs } = await supabaseClient
      .from('property_documents')
      .select('document_id, document_library(*)')
      .eq('property_id', propertyId);

    // Combine all documents
    const allDocuments = [
      ...(documents || []),
      ...(linkedDocs?.map(ld => ld.document_library).filter(Boolean) || []),
    ];

    // Generate dossier content
    const dossier = {
      propertyId: property.id,
      generatedAt: new Date().toISOString(),
      property: {
        address: property.address,
        parcelId: property.parcel_id,
        county: property.county,
        status: property.status,
        listingType: property.listing_type,
      },
      valuation: {
        assessedValue: property.assessed_value,
        marketValue: property.market_value,
        openingBid: property.opening_bid,
        estimatedValue: property.estimated_value,
      },
      auction: {
        auctionDate: property.auction_date,
        auctionTime: property.auction_time,
        auctionLocation: property.auction_location,
        caseNumber: property.case_number,
      },
      liens: {
        totalLiens: property.liens || 0,
        lienDetails: property.lien_details || [],
      },
      documents: {
        count: allDocuments.length,
        types: allDocuments.map(doc => ({
          fileName: doc.file_name,
          fileType: doc.file_type,
          processedAt: doc.processed_at,
          ocrStatus: doc.ocr_status,
        })),
      },
      analysis: generateAnalysis(property, allDocuments),
      risks: assessRisks(property, allDocuments),
      opportunities: identifyOpportunities(property),
      recommendations: generateRecommendations(property, allDocuments),
    };

    // Check if Anthropic API is configured for AI enhancement
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (anthropicApiKey) {
      // Enhance dossier with AI analysis
      const aiAnalysis = await generateAIAnalysis(property, allDocuments, anthropicApiKey);
      dossier.analysis.aiInsights = aiAnalysis;
    }

    return new Response(
      JSON.stringify({
        success: true,
        dossier,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-dossier:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Generate analysis section
function generateAnalysis(property: any, documents: any[]): any {
  const analysis = {
    propertyOverview: `${property.address} is a ${property.listing_type || 'tax deed'} property in ${property.county} County.`,
    valuationAnalysis: '',
    documentAnalysis: '',
  };

  // Valuation analysis
  if (property.assessed_value && property.opening_bid) {
    const discount = ((property.assessed_value - property.opening_bid) / property.assessed_value) * 100;
    analysis.valuationAnalysis = `Opening bid of $${property.opening_bid.toLocaleString()} represents a ${discount.toFixed(1)}% discount from assessed value of $${property.assessed_value.toLocaleString()}.`;
  }

  // Document analysis
  const ocrCompleted = documents.filter(d => d.ocr_status === 'completed').length;
  analysis.documentAnalysis = `${documents.length} document(s) attached. ${ocrCompleted} processed with OCR.`;

  return analysis;
}

// Assess risks
function assessRisks(property: any, documents: any[]): any[] {
  const risks = [];

  // Lien risk
  if (property.liens && property.liens > 0) {
    risks.push({
      level: 'high',
      category: 'liens',
      description: `Property has ${property.liens} lien(s). Review lien details for survivability after auction.`,
    });
  }

  // Missing documents risk
  if (documents.length === 0) {
    risks.push({
      level: 'medium',
      category: 'documentation',
      description: 'No supporting documents uploaded. Consider obtaining tax records, title report, and property records.',
    });
  }

  // Auction timing risk
  if (property.auction_date) {
    const auctionDate = new Date(property.auction_date);
    const today = new Date();
    const daysUntil = Math.ceil((auctionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 7 && daysUntil > 0) {
      risks.push({
        level: 'medium',
        category: 'timing',
        description: `Auction in ${daysUntil} day(s). Limited time for due diligence.`,
      });
    }
  }

  return risks;
}

// Identify opportunities
function identifyOpportunities(property: any): any[] {
  const opportunities = [];

  // Value opportunity
  if (property.assessed_value && property.opening_bid) {
    const discount = ((property.assessed_value - property.opening_bid) / property.assessed_value) * 100;
    if (discount > 50) {
      opportunities.push({
        category: 'valuation',
        description: `Strong value opportunity with ${discount.toFixed(1)}% discount to assessed value.`,
      });
    }
  }

  // Low competition if no bids
  if (property.total_bids === 0) {
    opportunities.push({
      category: 'competition',
      description: 'No bids yet. Potential for acquiring at opening bid.',
    });
  }

  return opportunities;
}

// Generate recommendations
function generateRecommendations(property: any, documents: any[]): string[] {
  const recommendations = [];

  // Title research
  recommendations.push('Conduct comprehensive title search to identify all liens and encumbrances.');

  // Property inspection
  recommendations.push('Schedule property inspection to assess condition and repair needs.');

  // Document gathering
  if (documents.length < 3) {
    recommendations.push('Obtain additional documents: tax records, deed history, and property appraisal.');
  }

  // Financial analysis
  if (property.assessed_value) {
    recommendations.push('Verify assessed value with recent comparable sales in the area.');
  }

  // Legal review
  if (property.liens && property.liens > 0) {
    recommendations.push('Consult with real estate attorney regarding lien survivability after tax deed sale.');
  }

  return recommendations;
}

// Generate AI-powered analysis using Anthropic Claude
async function generateAIAnalysis(property: any, documents: any[], apiKey: string): Promise<string> {
  try {
    const prompt = `Analyze this tax deed property and provide investment insights:

Property: ${property.address}
County: ${property.county}
Assessed Value: $${property.assessed_value?.toLocaleString() || 'N/A'}
Opening Bid: $${property.opening_bid?.toLocaleString() || 'N/A'}
Liens: ${property.liens || 0}
Auction Date: ${property.auction_date || 'Not scheduled'}

Documents: ${documents.length} document(s) available
${documents.map(d => `- ${d.file_name} (${d.ocr_status})`).join('\n')}

Provide a brief analysis covering:
1. Investment potential (2-3 sentences)
2. Key risks to investigate (2-3 bullet points)
3. Recommended next steps (2-3 bullet points)

Keep response concise and actionable.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.content[0].text;
    } else {
      console.error('Anthropic API error:', await response.text());
      return 'AI analysis unavailable. Configure ANTHROPIC_API_KEY environment variable.';
    }
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return 'Error generating AI analysis.';
  }
}
