import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { CacheManager } from '../utils/cache-manager.js';

export class AIExtractionEngine {
  constructor(config = {}) {
    this.config = {
      provider: config.provider || 'anthropic', // 'anthropic' or 'openai'
      model: config.model || 'claude-3-5-sonnet-20241022',
      temperature: config.temperature || 0,
      maxTokens: config.maxTokens || 4096,
      cacheResults: config.cacheResults ?? true,
      ...config
    };

    // Initialize AI clients
    if (this.config.provider === 'anthropic') {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    } else if (this.config.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    this.cache = new CacheManager({ ttl: 3600 });
  }

  /**
   * Extract structured data from HTML content using AI
   */
  async extractStructuredData(html, schema, options = {}) {
    const cacheKey = this.generateCacheKey(html, schema);

    if (this.config.cacheResults) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        logger.debug('Returning cached extraction result');
        return cached;
      }
    }

    try {
      const prompt = this.buildExtractionPrompt(html, schema, options);
      const result = await this.callAI(prompt, options);
      const parsedData = this.parseAIResponse(result, schema);

      if (this.config.cacheResults) {
        await this.cache.set(cacheKey, parsedData);
      }

      return parsedData;
    } catch (error) {
      logger.error('AI extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract property/real estate data specifically
   */
  async extractPropertyData(html, url) {
    const schema = {
      property: {
        address: 'string',
        city: 'string',
        state: 'string',
        zipCode: 'string',
        county: 'string',
        parcelId: 'string',
        apn: 'string'
      },
      ownerInfo: {
        name: 'string',
        mailingAddress: 'string',
        ownershipType: 'string'
      },
      taxInfo: {
        assessedValue: 'number',
        taxAmount: 'number',
        taxYear: 'string',
        delinquentStatus: 'boolean',
        delinquentAmount: 'number',
        lastPaymentDate: 'string'
      },
      propertyDetails: {
        propertyType: 'string',
        yearBuilt: 'number',
        squareFootage: 'number',
        lotSize: 'number',
        bedrooms: 'number',
        bathrooms: 'number'
      },
      saleInfo: {
        lastSaleDate: 'string',
        lastSalePrice: 'number',
        estimatedValue: 'number'
      },
      legalInfo: {
        legalDescription: 'string',
        subdivision: 'string',
        block: 'string',
        lot: 'string'
      }
    };

    return this.extractStructuredData(html, schema, {
      context: `Extract property and tax deed information from this webpage: ${url}`,
      strictMode: false // Allow partial matches
    });
  }

  /**
   * Extract contact information from webpage
   */
  async extractContactInfo(html) {
    const schema = {
      contacts: [{
        name: 'string',
        email: 'string',
        phone: 'string',
        role: 'string',
        organization: 'string'
      }]
    };

    return this.extractStructuredData(html, schema, {
      context: 'Extract all contact information including names, emails, phone numbers, and roles',
      strictMode: false
    });
  }

  /**
   * Classify webpage content
   */
  async classifyPage(html, categories) {
    const prompt = `Analyze this HTML content and classify it into one or more of these categories: ${categories.join(', ')}

Return a JSON object with:
- primaryCategory: the main category
- categories: array of all applicable categories
- confidence: number 0-1 indicating confidence
- reasoning: brief explanation

HTML Content:
${this.truncateHtml(html, 8000)}`;

    const result = await this.callAI(prompt);
    return this.parseJSON(result);
  }

  /**
   * Extract entities (people, organizations, locations, etc.)
   */
  async extractEntities(text) {
    const prompt = `Extract named entities from this text. Return a JSON object with:
- people: array of person names
- organizations: array of organization names
- locations: array of location names
- dates: array of important dates
- amounts: array of monetary amounts or numbers
- properties: array of property addresses

Text:
${text.substring(0, 10000)}`;

    const result = await this.callAI(prompt);
    return this.parseJSON(result);
  }

  /**
   * Summarize webpage content
   */
  async summarize(html, maxLength = 200) {
    const prompt = `Summarize this webpage content in ${maxLength} words or less. Focus on key information, dates, amounts, and important details.

HTML Content:
${this.truncateHtml(html, 8000)}`;

    const result = await this.callAI(prompt);
    return result.trim();
  }

  /**
   * Determine if page requires authentication or has CAPTCHA
   */
  async detectBlockers(html) {
    const prompt = `Analyze this HTML and determine if there are any blockers preventing data access:
- Is there a login/authentication required?
- Is there a CAPTCHA present?
- Is there a rate limit or IP block message?
- Is there a paywall or subscription requirement?
- Are there any error messages?

Return JSON with: { hasLogin: boolean, hasCaptcha: boolean, hasRateLimit: boolean, hasPaywall: boolean, errorMessage: string|null, blockerType: string|null }

HTML:
${this.truncateHtml(html, 5000)}`;

    const result = await this.callAI(prompt);
    return this.parseJSON(result);
  }

  /**
   * Generate CSS selectors for extracting specific data
   */
  async generateSelectors(html, dataDescription) {
    const prompt = `Given this HTML, generate CSS selectors to extract: ${dataDescription}

Return a JSON object mapping field names to CSS selectors.

HTML:
${this.truncateHtml(html, 8000)}`;

    const result = await this.callAI(prompt);
    return this.parseJSON(result);
  }

  /**
   * Build extraction prompt from schema
   */
  buildExtractionPrompt(html, schema, options = {}) {
    const schemaStr = JSON.stringify(schema, null, 2);
    const truncatedHtml = this.truncateHtml(html, options.maxHtmlLength || 10000);

    return `Extract structured data from the following HTML content according to this schema:

${schemaStr}

${options.context ? `Context: ${options.context}\n` : ''}

Rules:
- Extract data that matches the schema structure
- Return valid JSON matching the exact schema structure
- Use null for missing values
- Ensure data types match the schema (string, number, boolean, array)
- ${options.strictMode ? 'All fields must be present' : 'Partial data is acceptable'}
- For arrays, extract all matching items
- Preserve data accuracy - don't invent information

HTML Content:
${truncatedHtml}

Return only the JSON object, no additional text.`;
  }

  /**
   * Call AI API
   */
  async callAI(prompt, options = {}) {
    if (this.config.provider === 'anthropic') {
      return this.callAnthropic(prompt, options);
    } else if (this.config.provider === 'openai') {
      return this.callOpenAI(prompt, options);
    }
    throw new Error(`Unknown AI provider: ${this.config.provider}`);
  }

  async callAnthropic(prompt, options = {}) {
    try {
      const response = await this.anthropic.messages.create({
        model: options.model || this.config.model,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return response.content[0].text;
    } catch (error) {
      logger.error('Anthropic API call failed:', error);
      throw error;
    }
  }

  async callOpenAI(prompt, options = {}) {
    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || this.config.model || 'gpt-4-turbo-preview',
        temperature: options.temperature ?? this.config.temperature,
        max_tokens: options.maxTokens || this.config.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }],
        response_format: options.jsonMode ? { type: 'json_object' } : undefined
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  /**
   * Parse AI response into structured data
   */
  parseAIResponse(response, schema) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return this.validateAgainstSchema(parsed, schema);
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      logger.debug('Response:', response);
      throw new Error(`Invalid AI response format: ${error.message}`);
    }
  }

  parseJSON(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('JSON parse error:', error);
      throw error;
    }
  }

  /**
   * Validate extracted data against schema
   */
  validateAgainstSchema(data, schema) {
    // Basic validation - can be enhanced with proper schema validation library
    if (typeof schema === 'object' && !Array.isArray(schema)) {
      const validated = {};
      for (const [key, type] of Object.entries(schema)) {
        if (typeof type === 'object') {
          validated[key] = this.validateAgainstSchema(data[key] || {}, type);
        } else {
          validated[key] = data[key] ?? null;
        }
      }
      return validated;
    }
    return data;
  }

  truncateHtml(html, maxLength) {
    if (html.length <= maxLength) return html;

    // Try to truncate at a tag boundary
    const truncated = html.substring(0, maxLength);
    const lastTag = truncated.lastIndexOf('<');
    return truncated.substring(0, lastTag) + '...';
  }

  generateCacheKey(html, schema) {
    const hash = require('crypto')
      .createHash('sha256')
      .update(html + JSON.stringify(schema))
      .digest('hex');
    return `extraction:${hash}`;
  }

  /**
   * Batch extract from multiple pages
   */
  async batchExtract(pages, schema, options = {}) {
    const concurrency = options.concurrency || 3;
    const results = [];

    for (let i = 0; i < pages.length; i += concurrency) {
      const batch = pages.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(page => this.extractStructuredData(page.html, schema, options))
      );

      results.push(...batchResults.map((result, idx) => ({
        url: batch[idx].url,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      })));
    }

    return results;
  }
}
