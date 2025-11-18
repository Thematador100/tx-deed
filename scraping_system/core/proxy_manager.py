"""
Proxy rotation and management system
Supports multiple proxy providers and automatic health checking
"""

import random
import time
import logging
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import requests
from collections import deque


class ProxyManager:
    """Manages proxy rotation with health checking"""

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize proxy manager

        Args:
            config: Configuration dictionary with proxy settings
        """
        self.config = config or {}
        self.logger = logging.getLogger("proxy_manager")

        # Proxy pools
        self.proxies: List[Dict] = []
        self.failed_proxies: deque = deque(maxlen=100)
        self.proxy_stats: Dict[str, Dict] = {}

        # Load proxies from config or file
        self._load_proxies()

        # Health check settings
        self.health_check_url = self.config.get('health_check_url', 'https://httpbin.org/ip')
        self.health_check_interval = self.config.get('health_check_interval', 300)  # 5 minutes
        self.last_health_check = datetime.now()

    def _load_proxies(self):
        """Load proxies from configuration or file"""
        # Load from config
        if 'proxies' in self.config:
            self.proxies = self.config['proxies']

        # Load from file
        proxy_file = self.config.get('proxy_file', 'scraping_system/config/proxies.txt')
        try:
            with open(proxy_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        self.add_proxy(line)
        except FileNotFoundError:
            self.logger.warning(f"Proxy file not found: {proxy_file}")

        # If no proxies loaded, add some free proxy sources
        if not self.proxies:
            self.logger.warning("No proxies configured. Using direct connection.")

        self.logger.info(f"Loaded {len(self.proxies)} proxies")

    def add_proxy(self, proxy_url: str, proxy_type: str = 'http'):
        """
        Add a proxy to the pool

        Args:
            proxy_url: Proxy URL (e.g., 'http://user:pass@host:port')
            proxy_type: Type of proxy ('http', 'https', 'socks5')
        """
        proxy_dict = {
            'http': proxy_url,
            'https': proxy_url
        }

        if proxy_dict not in self.proxies:
            self.proxies.append(proxy_dict)
            self.proxy_stats[proxy_url] = {
                'success_count': 0,
                'failure_count': 0,
                'last_used': None,
                'avg_response_time': 0
            }
            self.logger.info(f"Added proxy: {proxy_url}")

    def get_proxy(self) -> Optional[Dict[str, str]]:
        """
        Get a random healthy proxy from the pool

        Returns:
            Proxy dictionary or None if no proxies available
        """
        if not self.proxies:
            return None

        # Perform health check if needed
        if (datetime.now() - self.last_health_check).seconds > self.health_check_interval:
            self._health_check_proxies()

        # Get a random proxy (weighted by success rate)
        available_proxies = [p for p in self.proxies if self._is_proxy_healthy(p)]

        if not available_proxies:
            self.logger.warning("No healthy proxies available")
            return None

        proxy = random.choice(available_proxies)

        # Update stats
        proxy_url = proxy.get('http') or proxy.get('https')
        if proxy_url in self.proxy_stats:
            self.proxy_stats[proxy_url]['last_used'] = datetime.now()

        return proxy

    def _is_proxy_healthy(self, proxy: Dict) -> bool:
        """
        Check if a proxy is healthy based on statistics

        Args:
            proxy: Proxy dictionary

        Returns:
            True if proxy is healthy
        """
        proxy_url = proxy.get('http') or proxy.get('https')

        if proxy_url not in self.proxy_stats:
            return True

        stats = self.proxy_stats[proxy_url]
        total_requests = stats['success_count'] + stats['failure_count']

        if total_requests == 0:
            return True

        success_rate = stats['success_count'] / total_requests
        return success_rate > 0.5  # At least 50% success rate

    def _health_check_proxies(self):
        """Perform health check on all proxies"""
        self.logger.info("Performing health check on proxies")

        for proxy in self.proxies[:]:  # Copy to allow removal during iteration
            try:
                start_time = time.time()
                response = requests.get(
                    self.health_check_url,
                    proxies=proxy,
                    timeout=10
                )

                response_time = time.time() - start_time

                if response.status_code == 200:
                    proxy_url = proxy.get('http') or proxy.get('https')
                    if proxy_url in self.proxy_stats:
                        self.proxy_stats[proxy_url]['success_count'] += 1
                        # Update average response time
                        current_avg = self.proxy_stats[proxy_url]['avg_response_time']
                        self.proxy_stats[proxy_url]['avg_response_time'] = (
                            (current_avg + response_time) / 2
                        )
                    self.logger.debug(f"Proxy healthy: {proxy_url}")
                else:
                    self._mark_proxy_failed(proxy)

            except Exception as e:
                self.logger.warning(f"Proxy health check failed: {str(e)}")
                self._mark_proxy_failed(proxy)

        self.last_health_check = datetime.now()

    def _mark_proxy_failed(self, proxy: Dict):
        """Mark a proxy as failed"""
        proxy_url = proxy.get('http') or proxy.get('https')

        if proxy_url in self.proxy_stats:
            self.proxy_stats[proxy_url]['failure_count'] += 1

            # Remove if too many failures
            total_requests = (
                self.proxy_stats[proxy_url]['success_count'] +
                self.proxy_stats[proxy_url]['failure_count']
            )

            if total_requests > 10:
                success_rate = self.proxy_stats[proxy_url]['success_count'] / total_requests

                if success_rate < 0.3:  # Less than 30% success rate
                    self.logger.warning(f"Removing failed proxy: {proxy_url}")
                    self.proxies.remove(proxy)
                    self.failed_proxies.append(proxy)

    def report_success(self, proxy: Dict):
        """Report successful use of a proxy"""
        proxy_url = proxy.get('http') or proxy.get('https')
        if proxy_url in self.proxy_stats:
            self.proxy_stats[proxy_url]['success_count'] += 1

    def report_failure(self, proxy: Dict):
        """Report failed use of a proxy"""
        self._mark_proxy_failed(proxy)

    def get_stats(self) -> Dict:
        """Get proxy statistics"""
        return {
            'total_proxies': len(self.proxies),
            'healthy_proxies': len([p for p in self.proxies if self._is_proxy_healthy(p)]),
            'failed_proxies': len(self.failed_proxies),
            'proxy_details': self.proxy_stats
        }
