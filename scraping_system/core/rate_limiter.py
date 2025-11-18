"""
Rate limiting implementation to avoid overwhelming target servers
Supports multiple rate limiting strategies
"""

import time
import threading
from collections import deque
from datetime import datetime, timedelta
from typing import Optional


class RateLimiter:
    """Rate limiter with multiple strategies"""

    def __init__(
        self,
        requests_per_second: float = 1.0,
        burst_size: Optional[int] = None,
        strategy: str = 'sliding_window'
    ):
        """
        Initialize rate limiter

        Args:
            requests_per_second: Maximum requests per second
            burst_size: Maximum burst size (None for unlimited)
            strategy: Rate limiting strategy ('fixed_window', 'sliding_window', 'token_bucket')
        """
        self.requests_per_second = requests_per_second
        self.burst_size = burst_size or int(requests_per_second * 2)
        self.strategy = strategy

        self.lock = threading.Lock()

        # Sliding window implementation
        self.request_times = deque()

        # Token bucket implementation
        self.tokens = self.burst_size
        self.last_refill = time.time()

        # Fixed window implementation
        self.window_start = time.time()
        self.window_requests = 0

    def wait(self):
        """Wait if necessary to respect rate limit"""
        if self.strategy == 'sliding_window':
            self._wait_sliding_window()
        elif self.strategy == 'token_bucket':
            self._wait_token_bucket()
        elif self.strategy == 'fixed_window':
            self._wait_fixed_window()

    def _wait_sliding_window(self):
        """Sliding window rate limiting"""
        with self.lock:
            now = time.time()
            window_size = 1.0  # 1 second window

            # Remove old requests outside the window
            while self.request_times and self.request_times[0] < now - window_size:
                self.request_times.popleft()

            # Check if we need to wait
            if len(self.request_times) >= self.requests_per_second:
                sleep_time = self.request_times[0] + window_size - now
                if sleep_time > 0:
                    time.sleep(sleep_time)

                # Clean up old requests again
                now = time.time()
                while self.request_times and self.request_times[0] < now - window_size:
                    self.request_times.popleft()

            # Record this request
            self.request_times.append(time.time())

    def _wait_token_bucket(self):
        """Token bucket rate limiting"""
        with self.lock:
            now = time.time()

            # Refill tokens
            time_passed = now - self.last_refill
            self.tokens = min(
                self.burst_size,
                self.tokens + time_passed * self.requests_per_second
            )
            self.last_refill = now

            # Wait if no tokens available
            if self.tokens < 1:
                sleep_time = (1 - self.tokens) / self.requests_per_second
                time.sleep(sleep_time)

                # Refill after sleep
                now = time.time()
                time_passed = now - self.last_refill
                self.tokens = min(
                    self.burst_size,
                    self.tokens + time_passed * self.requests_per_second
                )
                self.last_refill = now

            # Consume a token
            self.tokens -= 1

    def _wait_fixed_window(self):
        """Fixed window rate limiting"""
        with self.lock:
            now = time.time()

            # Check if we're in a new window
            if now - self.window_start >= 1.0:
                self.window_start = now
                self.window_requests = 0

            # Wait if limit reached
            if self.window_requests >= self.requests_per_second:
                sleep_time = self.window_start + 1.0 - now
                if sleep_time > 0:
                    time.sleep(sleep_time)

                # Start new window
                self.window_start = time.time()
                self.window_requests = 0

            # Increment counter
            self.window_requests += 1

    def get_stats(self):
        """Get rate limiter statistics"""
        with self.lock:
            if self.strategy == 'sliding_window':
                return {
                    'strategy': self.strategy,
                    'requests_per_second': self.requests_per_second,
                    'current_requests': len(self.request_times)
                }
            elif self.strategy == 'token_bucket':
                return {
                    'strategy': self.strategy,
                    'requests_per_second': self.requests_per_second,
                    'available_tokens': self.tokens,
                    'burst_size': self.burst_size
                }
            elif self.strategy == 'fixed_window':
                return {
                    'strategy': self.strategy,
                    'requests_per_second': self.requests_per_second,
                    'current_window_requests': self.window_requests
                }
