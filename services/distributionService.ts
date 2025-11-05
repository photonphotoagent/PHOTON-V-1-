import { ImageData, PlatformName, DistributionStatus, DistributionResult } from '../types';

const simulateNetworkDelay = (min = 500, max = 1500) => 
    new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

/**
 * Simulates distributing an image to various marketplaces.
 * Provides real-time progress updates via a callback.
 */
export const distributeImage = async (
    imageData: ImageData,
    platforms: PlatformName[],
    metadata: { keywords: string[] },
    onProgress: (status: DistributionStatus) => void
): Promise<DistributionResult> => {
    
    const initialStatus: DistributionStatus[] = platforms.map(p => ({
        platform: p,
        status: 'pending',
        message: `Queued for ${p}`
    }));
    initialStatus.forEach(onProgress);

    const results: DistributionResult = { success: [], failed: [] };

    for (const platform of platforms) {
        try {
            // Simulate API key failure (20% chance)
            if (Math.random() < 0.2) {
                throw new Error('API call failed. FAILED_PRECONDITION: Requested entity was not found. Or you don\'t have permissions to access it.');
            }

            // More detailed simulation for Redbubble
            if (platform === 'Redbubble') {
                onProgress({ platform, status: 'processing', message: 'Authenticating with Redbubble API...'});
                await simulateNetworkDelay(700, 1000);
                onProgress({ platform, status: 'processing', message: 'Creating new work on Redbubble...'});
                await simulateNetworkDelay(500, 800);
                onProgress({ platform, status: 'uploading', message: `Uploading image file to Redbubble...` });
                await simulateNetworkDelay(1500, 2500);
                 onProgress({ platform, status: 'processing', message: `Applying metadata and tags...`});
                await simulateNetworkDelay(700, 1000);
                 onProgress({ platform, status: 'processing', message: `Publishing work...`});
                 await simulateNetworkDelay(500, 800);
            } else {
                // Generic simulation for other platforms
                onProgress({ platform, status: 'uploading', message: `Uploading to ${platform}...` });
                await simulateNetworkDelay();
                onProgress({ platform, status: 'processing', message: `Processing metadata for ${platform}...` });
                await simulateNetworkDelay(1000, 2000);
            }

            // Simulate random rejection (10% chance)
            if (Math.random() < 0.1) {
                const reason = platform === 'Redbubble' 
                    ? 'Image rejected by Redbubble review team for content violation.'
                    : 'Image rejected due to metadata policy violation.';
                throw new Error(reason);
            }

            // Success
            onProgress({ platform, status: 'success', message: `Successfully submitted to ${platform}!` });
            results.success.push(platform);

        } catch (e) {
            const reason = e instanceof Error ? e.message : 'An unknown error occurred.';
            onProgress({ platform, status: 'error', message: `Failed: ${reason}` });
            results.failed.push({ platform, reason });
            // Re-throw critical API key errors to be handled by the UI
            if (reason.includes("Requested entity was not found")) {
                throw e;
            }
        }
    }

    return results;
};


/**
 * Simulates posting to a single social media platform.
 */
export const postToSocial = async (platform: PlatformName, postText: string): Promise<{ success: boolean }> => {
    await simulateNetworkDelay(1000, 2000);

    // 5% chance of failure
    if (Math.random() < 0.05) {
        throw new Error('API connection failed.');
    }

    console.log(`Posted to ${platform}: "${postText}"`);
    return { success: true };
};
