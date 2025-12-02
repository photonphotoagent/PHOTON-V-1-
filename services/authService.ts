import { PlatformName, User } from '../types';

const simulateNetworkDelay = (min = 500, max = 1500) => 
    new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

// --- Configuration ---
// TO ENABLE SHEET COLLECTION:
// 1. Create a Google Sheet > Extensions > Apps Script.
// 2. Deploy a script with a doPost(e) function that appends rows.
// 3. Deploy as Web App -> Execute as: Me -> Who has access: Anyone.
// 4. Paste the 'Current web app URL' below.
const GOOGLE_SHEET_WEB_APP_URL = ""; 

// --- Mock User Data ---
const MOCK_USER: User = {
    id: 'user_123',
    name: 'Creative Pro',
    email: 'artist@photon.ai',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
    plan: 'Pro',
    experienceLevel: 'Pro',
    archiveSize: 'Large'
};

// --- Helper: Log to Sheet ---
const logUserToSheet = async (user: User) => {
    // Console log to show intent in dev mode
    console.log(`[LEAD_CAPTURE] Processing signup for: ${user.email}`);

    if (!GOOGLE_SHEET_WEB_APP_URL) {
        console.log("[LEAD_CAPTURE] No Sheet URL configured. Skipping remote save.");
        return;
    }

    try {
        const formData = new FormData();
        formData.append('timestamp', new Date().toISOString());
        formData.append('user_id', user.id);
        formData.append('name', user.name);
        formData.append('email', user.email);
        formData.append('experience_level', user.experienceLevel || 'Not Specified');
        formData.append('archive_size', user.archiveSize || 'Not Specified');
        formData.append('plan', user.plan);

        // 'no-cors' is required for Google Apps Script Web Apps invoked from browser
        await fetch(GOOGLE_SHEET_WEB_APP_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
        console.log("[LEAD_CAPTURE] Successfully sent to Google Sheet.");
    } catch (error) {
        console.error("[LEAD_CAPTURE] Failed to log to Google Sheet:", error);
    }
};

// --- Auth Functions ---

export const login = async (email: string, password: string): Promise<User> => {
    await simulateNetworkDelay(800, 1500);
    
    // Simple mock validation
    if (email.includes('@') && password.length > 3) {
        const user = { ...MOCK_USER, email };
        localStorage.setItem('photon_user', JSON.stringify(user));
        return user;
    } else {
        throw new Error('Invalid credentials');
    }
};

export const loginWithGoogle = async (): Promise<User> => {
    await simulateNetworkDelay(1000, 2000);
    // Mock Google User
    const user: User = {
        id: 'google_user_' + Date.now(),
        name: 'Google User',
        email: 'google.user@gmail.com',
        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c', // Generic Google-like avatar
        plan: 'Free',
        experienceLevel: 'Enthusiast',
        archiveSize: 'Medium'
    };
    localStorage.setItem('photon_user', JSON.stringify(user));
    
    // Capture the lead
    logUserToSheet(user);

    return user;
};

export const signup = async (
    name: string, 
    email: string, 
    password: string,
    experienceLevel?: User['experienceLevel'],
    archiveSize?: User['archiveSize']
): Promise<User> => {
    await simulateNetworkDelay(1000, 2000);
    if (email && password) {
         const user: User = { 
             ...MOCK_USER, 
             name, 
             email, 
             id: `user_${Date.now()}`,
             experienceLevel: experienceLevel || 'Beginner',
             archiveSize: archiveSize || 'Small'
         };
         localStorage.setItem('photon_user', JSON.stringify(user));
         
         // Capture the lead
         logUserToSheet(user);

         return user;
    }
    throw new Error('Please fill out all fields');
};

export const logout = async (): Promise<void> => {
    await simulateNetworkDelay(200, 500);
    localStorage.removeItem('photon_user');
};

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem('photon_user');
    return stored ? JSON.parse(stored) : null;
};

// --- Platform Connection Functions ---

export const connectToPlatform = async (platform: PlatformName): Promise<{ success: boolean }> => {
    console.log(`Initiating connection to ${platform}...`);
    await simulateNetworkDelay();
    
    // Simulate a failure for a specific platform for demonstration
    if (platform === 'Getty Images' && Math.random() < 0.5) {
        console.error(`Failed to connect to ${platform}.`);
        return { success: false };
    }

    console.log(`Successfully connected to ${platform}.`);
    return { success: true };
};

export const disconnectFromPlatform = async (platform: PlatformName): Promise<{ success: boolean }> => {
    console.log(`Disconnecting from ${platform}...`);
    await simulateNetworkDelay(200, 500);
    console.log(`Successfully disconnected from ${platform}.`);
    return { success: true };
};