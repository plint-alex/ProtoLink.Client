/**
 * Request deduplication utility to prevent duplicate API calls
 * Tracks pending requests by a unique key and reuses the same promise for concurrent requests
 */

type PendingRequest<T> = {
    promise: Promise<T>;
    timestamp: number;
};

class RequestDeduplication {
    private pendingRequests: Map<string, PendingRequest<any>> = new Map();
    private readonly REQUEST_TIMEOUT = 60000; // 60 seconds - clean up stale requests

    /**
     * Get or create a request promise
     * If a request with the same key is already pending, returns the existing promise
     * Otherwise, creates a new request
     */
    async deduplicate<T>(
        key: string,
        requestFn: () => Promise<T>
    ): Promise<T> {
        // Clean up stale requests
        this.cleanup();

        // Check if there's already a pending request with this key
        const existing = this.pendingRequests.get(key);
        if (existing) {
            return existing.promise;
        }

        // Create new request
        const promise = requestFn()
            .then((result) => {
                // Remove from pending after completion
                this.pendingRequests.delete(key);
                return result;
            })
            .catch((error) => {
                // Remove from pending on error
                this.pendingRequests.delete(key);
                throw error;
            });

        // Store the pending request
        this.pendingRequests.set(key, {
            promise,
            timestamp: Date.now()
        });

        return promise;
    }

    /**
     * Generate a unique key for a request based on its parameters
     */
    generateKey(prefix: string, params: Record<string, any>): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${JSON.stringify(params[key])}`)
            .join('|');
        return `${prefix}|${sortedParams}`;
    }

    /**
     * Clean up stale requests that have been pending for too long
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, request] of this.pendingRequests.entries()) {
            if (now - request.timestamp > this.REQUEST_TIMEOUT) {
                this.pendingRequests.delete(key);
            }
        }
    }

    /**
     * Clear all pending requests (useful for testing or reset)
     */
    clear(): void {
        this.pendingRequests.clear();
    }

    /**
     * Check if a request with the given key is pending
     */
    isPending(key: string): boolean {
        return this.pendingRequests.has(key);
    }
}

// Export singleton instance
export const requestDeduplication = new RequestDeduplication();
export default requestDeduplication;

