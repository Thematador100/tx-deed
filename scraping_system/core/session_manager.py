"""
Session management for maintaining connections and cookies
"""

import requests
from typing import Optional, Dict
import logging


class SessionManager:
    """Manages HTTP sessions with connection pooling"""

    def __init__(self, pool_size: int = 10):
        """
        Initialize session manager

        Args:
            pool_size: Maximum number of connections in pool
        """
        self.pool_size = pool_size
        self.session: Optional[requests.Session] = None
        self.logger = logging.getLogger("session_manager")

    def get_session(self) -> requests.Session:
        """
        Get or create a session

        Returns:
            Configured requests session
        """
        if self.session is None:
            self.session = requests.Session()

            # Configure connection pooling
            adapter = requests.adapters.HTTPAdapter(
                pool_connections=self.pool_size,
                pool_maxsize=self.pool_size,
                max_retries=0  # Retries are handled by BaseScraper
            )

            self.session.mount('http://', adapter)
            self.session.mount('https://', adapter)

            self.logger.info("Created new session with connection pooling")

        return self.session

    def set_cookies(self, cookies: Dict[str, str]):
        """Set cookies for the session"""
        session = self.get_session()
        session.cookies.update(cookies)
        self.logger.info(f"Updated session cookies: {list(cookies.keys())}")

    def get_cookies(self) -> Dict[str, str]:
        """Get current session cookies"""
        if self.session:
            return dict(self.session.cookies)
        return {}

    def clear_cookies(self):
        """Clear all session cookies"""
        if self.session:
            self.session.cookies.clear()
            self.logger.info("Cleared session cookies")

    def close(self):
        """Close the session and cleanup resources"""
        if self.session:
            self.session.close()
            self.logger.info("Closed session")
            self.session = None
