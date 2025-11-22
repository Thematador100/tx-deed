import { BaseAgent } from '../../shared/base-agent.js';
import { supabase } from '../../shared/supabase-client.js';

class NewsScraperAgent extends BaseAgent {
  constructor() {
    super('National News Scraper', 'News API Scraper');
    this.apiKey = process.env.NEWS_API_KEY;
    this.keywords = process.env.NEWS_KEYWORDS ? process.env.NEWS_KEYWORDS.split(',') : [
      'tax lien',
      'property foreclosure',
      'tax delinquent',
      'sheriff sale',
      'real estate auction'
    ];
  }

  async run() {
    await this.log('Starting news scraping run');

    try {
      for (const keyword of this.keywords) {
        await this.scrapeNews(keyword);
      }

      await this.updateStatus('Active');
      await this.log('News scraping run completed successfully');
    } catch (error) {
      await this.log(`Error during news scraping: ${error.message}`, 'error');
      await this.updateStatus('Error');
    }
  }

  async scrapeNews(keyword) {
    await this.log(`Searching news for: ${keyword}`);

    // In production, this would call NewsAPI.org or similar service
    // For now, we'll generate sample news items

    const articles = this.generateSampleArticles(keyword);

    for (const article of articles) {
      try {
        // Check if article already exists
        const { data: existing } = await supabase
          .from('news_articles')
          .select('id')
          .eq('url', article.url)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('news_articles')
            .insert({
              ...article,
              source: this.name,
              created_at: new Date().toISOString()
            });

          if (error && error.code !== '42P01') { // Ignore if table doesn't exist
            await this.log(`Error inserting article: ${error.message}`, 'error');
          } else if (!error) {
            await this.log(`New article added: ${article.title}`);
          }
        }
      } catch (err) {
        await this.log(`Error processing article: ${err.message}`, 'error');
      }
    }
  }

  generateSampleArticles(keyword) {
    const timestamp = Date.now();
    const count = Math.floor(Math.random() * 3) + 1;
    const articles = [];

    for (let i = 0; i < count; i++) {
      articles.push({
        title: `Breaking: ${keyword} news in major metro area ${i}`,
        url: `https://example.com/news/${keyword.replace(/\s+/g, '-')}-${timestamp}-${i}`,
        description: `Latest developments regarding ${keyword} in the real estate market`,
        keyword: keyword,
        published_at: new Date().toISOString(),
        relevance_score: Math.random() * 0.5 + 0.5
      });
    }

    return articles;
  }
}

// Start the agent
const agent = new NewsScraperAgent();
const intervalMinutes = parseInt(process.env.RUN_INTERVAL_MINUTES) || 180; // Every 3 hours

agent.start(intervalMinutes).catch(err => {
  console.error('Failed to start News Scraper Agent:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await agent.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await agent.stop();
  process.exit(0);
});
