import { ActiveImage, PerformanceData, PlatformName } from '../types';

const simulateNetworkDelay = (min = 500, max = 1500) => 
    new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

/**
 * Simulates fetching performance data for an image from various marketplaces.
 */
export const fetchPerformanceData = async (image: ActiveImage): Promise<PerformanceData> => {
    await simulateNetworkDelay();

    const performanceData: PerformanceData = {};
    const distributedPlatforms = image.distributionResult?.success ?? [];

    for (const platform of distributedPlatforms) {
        // Generate more plausible data based on platform type
        const isStock = ['Adobe Stock', 'Getty Images', 'Shutterstock'].includes(platform);
        
        const baseViews = Math.floor(Math.random() * (isStock ? 50000 : 10000)) + 500;
        const baseDownloads = Math.floor(Math.random() * (baseViews / (isStock ? 100 : 50))) + 10;
        const earningsPerDownload = isStock ? (Math.random() * 5 + 0.5) : (Math.random() * 25 + 5);
        const baseEarnings = parseFloat((baseDownloads * earningsPerDownload).toFixed(2));

        const earningsOverTime = Array.from({ length: 30 }, (_, i) => {
            // Simulate some variance and slight growth over time
            const randomFactor = (Math.random() - 0.4); // allow some dips
            const dayEarnings = (baseEarnings / 30) * (1 + (i / 45)) + randomFactor; // Slower growth factor
            return {
                day: i + 1,
                amount: Math.max(0, parseFloat(dayEarnings.toFixed(2)))
            };
        });
        
        performanceData[platform] = {
            views: baseViews,
            downloads: baseDownloads,
            earnings: baseEarnings,
            earningsOverTime: earningsOverTime,
        };
    }
    
    return performanceData;
};