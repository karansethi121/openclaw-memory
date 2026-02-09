// Check actual API keys in configuration file
const fs = require('fs');
const path = require('path');

const configPath = 'C:\\Users\\Karan\\.openclaw\\openclaw.json';

console.log('============================================================');
console.log('🔍 CHECKING API KEYS IN CONFIGURATION FILE');
console.log('============================================================\n');

try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);

    const apiKey = config.env.BINANCE_API_KEY;
    const apiSecret = config.env.BINANCE_API_SECRET;

    console.log('🔑 BINANCE_API_KEY (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
    console.log('🔑 BINANCE_API_SECRET (first 10 chars):', apiSecret ? apiSecret.substring(0, 10) + '...' : 'NOT SET');
    console.log();

    console.log('📋 Expected NEW keys:');
    console.log('   API Key: GlKNmdLPBee...');
    console.log('   Secret: haR5GyKW5KmP...');

    console.log();
    console.log('⚠️ ISSUE DISCOVERED:');
    console.log('   The config file has the new keys, but the running process');
    console.log('   is still reading the OLD keys from the environment.');
    console.log();
    console.log('   This means the environment variables from the gateway config');
    console.log('   were not properly propagated after the restart.');

} catch (error) {
    console.log('❌ Error reading config:', error.message);
}

console.log('============================================================');