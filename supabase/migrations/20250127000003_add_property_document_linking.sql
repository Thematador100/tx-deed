-- Add property linking to document_library table
-- This allows documents to be associated with specific properties

-- Add property_id column to document_library
ALTER TABLE document_library
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

-- Add index for faster queries by property
CREATE INDEX IF NOT EXISTS idx_document_library_property_id ON document_library(property_id);

-- Add index for faster queries by user + property
CREATE INDEX IF NOT EXISTS idx_document_library_user_property ON document_library(user_id, property_id);

-- Create a many-to-many junction table for documents that relate to multiple properties
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES document_library(id) ON DELETE CASCADE,
  relationship_type TEXT, -- e.g., 'deed', 'lien', 'tax_record', 'appraisal'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, document_id)
);

-- Add indexes for junction table
CREATE INDEX idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX idx_property_documents_document_id ON property_documents(document_id);

-- Enable RLS on junction table
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_documents
-- Users can view links for their own properties
CREATE POLICY "Users can view property document links"
  ON property_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_documents.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Users can create links for their own properties
CREATE POLICY "Users can create property document links"
  ON property_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_documents.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Users can delete links for their own properties
CREATE POLICY "Users can delete property document links"
  ON property_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_documents.property_id
      AND properties.user_id = auth.uid()
    )
  );
