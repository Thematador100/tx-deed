// Simple localStorage-based backend - no external dependencies!
// This replaces Supabase with a simple in-browser data store

import { simpleDB } from './simpleDataService';

// Export the simple database as 'supabase' for backward compatibility
export const supabase = simpleDB;