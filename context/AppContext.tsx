import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppView, ActiveImage, Connections, PlatformName, ImageData } from '../types';
import * as StorageService from '../services/storageService';

interface AppContextType {
  // Navigation
  activeView: AppView;
  setActiveView: (view: AppView) => void;

  // Image state
  activeImage: ActiveImage | null;
  setActiveImage: React.Dispatch<React.SetStateAction<ActiveImage | null>>;
  portfolioImages: ActiveImage[];
  setPortfolioImages: React.Dispatch<React.SetStateAction<ActiveImage[]>>;

  // Platform connections
  connections: Connections;
  setConnections: React.Dispatch<React.SetStateAction<Connections>>;

  // API key state
  isApiKeySelected: boolean;
  setIsApiKeySelected: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions
  sendToLightBox: (imageData: ImageData, shouldAnalyze: boolean) => void;
  updatePortfolioImage: (image: ActiveImage) => void;
  loadPortfolioImages: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [activeView, setActiveView] = useState<AppView>(AppView.WELCOME);
  const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<ActiveImage[]>([]);
  const [connections, setConnections] = useState<Connections>({ 'Instagram': true });
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);

  const sendToLightBox = useCallback((imageData: ImageData, shouldAnalyze: boolean) => {
    const newImage: ActiveImage = {
      id: Date.now().toString(),
      data: imageData,
      analysis: null,
      isAnalyzed: false,
      isLoading: shouldAnalyze,
    };
    setActiveImage(newImage);
    setActiveView(AppView.LIGHT_BOX);
  }, []);

  const updatePortfolioImage = useCallback((updatedImage: ActiveImage) => {
    setActiveImage((prev) =>
      prev?.id === updatedImage.id ? updatedImage : prev
    );

    setPortfolioImages((prev) => {
      const index = prev.findIndex((img) => img.id === updatedImage.id);
      if (index > -1) {
        const newList = [...prev];
        newList[index] = updatedImage;
        return newList;
      }
      return [updatedImage, ...prev];
    });

    // Save to storage
    StorageService.saveImage(updatedImage).catch(console.error);
  }, []);

  const loadPortfolioImages = useCallback(async () => {
    try {
      const images = await StorageService.getAllImages();
      setPortfolioImages(images);
    } catch (error) {
      console.error('Failed to load portfolio images:', error);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        activeImage,
        setActiveImage,
        portfolioImages,
        setPortfolioImages,
        connections,
        setConnections,
        isApiKeySelected,
        setIsApiKeySelected,
        sendToLightBox,
        updatePortfolioImage,
        loadPortfolioImages,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
