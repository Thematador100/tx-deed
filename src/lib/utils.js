import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Retry configuration constants
 */
export const RETRY_CONFIG = {
	maxRetries: 4,
	initialDelay: 2000, // 2 seconds
	maxDelay: 16000, // 16 seconds
	backoffMultiplier: 2,
	jitterPercent: 0.1, // 10% jitter to prevent thundering herd
};

/**
 * Determines if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error should trigger a retry
 */
export function isRetryableError(error) {
	// Network errors
	if (error.message?.includes('network') ||
	    error.message?.includes('timeout') ||
	    error.message?.includes('fetch failed') ||
	    error.message?.includes('ECONNREFUSED') ||
	    error.message?.includes('ETIMEDOUT')) {
		return true;
	}

	// HTTP status codes that should be retried
	if (error.status) {
		const retryableStatuses = [
			408, // Request Timeout
			429, // Too Many Requests
			500, // Internal Server Error
			502, // Bad Gateway
			503, // Service Unavailable
			504, // Gateway Timeout
		];
		return retryableStatuses.includes(error.status);
	}

	// Supabase specific errors
	if (error.code) {
		// Connection errors
		if (error.code === 'PGRST301' || // Connection error
		    error.code === '08006' ||    // Connection failure
		    error.code === '57P03') {     // Cannot connect now
			return true;
		}
	}

	return false;
}

/**
 * Calculates delay with exponential backoff and jitter
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} - Delay in milliseconds
 */
export function calculateBackoff(attempt, config = RETRY_CONFIG) {
	const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
	const cappedDelay = Math.min(exponentialDelay, config.maxDelay);

	// Add jitter to prevent thundering herd problem
	const jitter = cappedDelay * config.jitterPercent * (Math.random() * 2 - 1);
	return Math.max(0, cappedDelay + jitter);
}

/**
 * Executes a function with retry logic and exponential backoff
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts
 * @param {Function} options.onRetry - Callback function called before each retry
 * @param {Function} options.shouldRetry - Custom function to determine if error should be retried
 * @returns {Promise<any>} - Result of the function execution
 */
export async function retryWithBackoff(fn, options = {}) {
	const config = {
		maxRetries: options.maxRetries ?? RETRY_CONFIG.maxRetries,
		onRetry: options.onRetry ?? (() => {}),
		shouldRetry: options.shouldRetry ?? isRetryableError,
	};

	let lastError;

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Check if we should retry
			const shouldRetry = config.shouldRetry(error);
			const hasRetriesLeft = attempt < config.maxRetries;

			if (!shouldRetry || !hasRetriesLeft) {
				throw error;
			}

			// Calculate delay and wait
			const delay = calculateBackoff(attempt);

			// Call onRetry callback
			config.onRetry({
				attempt: attempt + 1,
				maxRetries: config.maxRetries,
				delay,
				error,
			});

			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * Wraps a Supabase query with retry logic
 * @param {Function} queryFn - Function that returns a Supabase query
 * @param {Object} options - Retry options
 * @returns {Promise<{data: any, error: any}>} - Supabase query result
 */
export async function retrySupabaseQuery(queryFn, options = {}) {
	return retryWithBackoff(async () => {
		const result = await queryFn();

		// Supabase returns errors in the result object
		if (result.error) {
			// Create an error object for retry logic
			const error = new Error(result.error.message);
			error.code = result.error.code;
			error.status = result.error.status;
			throw error;
		}

		return result;
	}, options);
}

/**
 * Wraps a Supabase Edge Function invocation with retry logic
 * @param {Object} supabase - Supabase client instance
 * @param {string} functionName - Name of the edge function
 * @param {Object} params - Function parameters
 * @param {Object} options - Retry options
 * @returns {Promise<{data: any, error: any}>} - Edge function result
 */
export async function retryEdgeFunction(supabase, functionName, params = {}, options = {}) {
	return retryWithBackoff(async () => {
		const result = await supabase.functions.invoke(functionName, params);

		if (result.error) {
			const error = new Error(result.error.message);
			error.status = result.error.status;
			throw error;
		}

		return result;
	}, options);
}