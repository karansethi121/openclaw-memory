// Update the prompt enhancer demo to use the new JavaScript file
const script = document.createElement('script');
script.src = './prompt-enhancer.js';
document.head.appendChild(script);

// Auto-scroll to result after enhancement
document.getElementById('enhanceBtn').addEventListener('click', () => {
    setTimeout(() => {
        document.getElementById('enhancedPrompt').scrollIntoView({ behavior: 'smooth' });
    }, 300);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        enhancePrompt();
    }
    if (e.ctrlKey && e.key === 'c' && document.activeElement.id === 'enhancedPrompt') {
        copyEnhanced();
    }
});

console.log('Prompt Enhancer Demo loaded successfully!');