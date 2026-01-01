// QA Test Script v2 - More robust testing with better wait handling
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3003';
const SCREENSHOT_DIR = '/Users/gabe/photon-app/test-screenshots-v2';

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function takeScreenshot(page, name) {
    const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`  Screenshot: ${name}.png`);
    return filepath;
}

async function runTests() {
    console.log('\n=== PhotonAgent.ai QA Test v2 ===\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        // ========================================
        // 1. WELCOME SCREEN
        // ========================================
        console.log('[1] Testing Welcome Screen...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        await delay(2000);
        await takeScreenshot(page, '01-welcome');

        // Verify content
        const welcomeContent = await page.evaluate(() => ({
            hasLogo: !!document.querySelector('.font-display'),
            hasHeroText: document.body.innerText.includes('Turn Your Photos'),
            hasGetStarted: document.body.innerText.includes('Get Started'),
            hasLogin: document.body.innerText.includes('Log In'),
            hasFeatures: document.body.innerText.includes('Market Intelligence'),
        }));
        console.log('  Welcome page content:', welcomeContent);

        // ========================================
        // 2. SIGNUP FLOW (3D Cube)
        // ========================================
        console.log('\n[2] Testing Signup Flow...');

        // Click "Get Started" to open signup
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.innerText.includes('Get Started') || b.innerText.includes('Start Monetizing'));
            if (btn) btn.click();
        });
        await delay(1500);
        await takeScreenshot(page, '02-signup-step1');

        // Check if we're in signup mode (3D cube)
        const signupStep1 = await page.evaluate(() => ({
            hasUnlockStudio: document.body.innerText.includes('Unlock Your Studio'),
            hasNameField: !!document.querySelector('input[placeholder*="John"]') || !!document.querySelector('input[type="text"]'),
            hasEmailField: !!document.querySelector('input[type="email"]'),
            hasPasswordField: !!document.querySelector('input[type="password"]'),
            hasNextButton: document.body.innerText.includes('Next'),
        }));
        console.log('  Signup Step 1:', signupStep1);

        // Fill in Step 1
        const nameInput = await page.$('input[placeholder*="John"]') || await page.$('input[type="text"]:not([type="email"])');
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');

        if (nameInput) await nameInput.type('Test User');
        if (emailInput) await emailInput.type('test@photon.ai');
        if (passwordInput) await passwordInput.type('TestPass123');

        await takeScreenshot(page, '03-signup-step1-filled');

        // Click Next
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(b => b.innerText.includes('Next'));
            if (nextBtn) nextBtn.click();
        });
        await delay(1200);
        await takeScreenshot(page, '04-signup-step2');

        const signupStep2 = await page.evaluate(() => ({
            hasCalibrateAI: document.body.innerText.includes('Calibrate AI'),
            hasBeginner: document.body.innerText.includes('Beginner'),
            hasEnthusiast: document.body.innerText.includes('Enthusiast'),
            hasProfessional: document.body.innerText.includes('Professional'),
        }));
        console.log('  Signup Step 2:', signupStep2);

        // Click Next for Step 3
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(b => b.innerText.includes('Next'));
            if (nextBtn) nextBtn.click();
        });
        await delay(1200);
        await takeScreenshot(page, '05-signup-step3');

        const signupStep3 = await page.evaluate(() => ({
            hasAllocateVault: document.body.innerText.includes('Allocate Vault'),
            hasArchiveSizes: document.body.innerText.includes('1k-10k') || document.body.innerText.includes('10k-100k'),
            hasInitialize: document.body.innerText.includes('Initialize'),
        }));
        console.log('  Signup Step 3:', signupStep3);

        // Complete Signup
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const initBtn = buttons.find(b => b.innerText.includes('Initialize'));
            if (initBtn) initBtn.click();
        });
        await delay(3500); // Wait for zoom animation + login
        await takeScreenshot(page, '06-main-app');

        // ========================================
        // 3. MAIN APP - VERIFY NAVIGATION
        // ========================================
        console.log('\n[3] Testing Main App Navigation...');

        const mainAppLoaded = await page.evaluate(() => ({
            hasHeader: !!document.querySelector('header'),
            hasLightBox: document.body.innerText.includes('Light Box'),
            hasPortfolio: document.body.innerText.includes('Portfolio'),
            hasEarnings: document.body.innerText.includes('Earnings'),
            hasEditor: document.body.innerText.includes('Editor'),
            hasStudio: document.body.innerText.includes('Studio'),
            hasRoutes: document.body.innerText.includes('Routes'),
            hasSettings: document.body.innerText.includes('Settings'),
            hasUserProfile: document.body.innerText.includes('Creative Pro') || document.body.innerText.includes('PRO PLAN'),
        }));
        console.log('  Main app elements:', mainAppLoaded);

        // Test each navigation section
        const navTests = ['Portfolio', 'Earnings', 'Editor', 'Studio', 'Routes', 'Settings', 'Light Box'];

        for (const navItem of navTests) {
            await page.evaluate((item) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => b.innerText === item || b.innerText.includes(item));
                if (btn) btn.click();
            }, navItem);
            await delay(800);
            await takeScreenshot(page, `07-nav-${navItem.toLowerCase().replace(/\s+/g, '-')}`);

            const viewContent = await page.evaluate((item) => {
                const text = document.body.innerText;
                const checks = {
                    'Portfolio': text.includes('My Portfolio') || text.includes('Portfolio'),
                    'Earnings': text.includes('Earnings Dashboard') || text.includes('Total Earnings'),
                    'Editor': text.includes('Darkroom') || text.includes('Open image'),
                    'Studio': text.includes('Shot Architect') || text.includes('Creative'),
                    'Routes': text.includes('Routes') || text.includes('Workflow') || text.includes('automation'),
                    'Settings': text.includes('Settings') || text.includes('Platform Connections'),
                    'Light Box': text.includes('Drop your work') || text.includes('Select from device'),
                };
                return checks[item] || false;
            }, navItem);
            console.log(`  ${navItem}: ${viewContent ? 'LOADED' : 'ISSUE'}`);
        }

        // ========================================
        // 4. SETTINGS PAGE DETAILS
        // ========================================
        console.log('\n[4] Testing Settings View Details...');

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.innerText.includes('Settings'));
            if (btn) btn.click();
        });
        await delay(1000);
        await takeScreenshot(page, '08-settings-full');

        const settingsDetails = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                hasGoogleCloud: text.includes('Google Cloud'),
                hasStudioProfile: text.includes('Studio Profile'),
                hasAIPersonality: text.includes('AI Personality'),
                hasStorageUsage: text.includes('Storage Usage'),
                hasPlatformConnections: text.includes('Platform Connections'),
                hasNotificationHub: text.includes('Notification Hub'),
                toggleCount: document.querySelectorAll('input[type="checkbox"]').length,
                platformsListed: text.includes('Adobe Stock') && text.includes('Instagram'),
            };
        });
        console.log('  Settings details:', settingsDetails);

        // ========================================
        // 5. EARNINGS PAGE DETAILS
        // ========================================
        console.log('\n[5] Testing Earnings View Details...');

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.innerText.includes('Earnings'));
            if (btn) btn.click();
        });
        await delay(1000);
        await takeScreenshot(page, '09-earnings-full');

        const earningsDetails = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                hasDashboardTitle: text.includes('Earnings Dashboard'),
                hasTotalEarnings: text.includes('Total Earnings'),
                hasPhotosSold: text.includes('Photos Sold'),
                hasTopPlatform: text.includes('Top Platform'),
                hasChart: !!document.querySelector('svg'),
                hasTopPerforming: text.includes('Top Performing'),
                hasRecentSales: text.includes('Recent Sales'),
                hasDateRange: text.includes('Date Range'),
            };
        });
        console.log('  Earnings details:', earningsDetails);

        // ========================================
        // 6. LIGHT BOX / UPLOAD AREA
        // ========================================
        console.log('\n[6] Testing Light Box View...');

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.innerText.includes('Light Box'));
            if (btn) btn.click();
        });
        await delay(1000);
        await takeScreenshot(page, '10-lightbox-full');

        const lightboxDetails = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                hasUploadPrompt: text.includes('Drop your work'),
                hasSelectDevice: text.includes('Select from device'),
                hasFileInput: !!document.querySelector('input[type="file"]'),
                hasLaunchStudio: text.includes('Launch Shot Architect') || text.includes('LAUNCH SHOT'),
                hasMentorMessage: text.includes('monetization scoring'),
            };
        });
        console.log('  Light Box details:', lightboxDetails);

        // ========================================
        // 7. USER PROFILE DROPDOWN
        // ========================================
        console.log('\n[7] Testing User Profile Dropdown...');

        // Click on user avatar/profile area
        const profileClicked = await page.evaluate(() => {
            // Try finding the profile button by looking for Creative Pro text or avatar
            const profileArea = document.querySelector('img[alt="User"]');
            if (profileArea) {
                profileArea.click();
                return true;
            }
            // Alternative: click on the profile section
            const buttons = Array.from(document.querySelectorAll('button'));
            const profileBtn = buttons.find(b => b.innerText.includes('Creative Pro'));
            if (profileBtn) {
                profileBtn.click();
                return true;
            }
            return false;
        });
        await delay(600);
        await takeScreenshot(page, '11-profile-dropdown');

        const dropdownContent = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                hasProfile: text.includes('Profile'),
                hasSettings: text.includes('Settings'),
                hasSignOut: text.includes('Sign Out'),
                hasUserEmail: text.includes('@'),
            };
        });
        console.log('  Profile dropdown:', dropdownContent);

        // ========================================
        // 8. LOGOUT FLOW
        // ========================================
        console.log('\n[8] Testing Logout...');

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const signOutBtn = buttons.find(b => b.innerText.includes('Sign Out'));
            if (signOutBtn) signOutBtn.click();
        });
        await delay(2000);
        await takeScreenshot(page, '12-after-logout');

        const loggedOut = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                backToWelcome: text.includes('Turn Your Photos') || text.includes('Get Started'),
                noMainNav: !text.includes('Light Box') || text.includes('Log In'),
            };
        });
        console.log('  Logout result:', loggedOut);

        // ========================================
        // 9. MOBILE RESPONSIVE TEST
        // ========================================
        console.log('\n[9] Testing Mobile Responsiveness...');

        await page.setViewport({ width: 375, height: 667 });
        await delay(500);
        await takeScreenshot(page, '13-mobile-welcome');

        // Login on mobile
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.innerText.includes('Log In'));
            if (btn) btn.click();
        });
        await delay(1000);
        await takeScreenshot(page, '14-mobile-login');

        const mobileLogin = await page.evaluate(() => ({
            formVisible: !!document.querySelector('input[type="email"]'),
            buttonsAccessible: !!document.querySelector('button[type="submit"]'),
        }));
        console.log('  Mobile login:', mobileLogin);

        // Log in on mobile
        const mobileEmailInput = await page.$('input[type="email"]');
        const mobilePasswordInput = await page.$('input[type="password"]');
        if (mobileEmailInput) await mobileEmailInput.type('test@mobile.com');
        if (mobilePasswordInput) await mobilePasswordInput.type('testpass');

        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) await submitBtn.click();
        await delay(2500);
        await takeScreenshot(page, '15-mobile-main-app');

        const mobileApp = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                navVisible: !!document.querySelector('nav'),
                contentAccessible: text.includes('Drop your work') || text.includes('Light Box'),
                noOverflow: document.body.scrollWidth <= window.innerWidth,
            };
        });
        console.log('  Mobile app:', mobileApp);

        // Reset viewport
        await page.setViewport({ width: 1440, height: 900 });

        // ========================================
        // 10. ERROR HANDLING TEST
        // ========================================
        console.log('\n[10] Testing Error Handling...');

        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        await delay(1000);

        // Go to login
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.innerText.includes('Log In'));
            if (btn) btn.click();
        });
        await delay(1000);

        // Test empty submission
        const emailField = await page.$('input[type="email"]');
        const passwordField = await page.$('input[type="password"]');

        // Try with invalid short password
        if (emailField) await emailField.type('test@example.com');
        if (passwordField) await passwordField.type('abc'); // Too short

        const submit = await page.$('button[type="submit"]');
        if (submit) await submit.click();
        await delay(2000);
        await takeScreenshot(page, '16-error-invalid-password');

        const errorResult = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                stillOnLogin: !!document.querySelector('input[type="password"]'),
                errorShown: text.includes('Invalid') || text.includes('error') || text.includes('failed'),
            };
        });
        console.log('  Error handling:', errorResult);

        console.log('\n=== Test Complete ===\n');

    } catch (error) {
        console.error('\n[CRITICAL ERROR]:', error.message);
        await takeScreenshot(page, 'error-state');
    } finally {
        await browser.close();
    }
}

runTests().catch(console.error);
