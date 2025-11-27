-- Create lead_uploads table to track uploaded property lead files
-- This table stores metadata about uploaded CSV/Excel/PDF files containing property leads

CREATE TABLE IF NOT EXISTS lead_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK (file_format IN ('csv', 'xlsx', 'xls', 'pdf')),
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  leads_found INTEGER DEFAULT 0,
  properties_imported INTEGER DEFAULT 0,
  error_message TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries by user
CREATE INDEX idx_lead_uploads_user_id ON lead_uploads(user_id);

-- Add index for status filtering
CREATE INDEX idx_lead_uploads_status ON lead_uploads(status);

-- Add index for created_at for sorting
CREATE INDEX idx_lead_uploads_created_at ON lead_uploads(created_at DESC);

-- Enable RLS
ALTER TABLE lead_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own uploads
CREATE POLICY "Users can view their own lead uploads"
  ON lead_uploads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own uploads
CREATE POLICY "Users can insert their own lead uploads"
  ON lead_uploads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own uploads
CREATE POLICY "Users can update their own lead uploads"
  ON lead_uploads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own uploads
CREATE POLICY "Users can delete their own lead uploads"
  ON lead_uploads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_lead_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_lead_uploads_updated_at
  BEFORE UPDATE ON lead_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_uploads_updated_at();
