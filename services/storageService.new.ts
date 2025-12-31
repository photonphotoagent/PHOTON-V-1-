import { ActiveImage } from '../types';
import * as api from './api';

// Configuration
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

// IndexedDB configuration (fallback for offline/development)
const DB_NAME = 'PhotonAgentDB';
const STORE_NAME = 'portfolio_images';
const DB_VERSION = 1;

// Helper to open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// Local IndexedDB operations
const localSaveImage = async (image: ActiveImage): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const imageToSave = { ...image, lastModified: Date.now() };
    store.put(imageToSave);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to save image to IndexedDB:', error);
    throw error;
  }
};

const localGetAllImages = async (): Promise<ActiveImage[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as ActiveImage[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load images from IndexedDB:', error);
    return [];
  }
};

const localDeleteImage = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to delete image from IndexedDB:', error);
    throw error;
  }
};

// Backend API operations
const backendSaveImage = async (image: ActiveImage): Promise<void> => {
  try {
    // First, upload the image to the backend
    const uploadResponse = await api.uploadImageBase64(
      image.data.base64,
      image.data.mimeType,
      `image_${image.id}`
    );

    if (!uploadResponse.success || !uploadResponse.data) {
      throw new Error(uploadResponse.error || 'Failed to upload image');
    }

    // If the image has analysis, save it
    if (image.analysis) {
      await api.saveAnalysis(uploadResponse.data.id, {
        scores: image.analysis.scores,
        monetization: image.analysis.monetization_strategy,
        curation: image.analysis.curation_insights,
        socialStrategy: image.analysis.social_media_strategy,
        marketComparison: image.analysis.market_comparison,
        creativeRemixes: image.analysis.creative_remixes,
      });
    }

    // Also save to local IndexedDB for offline access
    await localSaveImage({
      ...image,
      id: uploadResponse.data.id, // Update with server-assigned ID
    });
  } catch (error) {
    console.error('Failed to save image to backend:', error);
    // Fall back to local storage
    await localSaveImage(image);
    throw error;
  }
};

const backendGetAllImages = async (): Promise<ActiveImage[]> => {
  try {
    const response = await api.getImages(true);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch images');
    }

    // Transform backend records to ActiveImage format
    const images: ActiveImage[] = await Promise.all(
      response.data.map(async (record) => {
        // Fetch the actual image data
        const imageDataResponse = await api.getImageBase64(record.id);

        if (!imageDataResponse.success || !imageDataResponse.data) {
          throw new Error('Failed to fetch image data');
        }

        const activeImage: ActiveImage = {
          id: record.id,
          data: {
            base64: imageDataResponse.data.base64,
            mimeType: imageDataResponse.data.mimeType,
            preview: `data:${imageDataResponse.data.mimeType};base64,${imageDataResponse.data.base64}`,
          },
          analysis: null,
          isAnalyzed: record.is_analyzed,
          isLoading: false,
          isDistributed: record.is_distributed,
          lastModified: new Date(record.updated_at).getTime(),
        };

        // Fetch analysis if available
        if (record.is_analyzed) {
          const analysisResponse = await api.getAnalysis(record.id);
          if (analysisResponse.success && analysisResponse.data) {
            const analysisData = analysisResponse.data as any;
            activeImage.analysis = {
              scores: analysisData.scores,
              monetization_strategy: analysisData.monetization,
              curation_insights: analysisData.curation,
              social_media_strategy: analysisData.socialStrategy,
              market_comparison: analysisData.marketComparison,
              creative_remixes: analysisData.creativeRemixes,
            };
          }
        }

        return activeImage;
      })
    );

    // Sync to local IndexedDB
    for (const image of images) {
      await localSaveImage(image).catch(console.error);
    }

    return images;
  } catch (error) {
    console.error('Failed to fetch images from backend:', error);
    // Fall back to local storage
    return localGetAllImages();
  }
};

const backendDeleteImage = async (id: string): Promise<void> => {
  try {
    const response = await api.deleteImage(id);

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete image');
    }

    // Also delete from local IndexedDB
    await localDeleteImage(id);
  } catch (error) {
    console.error('Failed to delete image from backend:', error);
    // Still try to delete locally
    await localDeleteImage(id);
    throw error;
  }
};

// Exported functions that choose between backend and local storage
export const saveImage = async (image: ActiveImage): Promise<void> => {
  if (USE_BACKEND) {
    return backendSaveImage(image);
  }
  return localSaveImage(image);
};

export const getAllImages = async (): Promise<ActiveImage[]> => {
  if (USE_BACKEND) {
    return backendGetAllImages();
  }
  return localGetAllImages();
};

export const deleteImage = async (id: string): Promise<void> => {
  if (USE_BACKEND) {
    return backendDeleteImage(id);
  }
  return localDeleteImage(id);
};

export const clearDatabase = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to clear DB', error);
  }
};

// Sync local data to backend (for when connection is restored)
export const syncToBackend = async (): Promise<{ synced: number; failed: number }> => {
  if (!USE_BACKEND) {
    return { synced: 0, failed: 0 };
  }

  const localImages = await localGetAllImages();
  let synced = 0;
  let failed = 0;

  for (const image of localImages) {
    try {
      await backendSaveImage(image);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
};
