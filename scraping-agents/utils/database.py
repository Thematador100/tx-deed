"""
Database utilities for storing scraped data in Supabase
"""
import os
from typing import List, Optional, Dict
from loguru import logger
from supabase import create_client, Client
from dotenv import load_dotenv
from models.property import ScrapedProperty, ScraperRun

load_dotenv()


class DatabaseManager:
    """Manages database operations for scraped data"""

    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not found in environment variables")

        self.client: Client = create_client(supabase_url, supabase_key)
        logger.info("Database manager initialized")

    async def save_property(self, property_data: ScrapedProperty) -> Optional[Dict]:
        """
        Save a single property to the database
        Returns the saved property or None if failed
        """
        try:
            # Calculate scores before saving
            property_data.calculate_roi()
            property_data.calculate_opportunity_score()

            # Convert to Supabase format
            data = property_data.to_supabase_dict()

            # Check if property already exists
            existing = self.client.table("properties").select("id").eq(
                "address", property_data.address
            ).eq("county", property_data.county).execute()

            if existing.data:
                # Update existing property
                logger.info(f"Updating existing property: {property_data.address}")
                result = self.client.table("properties").update(data).eq(
                    "id", existing.data[0]["id"]
                ).execute()
            else:
                # Insert new property
                logger.info(f"Inserting new property: {property_data.address}")
                result = self.client.table("properties").insert(data).execute()

            return result.data[0] if result.data else None

        except Exception as e:
            logger.error(f"Error saving property {property_data.address}: {str(e)}")
            return None

    async def save_properties_batch(self, properties: List[ScrapedProperty]) -> int:
        """
        Save multiple properties in batch
        Returns count of successfully saved properties
        """
        saved_count = 0

        for prop in properties:
            result = await self.save_property(prop)
            if result:
                saved_count += 1

        logger.info(f"Batch save complete: {saved_count}/{len(properties)} properties saved")
        return saved_count

    async def log_scraper_run(self, run: ScraperRun) -> Optional[Dict]:
        """Log a scraper run to the database"""
        try:
            data = {
                "county": run.county,
                "started_at": run.started_at.isoformat(),
                "completed_at": run.completed_at.isoformat() if run.completed_at else None,
                "status": run.status,
                "properties_found": run.properties_found,
                "properties_saved": run.properties_saved,
                "errors": run.errors
            }

            result = self.client.table("scraper_runs").insert(data).execute()
            return result.data[0] if result.data else None

        except Exception as e:
            logger.error(f"Error logging scraper run: {str(e)}")
            return None

    async def get_properties_by_county(self, county: str, limit: int = 100) -> List[Dict]:
        """Retrieve properties for a specific county"""
        try:
            result = self.client.table("properties").select("*").eq(
                "county", county
            ).order("opportunity_score", desc=True).limit(limit).execute()

            return result.data or []

        except Exception as e:
            logger.error(f"Error retrieving properties for {county}: {str(e)}")
            return []

    async def get_active_scout_agents(self) -> List[Dict]:
        """Get all active scout agents that need data"""
        try:
            result = self.client.table("scout_agents").select("*").eq(
                "is_active", True
            ).execute()

            return result.data or []

        except Exception as e:
            logger.error(f"Error retrieving scout agents: {str(e)}")
            return []

    async def notify_agent_match(self, agent_id: str, property_id: str) -> bool:
        """Create a notification for when a property matches an agent's criteria"""
        try:
            data = {
                "agent_id": agent_id,
                "property_id": property_id,
                "notified_at": None,
                "status": "pending"
            }

            self.client.table("agent_notifications").insert(data).execute()
            logger.info(f"Created notification for agent {agent_id}, property {property_id}")
            return True

        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            return False

    async def check_agent_matches(self, property_data: ScrapedProperty):
        """
        Check if a property matches any active scout agent criteria
        and create notifications
        """
        try:
            agents = await self.get_active_scout_agents()

            for agent in agents:
                criteria = agent.get("criteria", {})

                # Check county match
                agent_counties = criteria.get("counties", [])
                if agent_counties and property_data.county not in agent_counties:
                    continue

                # Check score match
                min_score = criteria.get("minScore", 0)
                if property_data.opportunity_score and property_data.opportunity_score < min_score:
                    continue

                # Match found! Create notification
                # First, we need to get the property ID from the database
                prop_result = self.client.table("properties").select("id").eq(
                    "address", property_data.address
                ).eq("county", property_data.county).execute()

                if prop_result.data:
                    property_id = prop_result.data[0]["id"]
                    await self.notify_agent_match(agent["id"], property_id)
                    logger.info(f"Property {property_data.address} matched agent {agent['agent_name']}")

        except Exception as e:
            logger.error(f"Error checking agent matches: {str(e)}")
