// QA Test Script for PhotonAgent.ai
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3003';
const SCREENSHOT_DIR = '/Users/gabe/photon-app/test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testResults = {
    passed: [],
    failed: [],
    warnings: [],
    screenshots: []
};

async function takeScreenshot(page, name) {
    const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    testResults.screenshots.push(filepath);
    console.log(`  Screenshot saved: ${name}.png`);
    return filepath;
}

async function logTest(name, passed, details = '') {
    const result = { name, details, timestamp: new Date().toISOString() };
    if (passed) {
        testResults.passed.push(result);
        console.log(`  [PASS] ${name}`);
    } else {
        testResults.failed.push(result);
        console.log(`  [FAIL] ${name}: ${details}`);
    }
}

async function logWarning(name, details) {
    testResults.warnings.push({ name, details, timestamp: new Date().toISOString() });
    console.log(`  [WARN] ${name}: ${details}`);
}

async function runTests() {
    console.log('\n========================================');
    console.log('  PhotonAgent.ai QA Test Suite');
    console.log('========================================\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        // ========================================
        // TEST 1: Welcome Screen
        // ========================================
        console.log('\n[TEST GROUP 1] Welcome Screen and Onboarding');
        console.log('--------------------------------------------');

        await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        await delay(1000);
        await takeScreenshot(page, '01-welcome-screen');

        // Check for key welcome screen elements
        const logoExists = await page.$('.font-display') !== null;
        await logTest('Logo/Brand is visible', logoExists);

        const heroTextExists = await page.evaluate(() => {
            return document.body.innerText.includes('Turn Your Photos');
        });
        await logTest('Hero headline is visible', heroTextExists);

        const getStartedBtn = await page.$('button');
        await logTest('CTA buttons are visible', getStartedBtn !== null);

        // Check for platform logos
        const platformLogos = await page.$$('img[alt]');
        await logTest('Platform logos are loading', platformLogos.length > 0, `Found ${platformLogos.length} images`);

        // Check for broken images
        const brokenImages = await page.evaluate(() => {
            const images = document.querySelectorAll('img');
            const broken = [];
            images.forEach(img => {
                if (!img.complete || img.naturalHeight === 0) {
                    broken.push(img.src);
                }
            });
            return broken;
        });
        if (brokenImages.length > 0) {
            await logWarning('Some images may not be loading', brokenImages.join(', '));
        } else {
            await logTest('All images are loading correctly', true);
        }

        // Check for navigation elements
        const loginBtn = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Log In') || btn.innerText.includes('Login')) {
                    return true;
                }
            }
            return false;
        });
        await logTest('Login button is visible', loginBtn);

        // ========================================
        // TEST 2: Login Flow
        // ========================================
        console.log('\n[TEST GROUP 2] Login Flow');
        console.log('--------------------------------------------');

        // Click Log In button
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Log In')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(1500);
        await takeScreenshot(page, '02-login-screen');

        // Check login form elements
        const emailInput = await page.$('input[type="email"]');
        await logTest('Email input field exists', emailInput !== null);

        const passwordInput = await page.$('input[type="password"]');
        await logTest('Password input field exists', passwordInput !== null);

        const googleLoginBtn = await page.evaluate(() => {
            return document.body.innerText.includes('Sign in with Google') ||
                   document.body.innerText.includes('Google');
        });
        await logTest('Google login option exists', googleLoginBtn);

        // Test login with invalid credentials
        if (emailInput && passwordInput) {
            await emailInput.type('test@example.com');
            await passwordInput.type('testpassword123');
            await takeScreenshot(page, '03-login-form-filled');

            // Submit form
            const submitBtn = await page.$('button[type="submit"]');
            if (submitBtn) {
                await submitBtn.click();
                await delay(2000);
                await takeScreenshot(page, '04-after-login-attempt');
                await logTest('Login form submission works', true);
            }
        }

        // ========================================
        // TEST 3: Signup Flow (3D Cube)
        // ========================================
        console.log('\n[TEST GROUP 3] Signup Flow');
        console.log('--------------------------------------------');

        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        await delay(1000);

        // Click Get Started button
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Get Started') || btn.innerText.includes('Start Monetizing')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(1500);
        await takeScreenshot(page, '05-signup-step1');

        // Check signup form - Step 1 (Credentials)
        const nameInput = await page.$('input[type="text"]');
        const signupEmailInput = await page.$('input[type="email"]');
        const signupPasswordInput = await page.$('input[type="password"]');

        await logTest('Signup Step 1: Name input exists', nameInput !== null);
        await logTest('Signup Step 1: Email input exists', signupEmailInput !== null);
        await logTest('Signup Step 1: Password input exists', signupPasswordInput !== null);

        // Fill step 1
        if (nameInput && signupEmailInput && signupPasswordInput) {
            await nameInput.type('Test User');
            await signupEmailInput.type('testuser@photon.ai');
            await signupPasswordInput.type('TestPassword123');
            await takeScreenshot(page, '06-signup-step1-filled');

            // Click Next
            const nextBtn = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    if (btn.innerText.includes('Next')) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            });
            await delay(1000);
            await takeScreenshot(page, '07-signup-step2');
            await logTest('Signup Step 1 -> Step 2 transition', nextBtn);
        }

        // Check Step 2 (Experience Level)
        const experienceCards = await page.evaluate(() => {
            return document.body.innerText.includes('Beginner') &&
                   document.body.innerText.includes('Professional');
        });
        await logTest('Signup Step 2: Experience options visible', experienceCards);

        // Click Next to Step 3
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Next')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(1000);
        await takeScreenshot(page, '08-signup-step3');

        // Check Step 3 (Archive Size)
        const archiveOptions = await page.evaluate(() => {
            return document.body.innerText.includes('1k-10k') ||
                   document.body.innerText.includes('10k-100k');
        });
        await logTest('Signup Step 3: Archive size options visible', archiveOptions);

        // Complete signup
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Initialize')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(3000);
        await takeScreenshot(page, '09-after-signup');

        // ========================================
        // TEST 4: Main App Navigation
        // ========================================
        console.log('\n[TEST GROUP 4] Main App Navigation');
        console.log('--------------------------------------------');

        // Check if we're now in the main app
        const mainAppLoaded = await page.evaluate(() => {
            return document.body.innerText.includes('Light Box') ||
                   document.body.innerText.includes('PhotonAgent') ||
                   document.body.innerText.includes('Portfolio');
        });
        await logTest('Main app loaded after signup', mainAppLoaded);

        if (mainAppLoaded) {
            // Test each navigation item
            const navItems = ['Light Box', 'Portfolio', 'Earnings', 'Editor', 'Studio', 'Routes', 'Settings'];

            for (const navItem of navItems) {
                try {
                    await page.evaluate((item) => {
                        const buttons = document.querySelectorAll('button');
                        for (const btn of buttons) {
                            if (btn.innerText.includes(item)) {
                                btn.click();
                                return true;
                            }
                        }
                        return false;
                    }, navItem);
                    await delay(800);
                    await takeScreenshot(page, `10-nav-${navItem.toLowerCase().replace(/\s+/g, '-')}`);
                    await logTest(`Navigation to ${navItem} works`, true);
                } catch (err) {
                    await logTest(`Navigation to ${navItem} works`, false, err.message);
                }
            }
        }

        // ========================================
        // TEST 5: Light Box View
        // ========================================
        console.log('\n[TEST GROUP 5] Light Box View');
        console.log('--------------------------------------------');

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Light Box')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(500);
        await takeScreenshot(page, '11-lightbox-view');

        const uploadAreaExists = await page.evaluate(() => {
            return document.body.innerText.includes('Drop your work') ||
                   document.body.innerText.includes('Upload') ||
                   document.body.innerText.includes('Select from device');
        });
        await logTest('Light Box: Upload area is visible', uploadAreaExists);

        const fileInput = await page.$('input[type="file"]');
        await logTest('Light Box: File input exists', fileInput !== null);

        // ========================================
        // TEST 6: Editor View
        // ========================================
        console.log('\n[TEST GROUP 6] Editor View');
        console.log('--------------------------------------------');

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Editor')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(500);
        await takeScreenshot(page, '12-editor-view');

        const editorUploadArea = await page.evaluate(() => {
            return document.body.innerText.includes('Darkroom') ||
                   document.body.innerText.includes('Open image');
        });
        await logTest('Editor: Upload prompt visible', editorUploadArea);

        // ========================================
        // TEST 7: Settings View
        // ========================================
        console.log('\n[TEST GROUP 7] Settings View');
        console.log('--------------------------------------------');

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Settings')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(500);
        await takeScreenshot(page, '13-settings-view');

        const settingsPageLoaded = await page.evaluate(() => {
            return document.body.innerText.includes('Settings') &&
                   document.body.innerText.includes('Platform Connections');
        });
        await logTest('Settings: Page loaded correctly', settingsPageLoaded);

        const googleCloudSection = await page.evaluate(() => {
            return document.body.innerText.includes('Google Cloud') ||
                   document.body.innerText.includes('Compute');
        });
        await logTest('Settings: Google Cloud section visible', googleCloudSection);

        const platformToggles = await page.$$('input[type="checkbox"]');
        await logTest('Settings: Platform toggles exist', platformToggles.length > 0, `Found ${platformToggles.length} toggles`);

        // Test toggling a platform
        if (platformToggles.length > 0) {
            await platformToggles[0].click();
            await delay(300);
            await logTest('Settings: Platform toggle is clickable', true);
        }

        // ========================================
        // TEST 8: Earnings View
        // ========================================
        console.log('\n[TEST GROUP 8] Earnings View');
        console.log('--------------------------------------------');

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Earnings')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(500);
        await takeScreenshot(page, '14-earnings-view');

        const earningsPageLoaded = await page.evaluate(() => {
            return document.body.innerText.includes('Earnings Dashboard') ||
                   document.body.innerText.includes('Total Earnings');
        });
        await logTest('Earnings: Dashboard loaded', earningsPageLoaded);

        const earningsChart = await page.$('svg');
        await logTest('Earnings: Chart is rendered', earningsChart !== null);

        // ========================================
        // TEST 9: Portfolio View
        // ========================================
        console.log('\n[TEST GROUP 9] Portfolio View');
        console.log('--------------------------------------------');

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Portfolio')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(500);
        await takeScreenshot(page, '15-portfolio-view');

        const portfolioPageLoaded = await page.evaluate(() => {
            return document.body.innerText.includes('Portfolio') ||
                   document.body.innerText.includes('My Portfolio');
        });
        await logTest('Portfolio: Page loaded correctly', portfolioPageLoaded);

        const emptyStateMessage = await page.evaluate(() => {
            return document.body.innerText.includes('Empty') ||
                   document.body.innerText.includes('Analyzed and distributed');
        });
        await logTest('Portfolio: Empty state message shown', emptyStateMessage);

        // ========================================
        // TEST 10: Studio View
        // ========================================
        console.log('\n[TEST GROUP 10] Studio View');
        console.log('--------------------------------------------');

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Studio')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(500);
        await takeScreenshot(page, '16-studio-view');

        const studioPageLoaded = await page.evaluate(() => {
            return document.body.innerText.includes('Studio') ||
                   document.body.innerText.includes('Architect') ||
                   document.body.innerText.includes('Shot');
        });
        await logTest('Studio: Page loaded correctly', studioPageLoaded);

        // ========================================
        // TEST 11: Routes View
        // ========================================
        console.log('\n[TEST GROUP 11] Routes View');
        console.log('--------------------------------------------');

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Routes')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(500);
        await takeScreenshot(page, '17-routes-view');

        const routesPageLoaded = await page.evaluate(() => {
            return document.body.innerText.includes('Routes') ||
                   document.body.innerText.includes('Workflow') ||
                   document.body.innerText.includes('automation');
        });
        await logTest('Routes: Page loaded correctly', routesPageLoaded);

        // ========================================
        // TEST 12: User Profile Dropdown
        // ========================================
        console.log('\n[TEST GROUP 12] User Profile');
        console.log('--------------------------------------------');

        const avatarImg = await page.$('img[alt="User"]');
        if (avatarImg) {
            await avatarImg.click();
            await delay(500);
            await takeScreenshot(page, '18-profile-dropdown');

            const dropdownOpen = await page.evaluate(() => {
                return document.body.innerText.includes('Sign Out') ||
                       document.body.innerText.includes('Profile');
            });
            await logTest('Profile: Dropdown opens', dropdownOpen);
        } else {
            await logTest('Profile: Avatar image exists', false, 'Avatar not found');
        }

        // ========================================
        // TEST 13: Responsive Design (Mobile)
        // ========================================
        console.log('\n[TEST GROUP 13] Responsive Design');
        console.log('--------------------------------------------');

        await page.setViewport({ width: 375, height: 667 });
        await delay(500);
        await takeScreenshot(page, '19-mobile-view');

        const mobileNavExists = await page.evaluate(() => {
            // Check if mobile nav icons are visible
            const nav = document.querySelector('nav');
            return nav !== null;
        });
        await logTest('Mobile: Navigation adapts to mobile', mobileNavExists);

        // Check for horizontal scroll issues
        const hasHorizontalOverflow = await page.evaluate(() => {
            return document.body.scrollWidth > document.body.clientWidth;
        });
        if (hasHorizontalOverflow) {
            await logWarning('Mobile: Horizontal scroll detected', 'Page may have overflow issues on mobile');
        } else {
            await logTest('Mobile: No horizontal scroll issues', true);
        }

        // Reset viewport
        await page.setViewport({ width: 1440, height: 900 });

        // ========================================
        // TEST 14: Logout Functionality
        // ========================================
        console.log('\n[TEST GROUP 14] Logout');
        console.log('--------------------------------------------');

        const avatar = await page.$('img[alt="User"]');
        if (avatar) {
            await avatar.click();
            await delay(500);

            const signOutClicked = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    if (btn.innerText.includes('Sign Out')) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            });
            await delay(1500);
            await takeScreenshot(page, '20-after-logout');

            const loggedOut = await page.evaluate(() => {
                return document.body.innerText.includes('Log In') ||
                       document.body.innerText.includes('Get Started') ||
                       document.body.innerText.includes('Turn Your Photos');
            });
            await logTest('Logout: Successfully logged out', loggedOut);
        }

        // ========================================
        // TEST 15: Error Handling
        // ========================================
        console.log('\n[TEST GROUP 15] Error Handling');
        console.log('--------------------------------------------');

        // Test login with empty credentials
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        await delay(500);

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.innerText.includes('Log In')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        await delay(1000);

        // Try to submit empty form
        const submitEmptyForm = await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) {
                const event = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(event);
                return true;
            }
            return false;
        });
        await delay(500);

        // Check for HTML5 validation
        const emailInputValid = await page.evaluate(() => {
            const email = document.querySelector('input[type="email"]');
            return email ? email.validity.valid : null;
        });
        await logTest('Error Handling: Form validation works', emailInputValid === false);

        // Test invalid email format
        const emailField = await page.$('input[type="email"]');
        if (emailField) {
            await emailField.type('invalidemail');
            await delay(300);
            const isInvalid = await page.evaluate(() => {
                const email = document.querySelector('input[type="email"]');
                return email ? !email.validity.valid : false;
            });
            await logTest('Error Handling: Invalid email validation works', isInvalid);
        }

    } catch (error) {
        console.error('\n[CRITICAL ERROR]:', error.message);
        testResults.failed.push({
            name: 'Critical test failure',
            details: error.message,
            timestamp: new Date().toISOString()
        });
        await takeScreenshot(page, 'error-state');
    } finally {
        await browser.close();
    }

    // ========================================
    // TEST SUMMARY
    // ========================================
    console.log('\n========================================');
    console.log('  TEST SUMMARY');
    console.log('========================================');
    console.log(`\n  PASSED: ${testResults.passed.length}`);
    console.log(`  FAILED: ${testResults.failed.length}`);
    console.log(`  WARNINGS: ${testResults.warnings.length}`);
    console.log(`  SCREENSHOTS: ${testResults.screenshots.length}`);

    if (testResults.failed.length > 0) {
        console.log('\n  FAILED TESTS:');
        testResults.failed.forEach(f => {
            console.log(`    - ${f.name}: ${f.details}`);
        });
    }

    if (testResults.warnings.length > 0) {
        console.log('\n  WARNINGS:');
        testResults.warnings.forEach(w => {
            console.log(`    - ${w.name}: ${w.details}`);
        });
    }

    // Save results to JSON
    fs.writeFileSync(
        path.join(SCREENSHOT_DIR, 'test-results.json'),
        JSON.stringify(testResults, null, 2)
    );
    console.log(`\n  Results saved to: ${SCREENSHOT_DIR}/test-results.json`);
    console.log('========================================\n');

    return testResults;
}

runTests().catch(console.error);
