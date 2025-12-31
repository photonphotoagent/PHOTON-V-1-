import React, { useState, useEffect } from 'react';
import { AppView, User, ActiveImage, Connections, ImageData, Platform } from './types';
import * as AuthService from './services/authService';
import * as StorageService from './services/storageService';

// Layout Components
import { Header } from './components/layout/Header';

// View Components
import { LightBoxView } from './components/views/LightBoxView';
import { EditView } from './components/views/EditView';
import { StudioView } from './components/views/StudioView';
import { RoutesView } from './components/views/RoutesView';

// Existing Components
import { WelcomeScreen } from './components/WelcomeScreen';
import { EarningsDashboard } from './components/EarningsDashboard';
import { SettingsView } from './components/SettingsView';
import { PortfolioView } from './components/PortfolioView';
import { LoginView } from './components/LoginView';

// Platform data
export const platforms: Platform[] = [
  { name: 'Adobe Stock', category: 'Stock', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Adobe_Stock_logo.svg/2560px-Adobe_Stock_logo.svg.png' },
  { name: 'Getty Images', category: 'Stock', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Getty_Images_logo.svg/2560px-Getty_Images_logo.svg.png' },
  { name: 'Shutterstock', category: 'Stock', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Shutterstock_logo.svg/2560px-Shutterstock_logo.svg.png' },
  { name: 'Alamy', category: 'Stock', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Alamy_Logo.svg/2560px-Alamy_Logo.svg.png' },
  { name: '500px', category: 'Stock', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/500px_logo.svg/2560px-500px_logo.svg.png' },
  { name: 'Etsy', category: 'Print', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Etsy_logo.svg/2560px-Etsy_logo.svg.png' },
  { name: 'Redbubble', category: 'Print', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Redbubble_logo.svg/1200px-Redbubble_logo.svg.png' },
  { name: 'Society6', category: 'Print', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Society6_logo.svg/2560px-Society6_logo.svg.png' },
  { name: 'Fine Art America', category: 'Print', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/FineArtAmerica_Logo.png' },
  { name: 'Instagram', category: 'Social', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png' },
  { name: 'Pinterest', category: 'Social', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png' },
  { name: 'TikTok', category: 'Social', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/2560px-TikTok_logo.svg.png' },
  { name: 'X (Twitter)', category: 'Social', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/X_logo_2023.svg/2266px-X_logo_2023.svg.png' },
  { name: 'Facebook', category: 'Social', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png' },
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.WELCOME);
  const [user, setUser] = useState<User | null>(null);
  const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);
  const [connections, setConnections] = useState<Connections>({ 'Instagram': true });
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<ActiveImage[]>([]);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = AuthService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      setActiveView(AppView.LIGHT_BOX);
    }
  }, []);

  // Load portfolio images when user logs in
  useEffect(() => {
    if (user) {
      StorageService.getAllImages()
        .then(setPortfolioImages)
        .catch(console.error);
    }
  }, [user]);

  // Check for API key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey);
      } else {
        setIsApiKeySelected(!!import.meta.env.VITE_GEMINI_API_KEY);
      }
    };
    checkApiKey();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveView(AppView.LIGHT_BOX);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setActiveImage(null);
    setPortfolioImages([]);
    setActiveView(AppView.WELCOME);
  };

  const handleSendToLightBox = (imageData: ImageData, shouldAnalyze: boolean) => {
    const newImage: ActiveImage = {
      id: Date.now().toString(),
      data: imageData,
      analysis: null,
      isAnalyzed: false,
      isLoading: shouldAnalyze,
    };
    setActiveImage(newImage);
    setActiveView(AppView.LIGHT_BOX);
  };

  const handlePortfolioUpdate = (updatedImage: ActiveImage) => {
    // Update active image if it matches
    if (activeImage?.id === updatedImage.id) {
      setActiveImage(updatedImage);
    }

    // Update portfolio list
    setPortfolioImages((prev) => {
      const index = prev.findIndex((img) => img.id === updatedImage.id);
      if (index > -1) {
        const newList = [...prev];
        newList[index] = updatedImage;
        return newList;
      }
      return [updatedImage, ...prev];
    });

    // Persist to storage
    StorageService.saveImage(updatedImage).catch(console.error);
  };

  return (
    <div className="bg-[#05050A] min-h-screen text-white font-sans selection:bg-indigo-500/30">
      {user && (
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          user={user}
          onLogout={handleLogout}
        />
      )}

      <main>
        {activeView === AppView.WELCOME && (
          <WelcomeScreen
            onLogin={() => setActiveView(AppView.LOGIN)}
            onSignup={() => setActiveView(AppView.LOGIN)}
          />
        )}

        {activeView === AppView.LOGIN && (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        )}

        {user && (
          <>
            {activeView === AppView.LIGHT_BOX && (
              <LightBoxView
                activeImage={activeImage}
                setActiveImage={setActiveImage}
                switchToEditView={(imgData) => {
                  setActiveImage((prev) => (prev ? { ...prev, data: imgData } : null));
                  setActiveView(AppView.EDIT);
                }}
                connections={connections}
                isApiKeySelected={isApiKeySelected}
                setIsApiKeySelected={setIsApiKeySelected}
                onPortfolioUpdate={handlePortfolioUpdate}
                onNavigateToStudio={() => setActiveView(AppView.STUDIO)}
                onSelectApiKey={() => (window as any).aistudio?.openSelectKey()}
                onUploadNew={() => setActiveImage(null)}
              />
            )}

            {activeView === AppView.EDIT && (
              <EditView
                initialImage={activeImage?.data || null}
                analysis={activeImage?.analysis || null}
                onSendToLightBox={handleSendToLightBox}
                onUploadNew={() => {
                  setActiveImage(null);
                  setActiveView(AppView.LIGHT_BOX);
                }}
              />
            )}

            {activeView === AppView.STUDIO && (
              <StudioView
                onGenerate={(concept) => console.log(concept)}
                onSendToLightBox={(img) => handleSendToLightBox(img, false)}
              />
            )}

            {activeView === AppView.ROUTES && <RoutesView />}

            {activeView === AppView.EARNINGS && <EarningsDashboard />}

            {activeView === AppView.PORTFOLIO && (
              <PortfolioView portfolioImages={portfolioImages} />
            )}

            {activeView === AppView.SETTINGS && (
              <SettingsView
                connections={connections}
                setConnections={setConnections}
                isApiKeySelected={isApiKeySelected}
                onConnectGoogleCloud={() => (window as any).aistudio?.openSelectKey()}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
