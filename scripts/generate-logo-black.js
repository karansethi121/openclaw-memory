#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple HTML file that renders the logo
const html = `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 150px; background: #fff; }
  .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; }
  .icon-left { width: 40px; height: 40px; }
  .text { font-family: Arial, sans-serif; font-size: 28px; font-weight: 700; color: #000; letter-spacing: -0.5px; }
  .icon-right { width: 24px; height: 24px; }
</style>
</head>
<body>
  <div class="logo-container">
    <svg class="icon-left" viewBox="0 0 40 40">
      <path d="M20 5 C20 5 8 15 8 22 C8 28 12 32 20 32 C28 32 32 28 32 22 C32 15 20 5 20 5 Z" fill="#10B981"/>
      <path d="M20 8 C20 8 11 16 11 22 C11 27 14 30 20 30 C26 30 29 27 29 22 C29 16 20 8 20 8 Z" fill="#34D399"/>
      <circle cx="20" cy="23" r="3" fill="#059669"/>
    </svg>
    <div class="text">One4Health</div>
    <svg class="icon-right" viewBox="0 0 24 24">
      <circle cx="12" cy="6" r="5" fill="#10B981"/>
      <rect x="10" y="10" width="4" height="12" rx="1" fill="#059669"/>
      <path d="M12 22 L12 16" stroke="#047857" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="5" r="2" fill="#34D399" opacity="0.5"/>
    </svg>
  </div>
</body>
</html>`;

// Write the HTML file to the brand folder (workspace root)
const brandPath = path.join(__dirname, '..', 'brand', 'logo-black.html');
fs.writeFileSync(brandPath, html);

console.log('HTML file created: brand/logo-black.html');
console.log('You can open this in a browser and take a screenshot to save as PNG.');