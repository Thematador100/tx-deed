-- API Keys Infrastructure for TX-Deed
-- This creates the necessary table and function for the Admin API Key Vault

-- 1. Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL UNIQUE,
  encrypted_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys(service_name);

-- 2. Create function to get API key status (returns which services have keys configured)
CREATE OR REPLACE FUNCTION get_api_key_status()
RETURNS TABLE (
  id UUID,
  service_name TEXT,
  key_present BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.id,
    ak.service_name,
    (ak.encrypted_api_key IS NOT NULL AND ak.encrypted_api_key != '') AS key_present,
    ak.updated_at
  FROM api_keys ak
  ORDER BY ak.service_name;
END;
$$;

-- 3. Pre-populate with expected services (optional - makes UI cleaner)
INSERT INTO api_keys (service_name, encrypted_api_key) VALUES
  ('openai', NULL),
  ('google-ai', NULL),
  ('google-doc-ai', NULL),
  ('google-maps', NULL),
  ('deepseek', NULL),
  ('grok', NULL),
  ('smarty', NULL)
ON CONFLICT (service_name) DO NOTHING;

-- 4. Create function to get decrypted API key (for backend use)
CREATE OR REPLACE FUNCTION get_api_key(p_service_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key TEXT;
BEGIN
  SELECT encrypted_api_key INTO v_key
  FROM api_keys
  WHERE service_name = p_service_name;

  RETURN v_key;
END;
$$;

-- 5. Create function to set/update API key
CREATE OR REPLACE FUNCTION set_api_key(p_service_name TEXT, p_api_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO api_keys (service_name, encrypted_api_key, updated_at)
  VALUES (p_service_name, p_api_key, NOW())
  ON CONFLICT (service_name)
  DO UPDATE SET
    encrypted_api_key = p_api_key,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- 6. Create function to delete API key
CREATE OR REPLACE FUNCTION delete_api_key(p_service_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE api_keys
  SET encrypted_api_key = NULL, updated_at = NOW()
  WHERE service_name = p_service_name;

  RETURN TRUE;
END;
$$;

-- Grant permissions (adjust as needed for your security model)
-- These allow authenticated users to access the functions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION get_api_key_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_api_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_api_key(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_api_key(TEXT) TO authenticated;
