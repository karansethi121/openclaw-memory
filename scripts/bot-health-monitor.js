// Bot Health Monitor - Auto-restart crashed trading bots
// Check and restart bots continuously

const { execSync, spawn } = require('child_process');
const fs = require('fs');

const bots = [
    { name: 'Triangular Arbitrage', script: 'scripts/triangular-arbitrage-bot.js', args: ['binary'], enabled: true },
    { name: 'Grid Trading', script: 'scripts/grid-trading-bot.js', args: ['continuous'], enabled: true },
    { name: 'Futures Short', script: 'scripts/futures-short-bot.js', args: ['continuous'], enabled: false }, // Disabled - has issues
    { name: 'Entry Trigger', script: 'scripts/entry-trigger-detector.js', args: [], enabled: false } // Disabled - has issues
];

const CONFIG = {
    checkInterval: 120000, // Check every 2 minutes
    retryDelay: 10000, // 10 seconds before restart
    restartAttempts: 3,
    logFile: 'C:\\Users\\Karan\\.openclaw\\workspace\\bot-monitor.log'
};

let runningProcesses = new Map();
let restartAttempts = new Map();
let alertCooldown = new Map();

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(CONFIG.logFile, logMessage);
}

function sendAlert(message) {
    const key = message.substring(0, 50);
    const now = Date.now();
    
    if (alertCooldown.has(key) && now - alertCooldown.get(key) < 300000) {
        return; // Don't spam alerts (5 min cooldown)
    }
    
    alertCooldown.set(key, now);
    
    try {
        execSync(`powershell -Command "& C:\\Users\\Karan\\.openclaw\\gateway\\message.exe --to 8284494839 --channel telegram --message '${message.replace(/'/g, "''")}'"`, 
            { timeout: 30000, stdio: 'ignore' }
        );
        log(`📱 Alert sent: ${message.substring(0, 50)}...`);
    } catch (error) {
        log(`⚠️ Failed to send alert: ${error.message}`);
    }
}

function isProcessRunning(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch (e) {
        return false;
    }
}

function startBot(bot) {
    if (!bot.enabled) {
        log(`⏭️  ${bot.name} is disabled, skipping`);
        return null;
    }

    if (restartAttempts.get(bot.name) >= CONFIG.restartAttempts) {
        log(`🚫 ${bot.name} - Max restart attempts reached, disabling`);
        bot.enabled = false;
        sendAlert(`⚠️ ${bot.name} disabled after ${CONFIG.restartAttempts} failed restarts`);
        return null;
    }

    const attempt = restartAttempts.get(bot.name) || 0;
    restartAttempts.set(bot.name, attempt + 1);

    log(`🚀 Starting ${bot.name} (attempt ${attempt + 1}/${CONFIG.restartAttempts})`);

    try {
        const scriptPath = `C:\\Users\\Karan\\.openclaw\\workspace\\${bot.script}`;
        
        if (!fs.existsSync(scriptPath)) {
            log(`❌ ${bot.name} - Script not found: ${scriptPath}`);
            return null;
        }

        const process = spawn('node', [scriptPath, ...bot.args], {
            cwd: 'C:\\Users\\Karan\\.openclaw\\workspace',
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        process.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('BUY') || output.includes('SELL') || output.includes('FILLED') || output.includes('PROFIT')) {
                log(`✅ ${bot.name}: ${output.trim().substring(0, 100)}`);
            }
        });

        process.stderr.on('data', (data) => {
            const error = data.toString();
            log(`⚠️ ${bot.name} ERROR: ${error.substring(0, 200)}`);
        });

        process.on('exit', (code, signal) => {
            log(`🔴 ${bot.name} stopped (code: ${code}, signal: ${signal})`);
            runningProcesses.delete(bot.name);
            
            if (code !== 0) {
                sendAlert(`⚠️ ${bot.name} crashed with code ${code}`);
                scheduleRestart(bot);
            }
        });

        runningProcesses.set(bot.name, process);
        restartAttempts.set(bot.name, 0); // Reset on successful start
        log(`✅ ${bot.name} started - PID ${process.pid}`);
        
        return process;

    } catch (error) {
        log(`❌ Failed to start ${bot.name}: ${error.message}`);
        sendAlert(`❌ Failed to start ${bot.name}: ${error.message}`);
        return null;
    }
}

function scheduleRestart(bot) {
    setTimeout(() => {
        if (!runningProcesses.has(bot.name)) {
            startBot(bot);
        }
    }, CONFIG.retryDelay);
}

function checkBots() {
    log('🔍 Checking bot health...');

    for (const bot of bots) {
        if (!bot.enabled) continue;

        const process = runningProcesses.get(bot.name);
        
        if (!process) {
            log(`⚠️ ${bot.name} - Not running, starting...`);
            startBot(bot);
            continue;
        }

        if (!isProcessRunning(process.pid)) {
            log(`⚠️ ${bot.name} - Process dead, restarting...`);
            runningProcesses.delete(bot.name);
            startBot(bot);
            sendAlert(`⚠️ ${bot.name} died and is being restarted`);
        } else {
            log(`✅ ${bot.name} - OK (PID ${process.pid})`);
        }
    }

    log('='.repeat(80));
}

function run() {
    log('='.repeat(80));
    log('🤖 BOT HEALTH MONITOR - STARTING');
    log('='.repeat(80));

    // Start all enabled bots
    for (const bot of bots) {
        if (bot.enabled) {
            startBot(bot);
        }
    }

    // Run periodic checks
    setInterval(() => {
        checkBots();
    }, CONFIG.checkInterval);

    // Initial check after 30 seconds
    setTimeout(checkBots, 30000);

    log(`⚙️  Monitor running - checking every ${CONFIG.checkInterval / 1000}s`);
    log(`📝 Log file: ${CONFIG.logFile}`);
}

// Run monitor
if (require.main === module) {
    run();
}

module.exports = { startBot, checkBots, runningProcesses };