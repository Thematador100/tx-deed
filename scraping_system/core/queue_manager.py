"""
Task queue management for distributed scraping
Supports Redis, RabbitMQ, and in-memory queues
"""

import json
import logging
from typing import Any, Optional, Dict, Callable
from datetime import datetime
from enum import Enum
import queue
import threading


class QueueType(Enum):
    """Queue backend types"""
    MEMORY = "memory"
    REDIS = "redis"
    RABBITMQ = "rabbitmq"


class QueueManager:
    """Manages task queues for distributed scraping"""

    def __init__(
        self,
        queue_type: QueueType = QueueType.MEMORY,
        config: Optional[Dict] = None
    ):
        """
        Initialize queue manager

        Args:
            queue_type: Type of queue backend to use
            config: Configuration for the queue backend
        """
        self.queue_type = queue_type
        self.config = config or {}
        self.logger = logging.getLogger("queue_manager")

        self._queue = None
        self._callbacks: Dict[str, Callable] = {}

        self._initialize_queue()

    def _initialize_queue(self):
        """Initialize the appropriate queue backend"""
        if self.queue_type == QueueType.MEMORY:
            self._queue = queue.Queue()
            self.logger.info("Initialized in-memory queue")

        elif self.queue_type == QueueType.REDIS:
            try:
                import redis
                redis_config = self.config.get('redis', {})
                self._queue = redis.Redis(
                    host=redis_config.get('host', 'localhost'),
                    port=redis_config.get('port', 6379),
                    db=redis_config.get('db', 0),
                    decode_responses=True
                )
                self.logger.info("Initialized Redis queue")
            except ImportError:
                self.logger.error("Redis not installed. Falling back to memory queue")
                self._queue = queue.Queue()

        elif self.queue_type == QueueType.RABBITMQ:
            try:
                import pika
                rabbitmq_config = self.config.get('rabbitmq', {})
                credentials = pika.PlainCredentials(
                    rabbitmq_config.get('username', 'guest'),
                    rabbitmq_config.get('password', 'guest')
                )
                parameters = pika.ConnectionParameters(
                    host=rabbitmq_config.get('host', 'localhost'),
                    port=rabbitmq_config.get('port', 5672),
                    credentials=credentials
                )
                self._connection = pika.BlockingConnection(parameters)
                self._channel = self._connection.channel()
                self.logger.info("Initialized RabbitMQ queue")
            except ImportError:
                self.logger.error("Pika not installed. Falling back to memory queue")
                self._queue = queue.Queue()

    def add_task(self, task: Dict[str, Any], priority: int = 0):
        """
        Add a task to the queue

        Args:
            task: Task dictionary with task details
            priority: Task priority (higher = more important)
        """
        task_data = {
            'task': task,
            'priority': priority,
            'created_at': datetime.now().isoformat(),
            'status': 'pending'
        }

        if self.queue_type == QueueType.MEMORY:
            self._queue.put((priority, task_data))

        elif self.queue_type == QueueType.REDIS:
            queue_name = self.config.get('queue_name', 'scraping_tasks')
            self._queue.zadd(
                queue_name,
                {json.dumps(task_data): priority}
            )

        elif self.queue_type == QueueType.RABBITMQ:
            queue_name = self.config.get('queue_name', 'scraping_tasks')
            self._channel.queue_declare(queue=queue_name, durable=True)
            self._channel.basic_publish(
                exchange='',
                routing_key=queue_name,
                body=json.dumps(task_data),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    priority=priority
                )
            )

        self.logger.info(f"Added task to queue: {task.get('type', 'unknown')}")

    def get_task(self, timeout: Optional[int] = None) -> Optional[Dict]:
        """
        Get a task from the queue

        Args:
            timeout: Timeout in seconds (None = wait forever)

        Returns:
            Task dictionary or None
        """
        try:
            if self.queue_type == QueueType.MEMORY:
                priority, task_data = self._queue.get(timeout=timeout)
                return task_data

            elif self.queue_type == QueueType.REDIS:
                queue_name = self.config.get('queue_name', 'scraping_tasks')
                result = self._queue.zpopmax(queue_name, 1)

                if result:
                    task_json, priority = result[0]
                    return json.loads(task_json)

            elif self.queue_type == QueueType.RABBITMQ:
                queue_name = self.config.get('queue_name', 'scraping_tasks')
                method_frame, header_frame, body = self._channel.basic_get(
                    queue=queue_name
                )

                if method_frame:
                    self._channel.basic_ack(method_frame.delivery_tag)
                    return json.loads(body)

        except queue.Empty:
            return None
        except Exception as e:
            self.logger.error(f"Error getting task from queue: {str(e)}")
            return None

        return None

    def register_callback(self, task_type: str, callback: Callable):
        """
        Register a callback for a specific task type

        Args:
            task_type: Type of task
            callback: Function to call when task is processed
        """
        self._callbacks[task_type] = callback
        self.logger.info(f"Registered callback for task type: {task_type}")

    def process_tasks(self, num_workers: int = 1):
        """
        Process tasks from the queue using worker threads

        Args:
            num_workers: Number of worker threads
        """
        def worker():
            while True:
                task_data = self.get_task(timeout=1)

                if task_data:
                    task = task_data['task']
                    task_type = task.get('type')

                    if task_type in self._callbacks:
                        try:
                            self.logger.info(f"Processing task: {task_type}")
                            self._callbacks[task_type](task)
                            self.logger.info(f"Completed task: {task_type}")
                        except Exception as e:
                            self.logger.error(f"Error processing task: {str(e)}")
                    else:
                        self.logger.warning(f"No callback for task type: {task_type}")

        # Start worker threads
        workers = []
        for i in range(num_workers):
            t = threading.Thread(target=worker, daemon=True)
            t.start()
            workers.append(t)
            self.logger.info(f"Started worker thread {i + 1}/{num_workers}")

        # Wait for workers
        for t in workers:
            t.join()

    def get_queue_size(self) -> int:
        """Get the current queue size"""
        if self.queue_type == QueueType.MEMORY:
            return self._queue.qsize()
        elif self.queue_type == QueueType.REDIS:
            queue_name = self.config.get('queue_name', 'scraping_tasks')
            return self._queue.zcard(queue_name)
        elif self.queue_type == QueueType.RABBITMQ:
            queue_name = self.config.get('queue_name', 'scraping_tasks')
            method_frame = self._channel.queue_declare(
                queue=queue_name,
                durable=True,
                passive=True
            )
            return method_frame.method.message_count

        return 0

    def clear_queue(self):
        """Clear all tasks from the queue"""
        if self.queue_type == QueueType.MEMORY:
            while not self._queue.empty():
                self._queue.get()
        elif self.queue_type == QueueType.REDIS:
            queue_name = self.config.get('queue_name', 'scraping_tasks')
            self._queue.delete(queue_name)
        elif self.queue_type == QueueType.RABBITMQ:
            queue_name = self.config.get('queue_name', 'scraping_tasks')
            self._channel.queue_purge(queue=queue_name)

        self.logger.info("Cleared queue")
