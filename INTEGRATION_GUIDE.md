# Frontend-Backend Integration Guide

This guide explains how to integrate the new scraping backend with the existing React frontend.

## 🔗 Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  React Frontend │ ◄─────► │  FastAPI Backend │ ◄─────► │  Tax Sale Sites │
│   (Vite/React)  │  HTTP   │   (Python/API)   │  Scrape │   (Multiple)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │   Database   │
                              │   (SQLite)   │
                              └──────────────┘
```

## 📋 Setup Instructions

### 1. Backend Setup

```bash
cd backend
bash setup.sh
```

This will:
- Create virtual environment
- Install dependencies
- Install Playwright browsers
- Initialize database
- Create configuration files

### 2. Configure API Keys (Optional)

Edit `backend/.env`:

```bash
# For AI-powered scraping (optional but recommended)
ANTHROPIC_API_KEY=your_claude_api_key_here
# OR
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start Backend Services

**Option A: Development Mode**
```bash
# Terminal 1: API Server
cd backend
source venv/bin/activate
python main.py

# Terminal 2: Scheduler (optional)
python scheduler.py
```

**Option B: Production Mode (Docker)**
```bash
cd backend
docker-compose up -d
```

The API will be available at: `http://localhost:8000`

### 4. Verify Backend

```bash
# Check health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

## 🔌 Frontend Integration

### Update API Configuration

Create `src/lib/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  // Get properties with filters
  async getProperties(filters = {}) {
    const params = new URLSearchParams();

    if (filters.state) params.append('state', filters.state);
    if (filters.county) params.append('county', filters.county);
    if (filters.min_bid) params.append('min_bid', filters.min_bid);
    if (filters.max_bid) params.append('max_bid', filters.max_bid);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const response = await fetch(`${API_BASE_URL}/api/properties?${params}`);
    return response.json();
  },

  // Get specific property
  async getProperty(id) {
    const response = await fetch(`${API_BASE_URL}/api/properties/${id}`);
    return response.json();
  },

  // Get upcoming auctions
  async getUpcomingAuctions(daysAhead = 30) {
    const response = await fetch(
      `${API_BASE_URL}/api/properties/upcoming/auctions?days_ahead=${daysAhead}`
    );
    return response.json();
  },

  // Search properties
  async searchProperties(query) {
    const response = await fetch(
      `${API_BASE_URL}/api/properties/search?q=${encodeURIComponent(query)}`
    );
    return response.json();
  },

  // Trigger scraping
  async scrapeSource(sourceType, params = {}) {
    const queryParams = new URLSearchParams({
      source_type: sourceType,
      ...params
    });

    const response = await fetch(
      `${API_BASE_URL}/api/scrape/source?${queryParams}`,
      { method: 'POST' }
    );
    return response.json();
  },

  // Scrape all sources
  async scrapeAll() {
    const response = await fetch(`${API_BASE_URL}/api/scrape/all`, {
      method: 'POST'
    });
    return response.json();
  },

  // Get sources
  async getSources() {
    const response = await fetch(`${API_BASE_URL}/api/sources`);
    return response.json();
  },

  // Get statistics
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    return response.json();
  }
};
```

### Update Environment Variables

Add to `.env` in frontend root:

```bash
VITE_API_URL=http://localhost:8000
```

### Replace Mock Data

Update `src/pages/TaxDelinquentLeads.jsx`:

```javascript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function TaxDelinquentLeads() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    state: 'TX',
    limit: 50
  });

  useEffect(() => {
    loadProperties();
  }, [filters]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await api.getProperties(filters);
      setProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    try {
      await api.scrapeAll();
      // Show success message
      setTimeout(loadProperties, 5000); // Reload after 5 seconds
    } catch (error) {
      console.error('Scraping failed:', error);
    }
  };

  // ... rest of component
}
```

### Add Scraping Control Panel

Create `src/components/ScrapingPanel.jsx`:

```javascript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Loader2, Download } from 'lucide-react';

export function ScrapingPanel() {
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState(null);

  const handleScrapeAll = async () => {
    setScraping(true);
    try {
      const result = await api.scrapeAll();
      console.log('Scraping started:', result);
      // Poll for completion or show notification
    } catch (error) {
      console.error('Scraping failed:', error);
    } finally {
      setScraping(false);
    }
  };

  const loadStats = async () => {
    const data = await api.getStats();
    setStats(data);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Data Management</h2>

      <div className="space-y-4">
        <Button
          onClick={handleScrapeAll}
          disabled={scraping}
          className="w-full"
        >
          {scraping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Scrape All Sources
            </>
          )}
        </Button>

        <Button
          onClick={loadStats}
          variant="outline"
          className="w-full"
        >
          Refresh Statistics
        </Button>

        {stats && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="font-semibold">Total Properties: {stats.total_properties}</p>
            <div className="mt-2">
              <p className="text-sm font-medium">By State:</p>
              <ul className="text-sm">
                {Object.entries(stats.by_state || {}).map(([state, count]) => (
                  <li key={state}>{state}: {count}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 🎨 Update Existing Components

### Properties Page

```javascript
// src/pages/Properties.jsx
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await api.getProperties({ limit: 100 });
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### Dashboard Integration

```javascript
// src/pages/Dashboard.jsx
import { ScrapingPanel } from '@/components/ScrapingPanel';
import { api } from '@/lib/api';

export default function Dashboard() {
  const [upcomingAuctions, setUpcomingAuctions] = useState([]);

  useEffect(() => {
    loadUpcomingAuctions();
  }, []);

  const loadUpcomingAuctions = async () => {
    const data = await api.getUpcomingAuctions(30);
    setUpcomingAuctions(data.slice(0, 5)); // Show top 5
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Existing dashboard widgets */}

      <div className="col-span-4">
        <ScrapingPanel />
      </div>
    </div>
  );
}
```

## 🔄 Data Synchronization

### Real-time Updates (Optional)

For real-time updates, consider adding WebSocket support:

```javascript
// src/lib/websocket.js
export function useScrapingStatus() {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
    };

    return () => ws.close();
  }, []);

  return status;
}
```

## 🧪 Testing Integration

### Test Backend Connection

```javascript
// Test in browser console
import { api } from './lib/api';

// Test connection
api.getStats().then(console.log);

// Test property fetch
api.getProperties({ state: 'TX', limit: 10 }).then(console.log);
```

### Integration Test Component

```javascript
// src/components/IntegrationTest.jsx
import { useState } from 'react';
import { api } from '@/lib/api';

export function IntegrationTest() {
  const [result, setResult] = useState(null);

  const runTest = async () => {
    try {
      const stats = await api.getStats();
      const properties = await api.getProperties({ limit: 5 });

      setResult({
        connected: true,
        stats,
        sampleProperties: properties
      });
    } catch (error) {
      setResult({
        connected: false,
        error: error.message
      });
    }
  };

  return (
    <div className="p-4 border rounded">
      <button onClick={runTest}>Test Backend Connection</button>
      {result && (
        <pre className="mt-4">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
```

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && python main.py

# Frontend
npm run dev
```

### Production

**Backend (Docker):**
```bash
cd backend
docker-compose up -d
```

**Frontend (Build):**
```bash
npm run build
# Deploy to hosting provider (Vercel, Netlify, etc.)
```

**Environment Variables:**
```bash
# Production .env
VITE_API_URL=https://your-api-domain.com
```

## 📊 Monitoring

Monitor scraping activity:

```bash
# View logs
tail -f backend/logs/app.log

# Check API status
curl http://localhost:8000/api/stats

# Database stats
python backend/cli.py stats
```

## 🔧 Troubleshooting

### CORS Issues
Update `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Connection Refused
- Ensure backend is running: `curl http://localhost:8000/health`
- Check VITE_API_URL matches backend port
- Verify firewall settings

### Empty Data
```bash
# Manually trigger scrape
python backend/cli.py scrape-all

# Check database
python backend/cli.py stats
```

## ✅ Checklist

- [ ] Backend installed and running
- [ ] Database initialized
- [ ] API accessible at http://localhost:8000
- [ ] Frontend can connect to backend
- [ ] Mock data replaced with API calls
- [ ] Scraping controls added to UI
- [ ] Error handling implemented
- [ ] Testing completed

## 📚 Additional Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Query](https://tanstack.com/query/latest) - Recommended for data fetching
- [SWR](https://swr.vercel.app/) - Alternative data fetching library

---

**Need help?** Check the backend README.md or API documentation at `/docs`
