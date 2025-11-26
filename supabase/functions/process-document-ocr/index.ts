// Google Document AI OCR Processing Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentData {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get document ID from request
    const { document_id } = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: 'document_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch document from database
    const { data: document, error: docError } = await supabaseClient
      .from('document_library')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabaseClient
      .from('document_library')
      .update({ ocr_status: 'processing' })
      .eq('id', document_id);

    // Get Google Document AI API key from api_keys table
    const { data: apiKeyData } = await supabaseClient
      .from('api_keys')
      .select('api_key')
      .eq('service_name', 'google_doc_ai')
      .single();

    const googleDocAIKey = apiKeyData?.api_key || Deno.env.get('GOOGLE_DOC_AI_API_KEY');

    if (!googleDocAIKey) {
      throw new Error('Google Document AI API key not configured');
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Call Google Document AI API
    // Project ID and Processor ID should be configured
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID') || 'your-project-id';
    const location = 'us'; // or 'eu'
    const processorId = Deno.env.get('GOOGLE_DOC_AI_PROCESSOR_ID') || 'your-processor-id';

    const endpoint = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;

    const docAIResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleDocAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawDocument: {
          content: base64Content,
          mimeType: document.file_type || 'application/pdf',
        },
      }),
    });

    if (!docAIResponse.ok) {
      const errorText = await docAIResponse.text();
      throw new Error(`Document AI API error: ${errorText}`);
    }

    const docAIResult = await docAIResponse.json();

    // Extract text and entities
    const ocrText = docAIResult.document?.text || '';
    const entities = docAIResult.document?.entities || [];
    const pages = docAIResult.document?.pages || [];

    // Calculate confidence score
    const confidenceScore = pages.length > 0
      ? pages.reduce((sum: number, page: any) => sum + (page.pageConfidence || 0), 0) / pages.length * 100
      : 0;

    // Extract property-related data using AI
    const propertyData = await extractPropertyData(ocrText, entities);

    // Update document in database with OCR results
    const { error: updateError } = await supabaseClient
      .from('document_library')
      .update({
        ocr_status: 'completed',
        ocr_text: ocrText,
        extracted_data: {
          entities: entities.map((e: any) => ({
            type: e.type,
            text: e.mentionText,
            confidence: e.confidence,
          })),
          page_count: pages.length,
        },
        property_data: propertyData,
        page_count: pages.length,
        confidence_score: confidenceScore,
        processed_at: new Date().toISOString(),
      })
      .eq('id', document_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        ocr_text: ocrText.substring(0, 500), // Return preview
        page_count: pages.length,
        confidence_score: confidenceScore,
        property_data: propertyData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);

    // Update document status to failed
    if (req.json && (await req.json()).document_id) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseClient
        .from('document_library')
        .update({
          ocr_status: 'failed',
          error_message: error.message,
        })
        .eq('id', (await req.json()).document_id);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to extract property data from OCR text using AI
async function extractPropertyData(text: string, entities: any[]): Promise<any> {
  // Extract common property-related fields
  const propertyData: any = {};

  // Use regex to find common patterns
  const addressPattern = /(\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Circle|Cir|Way|Place|Pl))/gi;
  const parcelPattern = /(?:Parcel|APN|Tax ID|Property ID)[\s:]+([A-Z0-9-]+)/gi;
  const amountPattern = /\$\s?([\d,]+\.?\d*)/g;
  const datePattern = /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g;

  // Extract addresses
  const addresses = text.match(addressPattern);
  if (addresses && addresses.length > 0) {
    propertyData.addresses = addresses.slice(0, 5); // First 5 addresses
  }

  // Extract parcel numbers
  const parcels: string[] = [];
  let parcelMatch;
  while ((parcelMatch = parcelPattern.exec(text)) !== null) {
    parcels.push(parcelMatch[1]);
  }
  if (parcels.length > 0) {
    propertyData.parcel_numbers = parcels;
  }

  // Extract amounts (could be tax amounts, sale prices, etc.)
  const amounts: string[] = [];
  let amountMatch;
  while ((amountMatch = amountPattern.exec(text)) !== null) {
    amounts.push(amountMatch[1]);
  }
  if (amounts.length > 0) {
    propertyData.amounts = amounts.slice(0, 10);
  }

  // Extract dates
  const dates: string[] = [];
  let dateMatch;
  while ((dateMatch = datePattern.exec(text)) !== null) {
    dates.push(dateMatch[1]);
  }
  if (dates.length > 0) {
    propertyData.dates = dates.slice(0, 10);
  }

  // Extract named entities
  const namedEntities = entities.filter((e: any) =>
    ['PERSON', 'ORGANIZATION', 'ADDRESS', 'DATE', 'MONEY'].includes(e.type)
  );
  if (namedEntities.length > 0) {
    propertyData.named_entities = namedEntities;
  }

  // Look for tax deed specific keywords
  const keywords = [
    'tax deed',
    'tax lien',
    'foreclosure',
    'auction',
    'redemption',
    'delinquent',
    'certificate',
    'sheriff sale',
    'trustee sale',
  ];

  const foundKeywords = keywords.filter(keyword =>
    text.toLowerCase().includes(keyword)
  );

  if (foundKeywords.length > 0) {
    propertyData.document_type = foundKeywords[0];
    propertyData.keywords = foundKeywords;
  }

  return propertyData;
}
