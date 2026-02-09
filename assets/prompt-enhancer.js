// Prompt Enhancer Working Implementation
// This file integrates the prompt enhancement logic into a functional web interface

class PromptEnhancer {
    constructor(config = {}) {
        this.patterns = config.patterns || {};
        this.historyLength = config.historyLength || 10;
        this.history = [];
        this.stats = {
            enhanced: 0,
            skipped: 0,
            avgImprovement: 0
        };
    }

    // Load patterns from config file
    loadPatterns(config) {
        this.patterns = config.patterns || {};
        return this;
    }

    // Main enhancement function
    enhance(originalPrompt, context = {}) {
        const startTime = Date.now();
        let enhanced = originalPrompt;
        const improvements = [];

        // 1. Apply context injection patterns
        if (context.userPreferences) {
            enhanced = this.injectContext(enhanced, context.userPreferences);
            improvements.push('context-injected');
        }

        // 2. Apply structure patterns
        enhanced = this.applyStructure(enhanced);
        if (enhanced !== originalPrompt) {
            improvements.push('structured');
        }

        // 3. Apply clarity patterns
        enhanced = this.enhanceClarity(enhanced);
        if (enhanced !== originalPrompt) {
            improvements.push('clarified');
        }

        // 4. Apply specificity patterns
        enhanced = this.enhanceSpecificity(enhanced);
        if (enhanced !== originalPrompt) {
            improvements.push('specified');
        }

        // Save to history
        this.history.push({
            original: originalPrompt,
            enhanced: enhanced,
            improvements: improvements,
            timestamp: startTime,
            duration: Date.now() - startTime
        });

        // Trim history
        if (this.history.length > this.historyLength) {
            this.history.shift();
        }

        // Update stats
        if (enhanced !== originalPrompt) {
            this.stats.enhanced++;
            const improvementScore = this.calculateImprovement(originalPrompt, enhanced);
            this.stats.avgImprovement = ((this.stats.avgImprovement * (this.stats.enhanced - 1)) + improvementScore) / this.stats.enhanced;
        } else {
            this.stats.skipped++;
        }

        return {
            original: originalPrompt,
            enhanced: enhanced,
            improvements: improvements,
            score: this.calculateScore(enhanced),
            improved: enhanced !== originalPrompt
        };
    }

    // Inject context into prompt
    injectContext(prompt, context) {
        if (!context || typeof context !== 'object') return prompt;

        const contextString = Object.entries(context)
            .filter(([_, value]) => value !== null && value !== undefined)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        if (contextString) {
            return `Context:\n${contextString}\n\n${prompt}`;
        }
        return prompt;
    }

    // Apply structure to prompt
    applyStructure(prompt) {
        let structured = prompt;

        // Check if prompt has clear structure indicators
        const hasStructure = /^(Task|Goal|Objective|What I need):/im.test(structured) ||
                            /^(Deliverable|Output|Expected):/im.test(structured) ||
                            /^(Constraints|Requirements|Rules):/im.test(structured);

        if (!hasStructure) {
            // Add structure markers
            const taskMatch = structured.match(/^(?:Create|Build|Write|Design|Make|Generate|Produce|Help me with)/i);
            if (taskMatch) {
                structured = `Task: ${structured}`;
            }
        }

        return structured;
    }

    // Enhance clarity
    enhanceClarity(prompt) {
        let clarified = prompt;

        // Replace vague terms with specific alternatives
        const vagueReplacements = {
            'something': 'a specific item or output',
            'some information': 'detailed information about [topic]',
            'make it better': 'improve [specific aspect] by [how]',
            'good': 'high-quality',
            'cool': 'visually appealing and engaging',
            'awesome': 'exceptional and impressive',
            'fix it': 'debug and resolve',
            'help with': 'assist me by'
        };

        Object.entries(vagueReplacements).forEach(([vague, specific]) => {
            const regex = new RegExp(`\\b${vague}\\b`, 'gi');
            if (regex.test(clarified)) {
                clarified = clarified.replace(regex, specific);
            }
        });

        return clarified;
    }

    // Enhance specificity
    enhanceSpecificity(prompt) {
        let specified = prompt;

        // Check for missing specifics
        const needsSpecificity = [
            'code' => 'programming language',
            'website' => 'technology stack/framework',
            'design' => 'design system/styling approach',
            'data' => 'data format/source',
            'content' => 'content type and audience'
        ];

        Object.entries(needsSpecificity).forEach(([keyword, specificityType]) => {
            if (specified.toLowerCase().includes(keyword)) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                if (!specified.toLowerCase().includes(specificalityType)) {
                    // Could add [specify: ${specificityType}] placeholder
                    // For now, just flag it
                }
            }
        });

        return specified;
    }

    // Calculate prompt quality score
    calculateScore(prompt) {
        let score = 0;
        const maxLength = 1000;

        // Length score (not too short, not too long)
        const length = prompt.length;
        if (length > 50 && length < maxLength) {
            score += 20;
        } else if (length >= maxLength) {
            score += 10;
        }

        // Structure score (has sections)
        if (/Task:|Goal:|Objective:/i.test(prompt)) score += 15;
        if (/Deliverable:|Output:|Expected:/i.test(prompt)) score += 15;
        if (/Constraint:|Requirement:|Rule:/i.test(prompt)) score += 15;

        // Specificity score (has specific terms)
        if (/\b(specify|specific|precise|exact)\b/i.test(prompt)) score += 10;
        if (/\b(examples|for example|such as|include)\b/i.test(prompt)) score += 10;

        // Clarity score (avoids vague terms)
        const vagueTerms = ['something', 'somehow', 'maybe', 'sort of', 'kind of'];
        let vagueCount = 0;
        vagueTerms.forEach(term => {
            if (new RegExp(`\\b${term}\\b`, 'i').test(prompt)) vagueCount++;
        });
        score += Math.max(0, 15 - (vagueCount * 5));

        return Math.min(100, score);
    }

    // Calculate improvement % between original and enhanced
    calculateImprovement(original, enhanced) {
        const originalScore = this.calculateScore(original);
        const enhancedScore = this.calculateScore(enhanced);
        return Math.round(((enhancedScore - originalScore) / originalScore) * 100);
    }

    // Get statistics
    getStats() {
        return {
            ...this.stats,
            totalProcessed: this.stats.enhanced + this.stats.skipped,
            history: this.history,
            improvementRate: this.stats.enhanced > 0
                ? Math.round((this.stats.enhanced / (this.stats.enhanced + this.stats.skipped)) * 100)
                : 0
        };
    }

    // Clear history
    clearHistory() {
        this.history = [];
    }

    // Reset stats
    resetStats() {
        this.stats = {
            enhanced: 0,
            skipped: 0,
            avgImprovement: 0
        };
        this.clearHistory();
    }
}

// Browser-compatible version
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptEnhancer;
}

// Example usage in browser:
const enhancer = new PromptEnhancer();

function enhancePrompt() {
    const original = document.getElementById('originalPrompt').value;
    const result = enhancer.enhance(original, {
        userPreferences: {
            style: 'concise and actionable',
            format: 'structured response'
        }
    });

    // Display results
    document.getElementById('enhancedPrompt').value = result.enhanced;
    document.getElementById('improvements').innerHTML = result.improvements
        .map(imp => `<span class="tag">${imp}</span>`)
        .join('');

    document.getElementById('score').textContent = `${result.score}/100`;
    document.getElementById('improvementRate').textContent = `${result.improved ? '+' : ''}${result.score - enhancer.calculateScore(result.original)} points`;
    document.getElementById('copyBtn').classList.add('visible');
}

function copyEnhanced() {
    const enhanced = document.getElementById('enhancedPrompt').value;
    navigator.clipboard.writeText(enhanced).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = 'Copy Enhanced';
        }, 2000);
    });
}

// Load history when page loads
window.addEventListener('DOMContentLoaded', () => {
    const savedHistory = localStorage.getItem('promptEnhancerHistory');
    if (savedHistory) {
        enhancer.history = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
});

function updateHistoryDisplay() {
    const historyContainer = document.getElementById('historyLog');
    if (!historyContainer) return;

    historyContainer.innerHTML = enhancer.history
        .reverse()
        .slice(0, 10)
        .map((entry, idx) => `
            <div class="history-entry">
                <div class="history-original">${entry.original.substring(0, 50)}...</div>
                <div class="history-enhanced">${entry.enhanced.substring(0, 50)}...</div>
                <div class="history-improvements">${entry.improvements.join(', ')}</div>
            </div>
        `).join('');
}