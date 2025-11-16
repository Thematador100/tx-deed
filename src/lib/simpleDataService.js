// Simple localStorage-based data service - no backend needed!
// This replaces Supabase database calls with simple browser storage

const STORAGE_KEYS = {
  PROPERTIES: 'app_properties',
  LEADS: 'app_leads',
  PIPELINE: 'app_pipeline',
  CALENDAR_EVENTS: 'app_calendar_events',
  API_KEYS: 'app_api_keys',
};

// Helper to get data from localStorage
const getData = (key, defaultValue = []) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return defaultValue;
  }
};

// Helper to save data to localStorage
const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return { data, error: null };
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return { data: null, error };
  }
};

// Initialize with sample data if empty
const initializeSampleData = () => {
  if (!getData(STORAGE_KEYS.PROPERTIES).length) {
    const sampleProperties = [
      {
        id: '1',
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        county: 'Travis',
        assessed_value: 250000,
        opening_bid: 50000,
        auction_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        property_type: 'Single Family',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        address: '456 Oak Ave',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        county: 'Dallas',
        assessed_value: 350000,
        opening_bid: 75000,
        auction_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        property_type: 'Condo',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        address: '789 Pine Rd',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        county: 'Harris',
        assessed_value: 180000,
        opening_bid: 35000,
        auction_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        property_type: 'Townhouse',
        created_at: new Date().toISOString(),
      },
    ];
    saveData(STORAGE_KEYS.PROPERTIES, sampleProperties);
  }
};

// Initialize sample data on load
initializeSampleData();

// Simple query builder (mimics Supabase API)
class SimpleQuery {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.selectedFields = null;
    this.orderBy = null;
    this.limitCount = null;
    this.isSingle = false;
  }

  select(fields = '*') {
    this.selectedFields = fields;
    return this;
  }

  eq(field, value) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  neq(field, value) {
    this.filters.push({ field, op: 'neq', value });
    return this;
  }

  gt(field, value) {
    this.filters.push({ field, op: 'gt', value });
    return this;
  }

  gte(field, value) {
    this.filters.push({ field, op: 'gte', value });
    return this;
  }

  lt(field, value) {
    this.filters.push({ field, op: 'lt', value });
    return this;
  }

  lte(field, value) {
    this.filters.push({ field, op: 'lte', value });
    return this;
  }

  like(field, pattern) {
    this.filters.push({ field, op: 'like', value: pattern });
    return this;
  }

  ilike(field, pattern) {
    this.filters.push({ field, op: 'ilike', value: pattern });
    return this;
  }

  in(field, values) {
    this.filters.push({ field, op: 'in', value: values });
    return this;
  }

  order(field, options = {}) {
    this.orderBy = { field, ascending: options.ascending !== false };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(resolve) {
    let data = getData(this.table, []);

    // Apply filters
    data = data.filter(item => {
      return this.filters.every(filter => {
        const fieldValue = item[filter.field];
        switch (filter.op) {
          case 'eq': return fieldValue === filter.value;
          case 'neq': return fieldValue !== filter.value;
          case 'gt': return fieldValue > filter.value;
          case 'gte': return fieldValue >= filter.value;
          case 'lt': return fieldValue < filter.value;
          case 'lte': return fieldValue <= filter.value;
          case 'like':
          case 'ilike': {
            const pattern = filter.value.replace(/%/g, '.*');
            const regex = new RegExp(pattern, filter.op === 'ilike' ? 'i' : '');
            return regex.test(String(fieldValue));
          }
          case 'in': return filter.value.includes(fieldValue);
          default: return true;
        }
      });
    });

    // Apply ordering
    if (this.orderBy) {
      data.sort((a, b) => {
        const aVal = a[this.orderBy.field];
        const bVal = b[this.orderBy.field];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.orderBy.ascending ? comparison : -comparison;
      });
    }

    // Apply limit
    if (this.limitCount) {
      data = data.slice(0, this.limitCount);
    }

    // Return single or array
    if (this.isSingle) {
      return resolve({ data: data[0] || null, error: null });
    }

    return resolve({ data, error: null });
  }
}

// Main data service object (mimics Supabase client)
export const simpleDB = {
  from: (table) => new SimpleQuery(STORAGE_KEYS[table.toUpperCase()] || `app_${table}`),

  // Direct insert
  insert: (table, records) => {
    const key = STORAGE_KEYS[table.toUpperCase()] || `app_${table}`;
    const data = getData(key, []);
    const newRecords = Array.isArray(records) ? records : [records];

    // Add IDs and timestamps
    newRecords.forEach(record => {
      if (!record.id) record.id = crypto.randomUUID();
      if (!record.created_at) record.created_at = new Date().toISOString();
    });

    data.push(...newRecords);
    return saveData(key, data);
  },

  // Direct update
  update: (table, id, updates) => {
    const key = STORAGE_KEYS[table.toUpperCase()] || `app_${table}`;
    const data = getData(key, []);
    const index = data.findIndex(item => item.id === id);

    if (index === -1) {
      return { data: null, error: { message: 'Record not found' } };
    }

    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
    saveData(key, data);
    return { data: data[index], error: null };
  },

  // Direct delete
  delete: (table, id) => {
    const key = STORAGE_KEYS[table.toUpperCase()] || `app_${table}`;
    const data = getData(key, []);
    const filtered = data.filter(item => item.id !== id);

    if (data.length === filtered.length) {
      return { data: null, error: { message: 'Record not found' } };
    }

    saveData(key, filtered);
    return { data: { id }, error: null };
  },
};

// Export for backward compatibility with Supabase imports
export const supabase = simpleDB;
