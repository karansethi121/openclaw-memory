// Simple HTML detection utility
// Can be used in any trading script to detect API HTML responses

function isHtmlResponse(data) {
    if (!data || typeof data !== 'string') return false;
    const trimmed = data.trim().toLowerCase();
    return trimmed.startsWith('<!doctype') ||
           trimmed.startsWith('<html') ||
           trimmed.startsWith('<!doctype html');
}

// Robust JSON parser with HTML detection
function safeJsonParse(data, operation = 'API Call') {
    if (isHtmlResponse(data)) {
        console.log(`❌ ${operation}: API returned HTML instead of JSON`);
        console.log('   → Likely: API maintenance or rate limiting');
        return null;
    }
    try {
        return JSON.parse(data);
    } catch (err) {
        console.log(`❌ ${operation}: JSON parse failed - ${err.message}`);
        return null;
    }
}

module.exports = { isHtmlResponse, safeJsonParse };