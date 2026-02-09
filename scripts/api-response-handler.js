// API Response Handler - Robust JSON parsing with HTML detection
// Prevents crashes when API returns HTML pages instead of JSON

class ApiHandler {
    constructor() {
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
    }

    /**
     * Parse JSON response with HTML detection
     * @param {string} data - Response data from API
     * @param {string} operation - Name of operation (for logging)
     * @returns {object|null} Parsed JSON or null if error
     */
    parseResponse(data, operation = 'API Call') {
        // Check for HTML response
        if (this.isHtmlResponse(data)) {
            console.log(`❌ ${operation}: API returned HTML instead of JSON`);
            console.log('   → Likely: API maintenance, rate limiting, or authorization failure');
            console.log('   → Will retry in 2 seconds...');
            return this.handleHtmlError(data, operation);
        }

        // Parse JSON
        try {
            const result = JSON.parse(data);
            return result;
        } catch (err) {
            console.log(`❌ ${operation}: JSON parse failed`);
            console.log(`   Error: ${err.message}`);
            return null;
        }
    }

    /**
     * Detect if response is HTML
     * @param {string} data - Response data
     * @returns {boolean} True if HTML detected
     */
    isHtmlResponse(data) {
        if (!data || typeof data !== 'string') return false;

        const trimmed = data.trim().toLowerCase();
        return trimmed.startsWith('<!doctype') ||
               trimmed.startsWith('<html') ||
               trimmed.startsWith('<!doctype html');
    }

    /**
     * Handle HTML error response
     * @param {string} data - HTML response
     * @param {string} operation - Operation name
     * @returns {object|null} Reattempt or return null
     */
    handleHtmlError(data, operation) {
        this.retryCount++;

        if (this.retryCount <= this.maxRetries) {
            this.logHtmlDetails(data);
            return { shouldRetry: true };
        }

        console.log(`⚠️ ${operation}: Max retries (${this.maxRetries}) reached`);
        this.retryCount = 0;
        return { shouldRetry: false, error: 'HTML response - check API status' };
    }

    /**
     * Log details from HTML response for debugging
     * @param {string} html - HTML response
     */
    logHtmlDetails(html) {
        try {
            // Extract title if available
            const titleMatch = html.match(/<title>(.*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Unknown';

            // Extract error message if available
            const errorMatch = html.match(/(error|401|403|404|500|503)/i);
            const error = errorMatch ? errorMatch[0] : 'No specific error code';

            console.log(`   → HTML Title: ${title}`);
            console.log(`   → Error Code: ${error}`);
            console.log(`   → Retry ${this.retryCount}/${this.maxRetries}`);
        } catch (err) {
            console.log('   → Could not parse HTML details');
        }
    }

    /**
     * Reset retry counter
     */
    resetRetries() {
        this.retryCount = 0;
    }
}

module.exports = ApiHandler;