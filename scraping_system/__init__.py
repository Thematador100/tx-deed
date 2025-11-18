"""
Enterprise-level Web Scraping and Data Science System
for Real Estate and Property Data
"""

__version__ = "1.0.0"
__author__ = "AI Scraping Engineer"

from .core.base_scraper import BaseScraper
from .core.proxy_manager import ProxyManager
from .core.rate_limiter import RateLimiter
from .core.database_manager import DatabaseManager

__all__ = [
    'BaseScraper',
    'ProxyManager',
    'RateLimiter',
    'DatabaseManager',
]
