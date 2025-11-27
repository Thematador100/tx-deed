# Document Upload Functionality - Deployment Guide

This guide will help you deploy all the document upload features for tax deed properties.

## What Was Built

✅ **Storage Buckets** - Three storage buckets for file uploads
✅ **Database Tables** - `lead_uploads` and `property_documents` tables
✅ **Property-Document Linking** - Many-to-many relationship support
✅ **Edge Functions** - 3 new serverless functions for processing uploads
✅ **Real File Upload** - CSV/Excel parsing with actual file storage
✅ **OCR Support** - Document analysis with Google Document AI

---

## Deployment Steps

### Step 1: Deploy Database Migrations

Run these migrations in order:

```bash
# If you have Supabase CLI installed:
supabase db push

# OR apply them manually via Supabase Dashboard SQL Editor:
# 1. Go to https://app.supabase.com
# 2. Select your project
# 3. Go to SQL Editor
# 4. Copy and paste each migration file below:
```

**Migrations to run:**

1. `supabase/migrations/20250127000001_create_storage_buckets.sql`
   - Creates `lead-uploads`, `documents`, and `library-docs` storage buckets
   - Sets up RLS policies for file access

2. `supabase/migrations/20250127000002_create_lead_uploads_table.sql`
   - Creates `lead_uploads` table to track uploaded files
   - Adds indexes and RLS policies

3. `supabase/migrations/20250127000003_add_property_document_linking.sql`
   - Adds `property_id` column to `document_library` table
   - Creates `property_documents` junction table for many-to-many relationships

**Verify migrations:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('lead_uploads', 'property_documents', 'document_library');

-- Check if storage buckets exist
SELECT * FROM storage.buckets
WHERE id IN ('lead-uploads', 'documents', 'library-docs');
```

---

### Step 2: Deploy Edge Functions

Deploy the following Edge Functions:

```bash
# If you have Supabase CLI installed:
supabase functions deploy process-lead-upload
supabase functions deploy analyze-document-ocr
supabase functions deploy generate-dossier
supabase functions deploy process-document-ocr

# OR deploy via Supabase Dashboard:
# 1. Go to Edge Functions in your Supabase Dashboard
# 2. Click "Deploy new function"
# 3. Copy the code from each function's index.ts file
```

**Edge Functions:**

1. **process-lead-upload** (`supabase/functions/process-lead-upload/index.ts`)
   - Parses CSV/Excel files
   - Normalizes property data
   - Imports properties to database
   - Supports field mapping from various data sources

2. **analyze-document-ocr** (`supabase/functions/analyze-document-ocr/index.ts`)
   - Processes uploaded PDFs and images
   - Uses Google Document AI for OCR
   - Extracts property-related data
   - Links documents to properties

3. **generate-dossier** (`supabase/functions/generate-dossier/index.ts`)
   - Generates AI-powered property analysis
   - Creates due diligence reports
   - Assesses risks and opportunities
   - Optional: Uses Anthropic Claude for enhanced insights

4. **process-document-ocr** (`supabase/functions/process-document-ocr/index.ts`)
   - Existing function (already created, needs deployment)

---

### Step 3: Configure Environment Variables (Optional)

For enhanced functionality, set these environment variables in your Supabase project:

**Google Document AI (for OCR):**
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=your-processor-id
GOOGLE_DOCUMENT_AI_API_KEY=your-api-key
```

**Anthropic Claude (for AI analysis):**
```bash
ANTHROPIC_API_KEY=your-anthropic-api-key
```

To set environment variables:
```bash
# Using Supabase CLI:
supabase secrets set GOOGLE_CLOUD_PROJECT_ID=your-project-id
supabase secrets set ANTHROPIC_API_KEY=your-key

# OR via Supabase Dashboard:
# Settings → Edge Functions → Add secret
```

---

## How It Works

### Lead Upload Flow

1. **User uploads CSV/Excel file** → LeadUpload.jsx
2. **File uploaded to storage** → `lead-uploads` bucket
3. **Upload record created** → `lead_uploads` table
4. **Edge Function processes file** → `process-lead-upload`
5. **Properties imported** → `properties` table
6. **User sees results** → Upload history updated

### Document Upload Flow

1. **User uploads PDF/image** → DealDossier.jsx
2. **File uploaded to storage** → `lead-uploads` bucket
3. **Edge Function processes** → `analyze-document-ocr`
4. **OCR extracts data** → Google Document AI
5. **Document saved** → `document_library` table
6. **Linked to property** → `property_documents` table

### Deal Dossier Generation

1. **User requests dossier** → DealDossier.jsx
2. **Edge Function fetches data** → `generate-dossier`
3. **AI analyzes property** → Anthropic Claude (optional)
4. **Report generated** → Risks, opportunities, recommendations

---

## Testing

### Test Lead Upload

1. Navigate to `/lead-upload` page
2. Create a test CSV file:

```csv
address,parcel_id,county,opening_bid,assessed_value,auction_date
123 Main St, Houston, TX,12-34-567,Harris,50000,150000,2025-12-15
456 Oak Ave, Houston, TX,89-01-234,Harris,75000,200000,2025-12-20
```

3. Upload the file
4. Check `lead_uploads` table for status
5. Check `properties` table for imported records

### Test Document Upload

1. Go to a property detail page
2. Click "Upload Document" in Deal Dossier section
3. Upload a PDF or image
4. Verify file appears in `document_library` table
5. Check OCR results (if Google Document AI configured)

### Test Dossier Generation

1. On property detail page, click "Generate Dossier"
2. Verify comprehensive report is generated
3. Check for AI insights (if Anthropic configured)

---

## Troubleshooting

### Storage Upload Fails

**Error:** "new row violates row-level security policy"
- **Fix:** Ensure storage bucket RLS policies are applied from migration #1

**Error:** "Bucket not found"
- **Fix:** Run migration #1 to create storage buckets

### Lead Upload Processing Fails

**Error:** "relation 'lead_uploads' does not exist"
- **Fix:** Run migration #2 to create `lead_uploads` table

**Error:** "Failed to parse file"
- **Fix:** Ensure CSV/Excel file has proper formatting and headers

### Document OCR Fails

**Error:** "Document AI error"
- **Fix:** Configure Google Document AI environment variables
- **Workaround:** OCR will use mock mode without configuration

---

## Field Mapping for CSV/Excel Uploads

The `process-lead-upload` Edge Function supports these field mappings:

| Database Field | Possible CSV Headers |
|---------------|---------------------|
| address | address, property_address, street_address, site_address |
| parcel_id | parcel_id, parcel, apn, parcel_number |
| county | county |
| opening_bid | opening_bid, minimum_bid, starting_bid |
| assessed_value | assessed_value, assessed_val, tax_assessed_value |
| market_value | market_value, estimated_value, market_val |
| auction_date | auction_date, sale_date |
| auction_time | auction_time, sale_time |
| bedrooms | bedrooms, beds |
| bathrooms | bathrooms, baths |
| sqft | sqft, square_feet, living_area |

**Note:** Field mapping is case-insensitive and flexible to work with data from:
- Regrid
- BatchLeads
- PropWire
- Custom CSV exports

---

## What's Next

After deployment, you can:

1. ✅ Upload property lists from any source
2. ✅ Store and OCR process documents
3. ✅ Link documents to properties
4. ✅ Generate AI-powered due diligence reports
5. ✅ Track all uploads and processing status

---

## Files Modified/Created

**New Migrations:**
- `supabase/migrations/20250127000001_create_storage_buckets.sql`
- `supabase/migrations/20250127000002_create_lead_uploads_table.sql`
- `supabase/migrations/20250127000003_add_property_document_linking.sql`

**New Edge Functions:**
- `supabase/functions/process-lead-upload/index.ts`
- `supabase/functions/analyze-document-ocr/index.ts`
- `supabase/functions/generate-dossier/index.ts`

**Modified Files:**
- `src/pages/LeadUpload.jsx` - Replaced mock upload with real file processing

---

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs
2. Check Edge Function logs: Dashboard → Edge Functions → Logs
3. Verify all migrations are applied
4. Ensure environment variables are set correctly

**Common Issues:**
- RLS policies not applied → Re-run migrations
- Edge Functions not found → Deploy functions
- CSV parsing errors → Check file format and headers
