-- Create storage buckets for file uploads
-- This migration creates the necessary storage buckets and RLS policies

-- Create lead-uploads bucket for property lead files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lead-uploads',
  'lead-uploads',
  false,
  52428800, -- 50MB
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Create documents bucket for OCR processing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Create library-docs bucket for document library
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'library-docs',
  'library-docs',
  true, -- Public for easy access
  52428800, -- 50MB
  ARRAY['application/pdf', 'text/plain', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for lead-uploads bucket

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload lead files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lead-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read their own lead files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lead-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own lead files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lead-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for documents bucket

-- Allow authenticated users to upload documents
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own documents
CREATE POLICY "Users can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for library-docs bucket (public read, authenticated write)

-- Allow authenticated users to upload library documents
CREATE POLICY "Users can upload library documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'library-docs');

-- Allow anyone to read library documents (public bucket)
CREATE POLICY "Anyone can read library documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'library-docs');

-- Allow users to delete their own library documents
CREATE POLICY "Users can delete their own library documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'library-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
