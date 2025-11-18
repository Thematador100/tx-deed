"""
Database management for storing scraped data
Supports PostgreSQL, MongoDB, and SQLite
"""

import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum
import sqlite3


class DatabaseType(Enum):
    """Database backend types"""
    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"
    MONGODB = "mongodb"


class DatabaseManager:
    """Manages database connections and operations"""

    def __init__(
        self,
        db_type: DatabaseType = DatabaseType.SQLITE,
        config: Optional[Dict] = None
    ):
        """
        Initialize database manager

        Args:
            db_type: Type of database backend
            config: Database configuration
        """
        self.db_type = db_type
        self.config = config or {}
        self.logger = logging.getLogger("database_manager")

        self._connection = None
        self._initialize_database()

    def _initialize_database(self):
        """Initialize database connection"""
        if self.db_type == DatabaseType.SQLITE:
            db_path = self.config.get('path', 'scraping_system/data/scraping.db')
            self._connection = sqlite3.connect(db_path, check_same_thread=False)
            self.logger.info(f"Connected to SQLite database: {db_path}")
            self._create_tables_sqlite()

        elif self.db_type == DatabaseType.POSTGRESQL:
            try:
                import psycopg2
                from psycopg2.extras import RealDictCursor

                pg_config = self.config.get('postgresql', {})
                self._connection = psycopg2.connect(
                    host=pg_config.get('host', 'localhost'),
                    port=pg_config.get('port', 5432),
                    database=pg_config.get('database', 'scraping'),
                    user=pg_config.get('user', 'postgres'),
                    password=pg_config.get('password', ''),
                    cursor_factory=RealDictCursor
                )
                self.logger.info("Connected to PostgreSQL database")
                self._create_tables_postgresql()

            except ImportError:
                self.logger.error("psycopg2 not installed. Falling back to SQLite")
                self.db_type = DatabaseType.SQLITE
                self._initialize_database()

        elif self.db_type == DatabaseType.MONGODB:
            try:
                from pymongo import MongoClient

                mongo_config = self.config.get('mongodb', {})
                client = MongoClient(
                    host=mongo_config.get('host', 'localhost'),
                    port=mongo_config.get('port', 27017)
                )
                db_name = mongo_config.get('database', 'scraping')
                self._connection = client[db_name]
                self.logger.info(f"Connected to MongoDB database: {db_name}")

            except ImportError:
                self.logger.error("pymongo not installed. Falling back to SQLite")
                self.db_type = DatabaseType.SQLITE
                self._initialize_database()

    def _create_tables_sqlite(self):
        """Create tables for SQLite"""
        cursor = self._connection.cursor()

        # Properties table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS properties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                property_id TEXT UNIQUE,
                address TEXT,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                county TEXT,
                property_type TEXT,
                bedrooms INTEGER,
                bathrooms REAL,
                square_feet INTEGER,
                lot_size REAL,
                year_built INTEGER,
                assessed_value REAL,
                market_value REAL,
                tax_amount REAL,
                owner_name TEXT,
                owner_address TEXT,
                is_tax_delinquent BOOLEAN,
                delinquent_amount REAL,
                last_sale_date TEXT,
                last_sale_price REAL,
                zoning TEXT,
                land_use TEXT,
                latitude REAL,
                longitude REAL,
                data_source TEXT,
                raw_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Scraping jobs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scraping_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT UNIQUE,
                job_type TEXT,
                status TEXT,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                items_scraped INTEGER,
                items_failed INTEGER,
                error_message TEXT,
                config TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Leads table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id TEXT UNIQUE,
                property_id TEXT,
                lead_type TEXT,
                lead_score REAL,
                contact_name TEXT,
                contact_email TEXT,
                contact_phone TEXT,
                status TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (property_id) REFERENCES properties(property_id)
            )
        ''')

        self._connection.commit()
        self.logger.info("Created SQLite tables")

    def _create_tables_postgresql(self):
        """Create tables for PostgreSQL"""
        cursor = self._connection.cursor()

        # Properties table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                property_id TEXT UNIQUE,
                address TEXT,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                county TEXT,
                property_type TEXT,
                bedrooms INTEGER,
                bathrooms REAL,
                square_feet INTEGER,
                lot_size REAL,
                year_built INTEGER,
                assessed_value REAL,
                market_value REAL,
                tax_amount REAL,
                owner_name TEXT,
                owner_address TEXT,
                is_tax_delinquent BOOLEAN,
                delinquent_amount REAL,
                last_sale_date TIMESTAMP,
                last_sale_price REAL,
                zoning TEXT,
                land_use TEXT,
                latitude REAL,
                longitude REAL,
                data_source TEXT,
                raw_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create indexes
        cursor.execute(
            'CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city)'
        )
        cursor.execute(
            'CREATE INDEX IF NOT EXISTS idx_properties_tax_delinquent ON properties(is_tax_delinquent)'
        )

        self._connection.commit()
        self.logger.info("Created PostgreSQL tables")

    def insert_property(self, property_data: Dict) -> bool:
        """
        Insert a property record

        Args:
            property_data: Property data dictionary

        Returns:
            True if successful
        """
        try:
            if self.db_type == DatabaseType.MONGODB:
                collection = self._connection['properties']
                property_data['created_at'] = datetime.now()
                collection.insert_one(property_data)

            else:  # SQLite or PostgreSQL
                cursor = self._connection.cursor()

                columns = ', '.join(property_data.keys())
                placeholders = ', '.join(['?' if self.db_type == DatabaseType.SQLITE else '%s'] * len(property_data))

                query = f'''
                    INSERT OR REPLACE INTO properties ({columns})
                    VALUES ({placeholders})
                ''' if self.db_type == DatabaseType.SQLITE else f'''
                    INSERT INTO properties ({columns})
                    VALUES ({placeholders})
                    ON CONFLICT (property_id) DO UPDATE SET
                    updated_at = CURRENT_TIMESTAMP
                '''

                cursor.execute(query, list(property_data.values()))
                self._connection.commit()

            self.logger.debug(f"Inserted property: {property_data.get('property_id')}")
            return True

        except Exception as e:
            self.logger.error(f"Error inserting property: {str(e)}")
            return False

    def bulk_insert_properties(self, properties: List[Dict]) -> int:
        """
        Bulk insert property records

        Args:
            properties: List of property dictionaries

        Returns:
            Number of successfully inserted records
        """
        success_count = 0

        if self.db_type == DatabaseType.MONGODB:
            try:
                collection = self._connection['properties']
                for prop in properties:
                    prop['created_at'] = datetime.now()
                result = collection.insert_many(properties, ordered=False)
                success_count = len(result.inserted_ids)
            except Exception as e:
                self.logger.error(f"Error bulk inserting: {str(e)}")

        else:
            for prop in properties:
                if self.insert_property(prop):
                    success_count += 1

        self.logger.info(f"Bulk inserted {success_count}/{len(properties)} properties")
        return success_count

    def query_properties(
        self,
        filters: Optional[Dict] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict]:
        """
        Query properties with filters

        Args:
            filters: Filter dictionary
            limit: Maximum number of results
            offset: Results offset

        Returns:
            List of property dictionaries
        """
        filters = filters or {}

        try:
            if self.db_type == DatabaseType.MONGODB:
                collection = self._connection['properties']
                results = collection.find(filters).limit(limit).skip(offset)
                return list(results)

            else:  # SQLite or PostgreSQL
                cursor = self._connection.cursor()

                where_clauses = []
                values = []

                for key, value in filters.items():
                    where_clauses.append(f"{key} = ?")
                    values.append(value)

                where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

                query = f'''
                    SELECT * FROM properties
                    {where_sql}
                    LIMIT ? OFFSET ?
                '''

                values.extend([limit, offset])
                cursor.execute(query, values)

                columns = [desc[0] for desc in cursor.description]
                results = []

                for row in cursor.fetchall():
                    results.append(dict(zip(columns, row)))

                return results

        except Exception as e:
            self.logger.error(f"Error querying properties: {str(e)}")
            return []

    def get_stats(self) -> Dict:
        """Get database statistics"""
        try:
            if self.db_type == DatabaseType.MONGODB:
                collection = self._connection['properties']
                return {
                    'total_properties': collection.count_documents({}),
                    'tax_delinquent': collection.count_documents({'is_tax_delinquent': True})
                }

            else:
                cursor = self._connection.cursor()
                cursor.execute('SELECT COUNT(*) FROM properties')
                total = cursor.fetchone()[0]

                cursor.execute('SELECT COUNT(*) FROM properties WHERE is_tax_delinquent = 1')
                tax_delinquent = cursor.fetchone()[0]

                return {
                    'total_properties': total,
                    'tax_delinquent': tax_delinquent
                }

        except Exception as e:
            self.logger.error(f"Error getting stats: {str(e)}")
            return {}

    def close(self):
        """Close database connection"""
        if self._connection:
            if self.db_type != DatabaseType.MONGODB:
                self._connection.close()
            self.logger.info("Closed database connection")
