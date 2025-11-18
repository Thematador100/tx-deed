import { PrismaClient } from '@prisma/client';
import { MongoClient } from 'mongodb';
import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { nanoid } from 'nanoid';

const { Pool } = pg;

export class DataPipeline {
  constructor(config = {}) {
    this.config = {
      storage: config.storage || 'json', // 'json', 'postgres', 'mongodb', 'prisma'
      dataDir: config.dataDir || './data',
      batchSize: config.batchSize || 100,
      autoFlush: config.autoFlush ?? true,
      flushInterval: config.flushInterval || 5000,
      ...config
    };

    this.buffer = [];
    this.initializeStorage();

    if (this.config.autoFlush) {
      this.startAutoFlush();
    }
  }

  async initializeStorage() {
    switch (this.config.storage) {
      case 'postgres':
        this.pgPool = new Pool({
          host: process.env.POSTGRES_HOST || 'localhost',
          port: process.env.POSTGRES_PORT || 5432,
          database: process.env.POSTGRES_DB || 'scraping',
          user: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD,
          max: 20,
          ...this.config.postgres
        });
        await this.initializePostgres();
        break;

      case 'mongodb':
        this.mongoClient = new MongoClient(
          process.env.MONGODB_URI || 'mongodb://localhost:27017',
          this.config.mongodb
        );
        await this.mongoClient.connect();
        this.mongodb = this.mongoClient.db(process.env.MONGODB_DB || 'scraping');
        logger.info('Connected to MongoDB');
        break;

      case 'prisma':
        this.prisma = new PrismaClient();
        await this.prisma.$connect();
        logger.info('Connected to Prisma');
        break;

      case 'json':
      default:
        await fs.mkdir(this.config.dataDir, { recursive: true });
        logger.info(`Using JSON file storage in ${this.config.dataDir}`);
        break;
    }
  }

  async initializePostgres() {
    // Create tables if they don't exist
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS scraping_results (
        id VARCHAR(21) PRIMARY KEY,
        url TEXT NOT NULL,
        original_url TEXT,
        data JSONB,
        metadata JSONB,
        screenshot TEXT,
        success BOOLEAN DEFAULT true,
        error TEXT,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        collection VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS idx_scraping_results_url ON scraping_results(url);
      CREATE INDEX IF NOT EXISTS idx_scraping_results_collection ON scraping_results(collection);
      CREATE INDEX IF NOT EXISTS idx_scraping_results_scraped_at ON scraping_results(scraped_at);
      CREATE INDEX IF NOT EXISTS idx_scraping_results_data ON scraping_results USING GIN(data);

      CREATE TABLE IF NOT EXISTS property_data (
        id VARCHAR(21) PRIMARY KEY,
        scraping_result_id VARCHAR(21) REFERENCES scraping_results(id),
        address TEXT,
        city VARCHAR(255),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        county VARCHAR(255),
        parcel_id VARCHAR(255),
        apn VARCHAR(255),
        owner_name TEXT,
        owner_mailing_address TEXT,
        assessed_value DECIMAL(12, 2),
        tax_amount DECIMAL(12, 2),
        tax_year VARCHAR(4),
        delinquent_status BOOLEAN,
        delinquent_amount DECIMAL(12, 2),
        property_type VARCHAR(100),
        year_built INTEGER,
        square_footage INTEGER,
        lot_size DECIMAL(12, 2),
        bedrooms INTEGER,
        bathrooms DECIMAL(3, 1),
        last_sale_date DATE,
        last_sale_price DECIMAL(12, 2),
        estimated_value DECIMAL(12, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_property_data_address ON property_data(address);
      CREATE INDEX IF NOT EXISTS idx_property_data_parcel_id ON property_data(parcel_id);
      CREATE INDEX IF NOT EXISTS idx_property_data_delinquent ON property_data(delinquent_status);
    `;

    await this.pgPool.query(createTablesSQL);
    logger.info('PostgreSQL tables initialized');
  }

  /**
   * Save single result
   */
  async save(data, collection = 'default') {
    if (this.config.autoFlush) {
      this.buffer.push({ data, collection });

      if (this.buffer.length >= this.config.batchSize) {
        await this.flush();
      }
    } else {
      await this.saveOne(data, collection);
    }
  }

  /**
   * Save one item directly
   */
  async saveOne(data, collection = 'default') {
    const id = nanoid();
    const record = { id, ...data, collection };

    try {
      switch (this.config.storage) {
        case 'postgres':
          await this.saveToPostgres(record);
          break;

        case 'mongodb':
          await this.saveToMongo(record, collection);
          break;

        case 'prisma':
          await this.saveToPrisma(record);
          break;

        case 'json':
        default:
          await this.saveToJson(record, collection);
          break;
      }

      logger.debug(`Saved record ${id} to ${collection}`);
      return id;
    } catch (error) {
      logger.error(`Failed to save record to ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Flush buffered data
   */
  async flush() {
    if (this.buffer.length === 0) return;

    const items = [...this.buffer];
    this.buffer = [];

    logger.info(`Flushing ${items.length} buffered items`);

    try {
      switch (this.config.storage) {
        case 'postgres':
          await this.bulkSaveToPostgres(items);
          break;

        case 'mongodb':
          await this.bulkSaveToMongo(items);
          break;

        case 'prisma':
          await this.bulkSaveToPrisma(items);
          break;

        case 'json':
        default:
          await Promise.all(items.map(({ data, collection }) =>
            this.saveToJson({ id: nanoid(), ...data }, collection)
          ));
          break;
      }

      logger.info(`Successfully flushed ${items.length} items`);
    } catch (error) {
      logger.error('Failed to flush buffer:', error);
      // Re-add items to buffer for retry
      this.buffer.unshift(...items);
      throw error;
    }
  }

  async saveToPostgres(record) {
    const query = `
      INSERT INTO scraping_results (
        id, url, original_url, data, metadata, screenshot,
        success, error, scraped_at, collection
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const values = [
      record.id,
      record.url,
      record.originalUrl,
      JSON.stringify(record.data),
      JSON.stringify(record.metadata),
      record.screenshot,
      record.success,
      record.error,
      record.scrapedAt,
      record.collection
    ];

    await this.pgPool.query(query, values);

    // If property data, save to property_data table
    if (record.data?.property) {
      await this.savePropertyData(record.id, record.data);
    }
  }

  async bulkSaveToPostgres(items) {
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      for (const { data, collection } of items) {
        const record = { id: nanoid(), ...data, collection };
        await this.saveToPostgres(record);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async savePropertyData(scrapingResultId, data) {
    const prop = data.property || {};
    const owner = data.ownerInfo || {};
    const tax = data.taxInfo || {};
    const details = data.propertyDetails || {};
    const sale = data.saleInfo || {};

    const query = `
      INSERT INTO property_data (
        id, scraping_result_id, address, city, state, zip_code, county,
        parcel_id, apn, owner_name, owner_mailing_address,
        assessed_value, tax_amount, tax_year, delinquent_status, delinquent_amount,
        property_type, year_built, square_footage, lot_size, bedrooms, bathrooms,
        last_sale_date, last_sale_price, estimated_value
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25
      )
    `;

    const values = [
      nanoid(),
      scrapingResultId,
      prop.address,
      prop.city,
      prop.state,
      prop.zipCode,
      prop.county,
      prop.parcelId,
      prop.apn,
      owner.name,
      owner.mailingAddress,
      tax.assessedValue,
      tax.taxAmount,
      tax.taxYear,
      tax.delinquentStatus,
      tax.delinquentAmount,
      details.propertyType,
      details.yearBuilt,
      details.squareFootage,
      details.lotSize,
      details.bedrooms,
      details.bathrooms,
      sale.lastSaleDate,
      sale.lastSalePrice,
      sale.estimatedValue
    ];

    await this.pgPool.query(query, values);
  }

  async saveToMongo(record, collection) {
    const coll = this.mongodb.collection(collection);
    await coll.insertOne(record);
  }

  async bulkSaveToMongo(items) {
    const grouped = {};

    // Group by collection
    for (const { data, collection } of items) {
      if (!grouped[collection]) {
        grouped[collection] = [];
      }
      grouped[collection].push({ id: nanoid(), ...data });
    }

    // Bulk insert per collection
    for (const [collection, records] of Object.entries(grouped)) {
      const coll = this.mongodb.collection(collection);
      await coll.insertMany(records);
    }
  }

  async saveToPrisma(record) {
    await this.prisma.scrapingResult.create({
      data: {
        id: record.id,
        url: record.url,
        originalUrl: record.originalUrl,
        data: record.data,
        metadata: record.metadata,
        screenshot: record.screenshot,
        success: record.success,
        error: record.error,
        scrapedAt: new Date(record.scrapedAt),
        collection: record.collection
      }
    });
  }

  async bulkSaveToPrisma(items) {
    const records = items.map(({ data, collection }) => ({
      id: nanoid(),
      url: data.url,
      originalUrl: data.originalUrl,
      data: data.data,
      metadata: data.metadata,
      screenshot: data.screenshot,
      success: data.success,
      error: data.error,
      scrapedAt: new Date(data.scrapedAt),
      collection
    }));

    await this.prisma.scrapingResult.createMany({
      data: records
    });
  }

  async saveToJson(record, collection) {
    const collectionDir = path.join(this.config.dataDir, collection);
    await fs.mkdir(collectionDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${timestamp}_${record.id}.json`;
    const filepath = path.join(collectionDir, filename);

    await fs.writeFile(filepath, JSON.stringify(record, null, 2));
  }

  /**
   * Query results
   */
  async query(filters = {}, options = {}) {
    const {
      collection = 'default',
      limit = 100,
      offset = 0,
      sortBy = 'scraped_at',
      sortOrder = 'DESC'
    } = options;

    switch (this.config.storage) {
      case 'postgres':
        return this.queryPostgres(filters, options);

      case 'mongodb':
        return this.queryMongo(collection, filters, options);

      case 'prisma':
        return this.queryPrisma(filters, options);

      case 'json':
      default:
        return this.queryJson(collection, filters, options);
    }
  }

  async queryPostgres(filters, options) {
    let query = 'SELECT * FROM scraping_results WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.collection) {
      query += ` AND collection = $${paramCount++}`;
      values.push(filters.collection);
    }

    if (filters.success !== undefined) {
      query += ` AND success = $${paramCount++}`;
      values.push(filters.success);
    }

    if (filters.url) {
      query += ` AND url LIKE $${paramCount++}`;
      values.push(`%${filters.url}%`);
    }

    query += ` ORDER BY ${options.sortBy || 'scraped_at'} ${options.sortOrder || 'DESC'}`;
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(options.limit || 100, options.offset || 0);

    const result = await this.pgPool.query(query, values);
    return result.rows;
  }

  async queryMongo(collection, filters, options) {
    const coll = this.mongodb.collection(collection);

    return coll
      .find(filters)
      .sort({ [options.sortBy || 'scrapedAt']: options.sortOrder === 'ASC' ? 1 : -1 })
      .limit(options.limit || 100)
      .skip(options.offset || 0)
      .toArray();
  }

  async queryPrisma(filters, options) {
    return this.prisma.scrapingResult.findMany({
      where: filters,
      orderBy: {
        [options.sortBy || 'scrapedAt']: options.sortOrder?.toLowerCase() || 'desc'
      },
      take: options.limit || 100,
      skip: options.offset || 0
    });
  }

  async queryJson(collection, filters, options) {
    const collectionDir = path.join(this.config.dataDir, collection);

    try {
      const files = await fs.readdir(collectionDir);
      const records = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(collectionDir, file), 'utf-8');
          records.push(JSON.parse(content));
        }
      }

      // Apply filters
      let filtered = records;
      if (filters.success !== undefined) {
        filtered = filtered.filter(r => r.success === filters.success);
      }
      if (filters.url) {
        filtered = filtered.filter(r => r.url.includes(filters.url));
      }

      // Sort
      filtered.sort((a, b) => {
        const aVal = a[options.sortBy || 'scrapedAt'];
        const bVal = b[options.sortBy || 'scrapedAt'];
        return options.sortOrder === 'ASC' ? aVal - bVal : bVal - aVal;
      });

      // Paginate
      return filtered.slice(
        options.offset || 0,
        (options.offset || 0) + (options.limit || 100)
      );
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  startAutoFlush() {
    this.flushInterval = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush().catch(error => {
          logger.error('Auto-flush failed:', error);
        });
      }
    }, this.config.flushInterval);
  }

  async close() {
    // Flush remaining buffer
    if (this.buffer.length > 0) {
      await this.flush();
    }

    // Clear interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Close connections
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
    if (this.prisma) {
      await this.prisma.$disconnect();
    }

    logger.info('Data pipeline closed');
  }
}
