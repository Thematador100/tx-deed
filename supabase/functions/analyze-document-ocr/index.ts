// Deno Deploy Edge Function for OCR document analysis
// This function processes uploaded documents (PDFs, images) using Google Document AI
// and extracts property-related information

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeDocumentRequest {
  fileUrl: string;
  fileName: string;
  fileType: string;
  propertyId?: string;
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

    const { fileUrl, fileName, fileType, propertyId }: AnalyzeDocumentRequest = await req.json();

    if (!fileUrl || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fileUrl, fileName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the file from the provided URL
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    const base64File = btoa(String.fromCharCode(...fileBytes));

    // Check if Google Document AI is configured
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
    const processorId = Deno.env.get('GOOGLE_DOCUMENT_AI_PROCESSOR_ID');
    const apiKey = Deno.env.get('GOOGLE_DOCUMENT_AI_API_KEY');

    let ocrText = '';
    let extractedData: any = {};
    let confidenceScore = 0;

    if (projectId && processorId && apiKey) {
      // Call Google Document AI
      const documentAiUrl = `https://documentai.googleapis.com/v1/projects/${projectId}/locations/us/processors/${processorId}:process`;

      const documentAiResponse = await fetch(documentAiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          rawDocument: {
            content: base64File,
            mimeType: fileType || 'application/pdf',
          },
        }),
      });

      if (documentAiResponse.ok) {
        const result = await documentAiResponse.json();
        const document = result.document;

        ocrText = document.text || '';
        confidenceScore = document.pages?.[0]?.blocks?.[0]?.layout?.confidence || 0;

        // Extract property-related data using regex patterns
        extractedData = extractPropertyData(ocrText);
      } else {
        const errorText = await documentAiResponse.text();
        console.error('Document AI error:', errorText);
        // Continue without OCR if it fails
      }
    } else {
      // Use simple text extraction for PDFs or mock OCR
      console.log('Google Document AI not configured, using mock extraction');
      ocrText = `Document: ${fileName}\nType: ${fileType}\n\n[OCR text would appear here with Google Document AI configured]`;
      extractedData = { source: 'mock', note: 'Configure Google Document AI for real OCR' };
    }

    // Save to document_library
    const { data: document, error: insertError } = await supabaseClient
      .from('document_library')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_type: fileType,
        storage_path: fileUrl,
        ocr_status: apiKey ? 'completed' : 'mock',
        ocr_text: ocrText,
        extracted_data: extractedData,
        property_data: extractedData,
        confidence_score: confidenceScore,
        processed_at: new Date().toISOString(),
        property_id: propertyId || null,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // If property_id provided, create link in property_documents table
    if (propertyId && document) {
      await supabaseClient.from('property_documents').insert({
        property_id: propertyId,
        document_id: document.id,
        relationship_type: 'uploaded',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        document,
        ocrText: ocrText.substring(0, 500), // Return first 500 chars
        extractedData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-document-ocr:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Extract property-related data from OCR text
function extractPropertyData(text: string): any {
  const data: any = {};

  // Extract addresses (basic pattern)
  const addressPattern = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Circle|Cir|Place|Pl)[,\s]+[\w\s]+,\s*[A-Z]{2}\s*\d{5}/gi;
  const addresses = text.match(addressPattern);
  if (addresses && addresses.length > 0) {
    data.addresses = addresses.map(addr => addr.trim());
  }

  // Extract parcel numbers
  const parcelPattern = /(?:Parcel|Account|Tax ID)[:\s#]*([A-Z0-9\-]+)/gi;
  const parcels = text.match(parcelPattern);
  if (parcels && parcels.length > 0) {
    data.parcel_numbers = parcels.map(p => p.replace(/(?:Parcel|Account|Tax ID)[:\s#]*/i, '').trim());
  }

  // Extract dollar amounts
  const amountPattern = /\$[\d,]+(?:\.\d{2})?/g;
  const amounts = text.match(amountPattern);
  if (amounts && amounts.length > 0) {
    data.amounts = amounts.map(a => a.trim());
  }

  // Extract dates
  const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}/g;
  const dates = text.match(datePattern);
  if (dates && dates.length > 0) {
    data.dates = dates.map(d => d.trim());
  }

  // Extract names (basic pattern - capitalized words)
  const namePattern = /(?:Owner|Plaintiff|Defendant|Trustee)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
  const names = text.match(namePattern);
  if (names && names.length > 0) {
    data.names = names.map(n => n.replace(/(?:Owner|Plaintiff|Defendant|Trustee)[:\s]+/i, '').trim());
  }

  return data;
}
