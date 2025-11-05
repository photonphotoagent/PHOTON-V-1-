import { PlatformName } from '../types';

const simulateNetworkDelay = (min = 500, max = 1500) => 
    new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

/**
 * Simulates an OAuth or API key connection flow.
 * In a real app, this would involve opening a new window, redirecting,
 * and handling callbacks.
 */
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

/**
 * Simulates disconnecting from a platform.
 */
export const disconnectFromPlatform = async (platform: PlatformName): Promise<{ success: boolean }> => {
    console.log(`Disconnecting from ${platform}...`);
    await simulateNetworkDelay(200, 500);
    console.log(`Successfully disconnected from ${platform}.`);
    return { success: true };
};
