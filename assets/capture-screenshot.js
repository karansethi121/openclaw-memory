const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });

        const htmlFile = path.join(__dirname, 'one4health-packaging-design.html');
        const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');

        await page.goto(fileUrl, { waitUntil: 'networkidle0' });

        const screenshotPath = path.join(__dirname, 'one4health-packaging-screenshot.png');
        await page.screenshot({
            path: screenshotPath,
            fullPage: false
        });

        await browser.close();
        console.log('Screenshot saved:', screenshotPath);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();