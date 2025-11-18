/**
 * Example API client for the scraping engine
 */

const API_BASE_URL = 'http://localhost:3001';

class ScrapingAPIClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Submit single scraping job
  async scrapeSingle(url, config = {}) {
    return this.request('/api/scrape/single', {
      method: 'POST',
      body: JSON.stringify({ url, config })
    });
  }

  // Submit multiple scraping jobs
  async scrapeMultiple(urls, config = {}) {
    return this.request('/api/scrape/multiple', {
      method: 'POST',
      body: JSON.stringify({ urls, config })
    });
  }

  // Submit sitemap scraping job
  async scrapeSitemap(sitemapUrl, config = {}) {
    return this.request('/api/scrape/sitemap', {
      method: 'POST',
      body: JSON.stringify({ sitemapUrl, config })
    });
  }

  // Extract property data
  async extractProperty(url, config = {}) {
    return this.request('/api/extract/property', {
      method: 'POST',
      body: JSON.stringify({ url, config })
    });
  }

  // Schedule recurring job
  async schedule(jobData, cronPattern, options = {}) {
    return this.request('/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ jobData, cronPattern, options })
    });
  }

  // Get job status
  async getJobStatus(jobId, queue = 'scraping') {
    return this.request(`/api/jobs/${jobId}?queue=${queue}`);
  }

  // Retry failed job
  async retryJob(jobId, queue = 'scraping') {
    return this.request(`/api/jobs/${jobId}/retry?queue=${queue}`, {
      method: 'POST'
    });
  }

  // Remove job
  async removeJob(jobId, queue = 'scraping') {
    return this.request(`/api/jobs/${jobId}?queue=${queue}`, {
      method: 'DELETE'
    });
  }

  // Get queue statistics
  async getQueueStats() {
    return this.request('/api/queues/stats');
  }

  // Get browser statistics
  async getBrowserStats() {
    return this.request('/api/browsers/stats');
  }

  // Get proxy statistics
  async getProxyStats() {
    return this.request('/api/proxies/stats');
  }

  // Query scraped data
  async queryData(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/data?${params}`);
  }

  // Get system statistics
  async getSystemStats() {
    return this.request('/api/stats');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Poll for job completion
  async waitForJob(jobId, options = {}) {
    const {
      queue = 'scraping',
      maxWait = 300000, // 5 minutes
      pollInterval = 2000
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const { job } = await this.getJobStatus(jobId, queue);

      if (job.state === 'completed') {
        return job.returnvalue;
      } else if (job.state === 'failed') {
        throw new Error(job.failedReason);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Job timeout');
  }
}

// Example usage
async function example() {
  const client = new ScrapingAPIClient();

  try {
    // Check health
    const health = await client.healthCheck();
    console.log('API Health:', health);

    // Submit scraping job
    const { jobId } = await client.scrapeSingle('https://example.com', {
      extractionMethod: 'ai',
      screenshot: true
    });

    console.log('Job submitted:', jobId);

    // Wait for completion
    const result = await client.waitForJob(jobId);
    console.log('Scraping result:', result);

    // Get statistics
    const stats = await client.getSystemStats();
    console.log('System stats:', stats);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  example();
}

export default ScrapingAPIClient;
