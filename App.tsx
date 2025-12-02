
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppView, ChatMessage as ChatMessageType, AnalysisResult, ImageData, ActiveImage, Connections, PlatformName, DistributionStatus, DistributionResult, Platform, User, Workflow, WorkflowStep, EditHistoryItem, ImageAdjustments, CalendarEvent, ShotConcept } from './types';
import * as GeminiService from './services/geminiService';
import * as DistributionService from './services/distributionService';
import * as AuthService from './services/authService';
import * as StorageService from './services/storageService';
import { Spinner } from './components/Spinner';
import { LightBoxIcon, ChatIcon, EditIcon, StudioIcon, CheckCircleIcon, XCircleIcon, WrenchScrewdriverIcon, InstagramIcon, PinterestIcon, LinkedInIcon, ShoppingCartIcon, DollarSignIcon, SettingsIcon, DownloadIcon, SparklesIcon, ScissorsIcon, PaintBrushIcon, ArrowsPointingOutIcon, RectangleStackIcon, ChartBarIcon, ViewfinderIcon, SunIcon, BookOpenIcon, BoltIcon, PuzzlePieceIcon, ArrowRightIcon, PlayIcon, StopIcon, CheckBadgeIcon, GoogleIcon, EyeIcon, ArrowDownTrayIcon, ArrowTrendingUpIcon, ArrowPathIcon, PhotoIcon, AdjustmentsIcon, SwatchIcon, ApertureIcon, MapIcon, UserIcon, SplitToningIcon, CurvesIcon, EyeDropperIcon, BeakerIcon } from './components/icons';
import { Chat } from '@google/genai';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EarningsDashboard } from './components/EarningsDashboard';
import { CopyButton } from './components/CopyButton';
import { SettingsView } from './components/SettingsView';
import { PortfolioView } from './components/PortfolioView';
import { LoginView } from './components/LoginView';
import { AnalysisDashboard } from './components/AnalysisDashboard';

// --- Constants ---
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

// Helper function
const fileToImageData = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type, preview: URL.createObjectURL(file) });
    };
    reader.onerror = (error) => reject(error);
  });
};

const downloadImage = (base64: string, filename: string) => {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Reusable UI Components ---

interface ImageUploaderProps {
  onImageUpload: (data: ImageData) => void;
  imagePreview: string | null;
  isLoading: boolean;
  promptText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreview, isLoading, promptText = "Drop your work here to begin." }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageData = await fileToImageData(file);
        onImageUpload(imageData);
      } catch (error) {
        console.error("Error converting file to base64", error);
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] border border-dashed border-white/10 rounded-2xl text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-500 relative flex items-center justify-center bg-surface group overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
      <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleFileChange} disabled={isLoading}/>
      <label htmlFor="image-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-8 z-10">
        {imagePreview ? (
          <div className="relative w-full h-full flex items-center justify-center">
              <img src={imagePreview} alt="Preview" className={`max-h-[80vh] rounded-lg transition-opacity ${isLoading ? 'opacity-30 blur-sm' : 'opacity-100'} shadow-2xl border border-white/10`} />
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                         <Spinner />
                    </div>
                    <p className="mt-4 text-xl font-display font-bold text-white tracking-wide animate-pulse drop-shadow-lg">Initializing Analysis...</p>
                </div>
              )}
          </div>
        ) : (
          !isLoading && (
            <div className="text-gray-400 space-y-6 transition-transform group-hover:-translate-y-2 duration-500">
              <div className="w-24 h-24 bg-surfaceHighlight rounded-3xl flex items-center justify-center mx-auto border border-white/5 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform duration-500">
                  <LightBoxIcon className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="space-y-2">
                  <p className="text-3xl font-display font-bold text-white tracking-tight">{promptText}</p>
                  <p className="text-base text-gray-500 max-w-sm mx-auto font-light">
                      Upload high-res imagery for monetization scoring and enhancement.
                  </p>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-full font-medium text-sm backdrop-blur-md transition-all">
                  <span>Select from device</span>
                  <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>
          )
        )}
      </label>
    </div>
  );
};

interface HeaderProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, user, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const navItems = [
    { view: AppView.LIGHT_BOX, icon: LightBoxIcon, label: 'Light Box' },
    { view: AppView.PORTFOLIO, icon: RectangleStackIcon, label: 'Portfolio' },
    { view: AppView.EARNINGS, icon: DollarSignIcon, label: 'Earnings' },
    { view: AppView.EDIT, icon: EditIcon, label: 'Editor' },
    { view: AppView.STUDIO, icon: StudioIcon, label: 'Studio' },
    { view: AppView.ROUTES, icon: MapIcon, label: 'Routes' },
    { view: AppView.SETTINGS, icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 shadow-2xl flex justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView(AppView.LIGHT_BOX)}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <BoltIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="hidden md:block text-xl font-display font-bold text-white tracking-tight">Photon<span className="text-indigo-400">Agent</span></h1>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
              {navItems.map(item => {
                const isActive = activeView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => setActiveView(item.view)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive 
                        ? 'bg-gray-800 text-white shadow-lg border border-white/5' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile Nav (Icon only) */}
            <nav className="md:hidden flex space-x-4">
                {navItems.slice(0, 4).map(item => (
                    <button
                        key={item.view}
                        onClick={() => setActiveView(item.view)}
                        className={`p-2 rounded-lg transition-colors ${activeView === item.view ? 'text-indigo-400 bg-white/5' : 'text-gray-400'}`}
                    >
                        <item.icon className="h-6 w-6" />
                    </button>
                ))}
            </nav>

            {/* User Profile */}
            <div className="relative">
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 focus:outline-none pl-4 border-l border-white/10"
                >
                    <div className="text-right hidden lg:block">
                        <p className="text-sm font-display font-bold text-white leading-none">{user?.name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mt-1">{user?.plan} Plan</p>
                    </div>
                    <img 
                        src={user?.avatar || "https://via.placeholder.com/150"} 
                        alt="User" 
                        className="h-9 w-9 rounded-full border border-white/10 object-cover shadow-lg"
                    />
                </button>

                {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-4 w-56 bg-surfaceHighlight/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 py-2 animate-fade-in-down origin-top-right transform">
                        <div className="px-4 py-3 border-b border-white/5">
                            <p className="text-sm text-white font-bold">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                             <UserIcon className="w-4 h-4" /> Profile
                        </button>
                        <button 
                            onClick={() => setActiveView(AppView.SETTINGS)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                        >
                             <SettingsIcon className="w-4 h-4" /> Settings
                        </button>
                        <div className="my-1 border-t border-white/5"></div>
                        <button 
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 font-medium"
                        >
                            <ArrowRightIcon className="w-4 h-4 rotate-180" /> Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </header>
  );
};

const LightBoxView: React.FC<{
  activeImage: ActiveImage | null;
  setActiveImage: React.Dispatch<React.SetStateAction<ActiveImage | null>>;
  switchToEditView: (imageData: ImageData) => void;
  connections: Connections;
  isApiKeySelected: boolean;
  setIsApiKeySelected: React.Dispatch<React.SetStateAction<boolean>>;
  onPortfolioUpdate: (image: ActiveImage) => void;
  onNavigateToStudio: () => void;
  onSelectApiKey: () => void;
}> = ({ activeImage, setActiveImage, switchToEditView, connections, isApiKeySelected, setIsApiKeySelected, onPortfolioUpdate, onNavigateToStudio, onSelectApiKey }) => {
  const [editingState, setEditingState] = useState({ isEditing: false, suggestion: '' });
  const [distributionStatus, setDistributionStatus] = useState<DistributionStatus[]>([]);
  const [distributionResult, setDistributionResult] = useState<DistributionResult | null>(null);

  const handleImageUpload = async (imageData: ImageData) => {
    const imageId = Date.now().toString();
    
    let currentImage: ActiveImage = {
      id: imageId,
      data: imageData,
      analysis: null,
      isAnalyzed: false,
      isLoading: true
    };
    setActiveImage(currentImage);
    setDistributionResult(null);
    setDistributionStatus([]);

    try {
      const analysisResult = await GeminiService.analyzeImage(imageData.base64, imageData.mimeType);
      
      currentImage = {
          ...currentImage,
          analysis: analysisResult,
          isAnalyzed: true,
          isLoading: false,
      };
      setActiveImage(currentImage);
      onPortfolioUpdate(currentImage);

    } catch (error) {
      console.error("Error analyzing image:", error);
      setActiveImage(prev => {
        if (!prev || prev.id !== imageId) return prev; // Stale request, ignore
        return { ...prev, isLoading: false, analysis: null }; // Reset on error
      });
    }
  };

  const handleApplyEdit = async (suggestion: string) => {
    if (!activeImage) return;
    setEditingState({ isEditing: true, suggestion: suggestion });
    try {
      const newBase64 = await GeminiService.editImage(suggestion, activeImage.data.base64, activeImage.data.mimeType);
      const newImageData = {
        base64: newBase64,
        mimeType: 'image/png', // Gemini image editing likely returns PNG
        preview: `data:image/png;base64,${newBase64}`,
      };
      await handleImageUpload(newImageData);
    } catch (error) {
      console.error("Error applying edit:", error);
    } finally {
      setEditingState({ isEditing: false, suggestion: '' });
    }
  };
  
  const handleDistribute = async (platforms: PlatformName[]) => {
      if (!activeImage || !activeImage.analysis) return;
      setDistributionStatus([]);
      setDistributionResult(null);
      
      try {
        const result = await DistributionService.distributeImage(
            activeImage.data,
            platforms,
            { keywords: activeImage.analysis.monetization_strategy.suggested_keywords },
            (statusUpdate) => {
                setDistributionStatus(prev => {
                    const existingIndex = prev.findIndex(s => s.platform === statusUpdate.platform && s.status === statusUpdate.status);
                    if (existingIndex > -1) {
                         const updated = [...prev];
                         updated[existingIndex] = statusUpdate;
                         return updated;
                    }
                    return [...prev, statusUpdate];
                });
            }
        );
        setDistributionResult(result);
        if (result.success.length > 0) {
            const updatedImage = { ...activeImage, isDistributed: true, distributionResult: result };
            setActiveImage(updatedImage);
            onPortfolioUpdate(updatedImage);
        }
      } catch (error: any) {
        if (typeof error.message === 'string' && error.message.includes("Requested entity was not found.")) {
          console.error("API Key error during distribution:", error);
          alert("Distribution failed due to an invalid API Key. Please select a valid key and try again.");
          setIsApiKeySelected(false);
        } else {
            console.error("An unexpected error occurred during distribution:", error);
            alert("An unexpected error occurred during distribution. Please check the console for details.");
        }
      }
  };

  const handleReAnalyze = () => {
    if (!activeImage) return;
    handleImageUpload(activeImage.data);
  };

  const handleReset = () => {
    setActiveImage(null);
    setDistributionResult(null);
    setDistributionStatus([]);
  };

  const handleManualEditClick = () => {
    if (activeImage) {
        switchToEditView(activeImage.data);
    }
  };

  const handleDownload = () => {
    if (activeImage) {
        downloadImage(activeImage.data.base64, `photon_agent_${activeImage.id}.png`);
    }
  };
  
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto pt-24">
      {activeImage && activeImage.analysis ? (
        <>
            <div className="flex justify-end mb-6 animate-fade-in">
                <button 
                    onClick={handleManualEditClick}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105 border border-indigo-400/20"
                >
                    <EditIcon className="w-5 h-5"/> Launch Pro Editor
                </button>
            </div>
            <AnalysisDashboard 
              activeImage={activeImage} 
              connections={connections}
              onReset={handleReset} 
              onReAnalyze={handleReAnalyze}
              onApplyEdit={handleApplyEdit}
              onDistribute={handleDistribute}
              onDownloadImage={handleDownload}
              distributionStatus={distributionStatus}
              distributionResult={distributionResult}
              isEditing={editingState.isEditing}
              editingSuggestion={editingState.suggestion}
              isApiKeySelected={isApiKeySelected}
              onSelectApiKey={onSelectApiKey}
            />
        </>
      ) : (
        <div className="max-w-4xl mx-auto pt-12 animate-fade-in-up">
            <ImageUploader
            onImageUpload={handleImageUpload}
            imagePreview={activeImage?.data.preview || null}
            isLoading={activeImage?.isLoading || false}
            />
            
            <div className="mt-8 text-center animate-fade-in delay-500">
                 <p className="text-gray-500 text-sm mb-4">Don't have a photo ready?</p>
                 <button 
                    onClick={onNavigateToStudio}
                    className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 font-bold py-3 px-6 rounded-xl border border-amber-500/30 transition-all uppercase tracking-wide text-xs"
                 >
                     <BeakerIcon className="w-4 h-4" />
                     Launch Shot Architect for Ideas
                 </button>
            </div>
        </div>
      )}
    </div>
  );
};

// --- New Edit View Components ---

const AdjustmentSlider: React.FC<{ label: string; value: number; min: number; max: number; onChange: (val: number) => void }> = ({ label, value, min, max, onChange }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span>{label}</span>
            <span className="text-white bg-white/10 px-1.5 py-0.5 rounded font-mono">{value}</span>
        </div>
        <div className="relative flex items-center h-5">
             <input 
                type="range" 
                min={min} 
                max={max} 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
        </div>
    </div>
);

const TabButton: React.FC<{ 
    active: boolean; 
    icon: React.ReactNode; 
    label: string; 
    onClick: () => void 
}> = ({ active, icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
    >
        {icon}
        <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
    </button>
);

// Define Smart Presets (same config)
const PRESETS: { name: string, adjustments: Partial<ImageAdjustments>, colorClass: string }[] = [
    {
        name: 'Golden Hour',
        adjustments: { exposure: 105, warmth: 20, contrast: 110, saturation: 110, tint: -5 },
        colorClass: 'from-orange-400 to-yellow-500'
    },
    {
        name: 'Moody Matte',
        adjustments: { contrast: 90, shadows: 115, saturation: 85, exposure: 95, blur: 0 },
        colorClass: 'from-gray-600 to-gray-800'
    },
    {
        name: 'Cyberpunk',
        adjustments: { tint: -20, saturation: 130, vibrance: 120, contrast: 115, highlights: 110 },
        colorClass: 'from-pink-500 to-cyan-500'
    },
    {
        name: 'B&W Noir',
        adjustments: { saturation: 0, contrast: 135, grain: 40, vignette: 30, exposure: 105 },
        colorClass: 'from-gray-900 to-black'
    },
    {
        name: 'Film Pop',
        adjustments: { contrast: 110, saturation: 115, grain: 15, warmth: 5 },
        colorClass: 'from-red-500 to-yellow-500'
    },
    {
        name: 'Ethereal',
        adjustments: { exposure: 110, contrast: 95, blur: 1, saturation: 105, warmth: -5 },
        colorClass: 'from-indigo-300 to-purple-300'
    }
];

const EditView: React.FC<{ 
    initialImage: ImageData | null;
    analysis: AnalysisResult | null;
    onSendToLightBox: (imageData: ImageData) => void;
}> = ({ initialImage, analysis, onSendToLightBox }) => {
    const [image, setImage] = useState<ImageData | null>(initialImage);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeQuickEdit, setActiveQuickEdit] = useState<string | null>(null);
    const [history, setHistory] = useState<EditHistoryItem[]>([]);
    const [showCompare, setShowCompare] = useState(false);
    const [compareSplit, setCompareSplit] = useState(50);
    const [activeCategory, setActiveCategory] = useState<'light' | 'color' | 'detail' | 'grade' | 'mixer'>('light');

    // Extended Manual Adjustments - Defaults set to "Middle"
    const defaultAdjustments: ImageAdjustments = { 
        exposure: 100, // Range 50-150, Middle 100
        contrast: 100, // Range 50-150, Middle 100
        highlights: 100, // Range 50-150, Middle 100
        shadows: 100, // Range 50-150, Middle 100
        gamma: 1.0, 
        saturation: 100, // Range 0-200, Middle 100
        vibrance: 100, // Range 0-200, Middle 100
        warmth: 0, // Range -100 to 100, Middle 0
        tint: 0, // Range -180 to 180, Middle 0
        blur: 0, // Off by default
        sharpen: 0, // Off by default
        vignette: 0, // Off by default
        grain: 0, // Off by default
        redChannel: 100, // Range 0-200
        greenChannel: 100, // Range 0-200
        blueChannel: 100, // Range 0-200
        highlightsHue: 0, highlightsSat: 0,
        shadowsHue: 0, shadowsSat: 0
    };
    const [adjustments, setAdjustments] = useState<ImageAdjustments>(defaultAdjustments);

    // Initial history setup
    useEffect(() => {
        if (initialImage && history.length === 0) {
             setHistory([{
                 id: 'initial',
                 thumbnail: initialImage.preview,
                 actionName: 'Original',
                 imageData: initialImage,
                 adjustments: defaultAdjustments,
                 timestamp: Date.now()
             }]);
        }
    }, [initialImage]);

    // --- History Management ---
    const addToHistory = (newImage: ImageData, actionName: string, newAdjustments: ImageAdjustments) => {
        setHistory(prev => [
            {
                id: Date.now().toString(),
                thumbnail: newImage.preview,
                actionName: actionName,
                imageData: newImage,
                adjustments: newAdjustments,
                timestamp: Date.now()
            },
            ...prev
        ]);
    };

    const handleHistoryClick = (item: EditHistoryItem) => {
        setImage(item.imageData);
        if (item.adjustments) setAdjustments(item.adjustments);
    };

    // --- AI Execution ---
    const executeEdit = async (editPrompt: string, quickEditName: string | null = null) => {
        if (!editPrompt || !image) return;
        setIsLoading(true);
        setActiveQuickEdit(quickEditName);
        try {
            const newBase64 = await GeminiService.editImage(editPrompt, image.base64, image.mimeType);
            const newImageData = {
                base64: newBase64,
                mimeType: 'image/png',
                preview: `data:image/png;base64,${newBase64}`,
            };
            setImage(newImageData);
            addToHistory(newImageData, quickEditName || 'Generative Fill', adjustments);
        } catch (error) {
            console.error("Error editing image:", error);
        } finally {
            setIsLoading(false);
            setActiveQuickEdit(null);
        }
    };

    const executeUpscale = async () => {
        if (!image) return;
        setIsLoading(true);
        setActiveQuickEdit('Upscale');
        try {
            const newBase64 = await GeminiService.upscaleImage(image.base64, image.mimeType);
            const newImageData = {
                base64: newBase64,
                mimeType: image.mimeType,
                preview: `data:${image.mimeType};base64,${newBase64}`,
            };
            setImage(newImageData);
            addToHistory(newImageData, 'Upscale (26MP)', adjustments);
        } catch (error) {
            console.error("Error upscaling image:", error);
        } finally {
            setIsLoading(false);
            setActiveQuickEdit(null);
        }
    };

    const handleDownload = () => {
        if (image) {
             downloadImage(image.base64, `photon_edit_${Date.now()}.png`);
        }
    };

    // --- Smart Preset Application ---
    const applyPreset = (presetName: string, presetValues: Partial<ImageAdjustments>) => {
        setAdjustments(prev => ({ ...defaultAdjustments, ...presetValues }));
    };

    const autoEnhance = () => {
        // Simulate AI Analysis for auto-correction
        const autoValues: Partial<ImageAdjustments> = {
            exposure: 108,
            contrast: 110,
            saturation: 105,
            highlights: 90,
            shadows: 110,
            gamma: 1.05
        };
        applyPreset("Auto-Enhance", autoValues);
    };

    // --- CSS Generation ---
    const getFilterString = (adj: ImageAdjustments) => {
        return `
            brightness(${adj.exposure}%) 
            contrast(${adj.contrast}%) 
            saturate(${adj.saturation}%) 
            sepia(${adj.warmth > 0 ? adj.warmth : 0}%) 
            hue-rotate(${adj.tint}deg) 
            blur(${adj.blur}px)
        `;
    };

    const updateAdj = (key: keyof ImageAdjustments, val: number) => {
        setAdjustments(prev => ({ ...prev, [key]: val }));
    };

    const handleImageUpload = (imageData: ImageData) => {
        setImage(imageData);
        setHistory([{
            id: 'initial',
            thumbnail: imageData.preview,
            actionName: 'Original',
            imageData: imageData,
            adjustments: defaultAdjustments,
            timestamp: Date.now()
        }]);
    };

    if (!image) {
        return (
             <div className="p-8 max-w-4xl mx-auto pt-24">
                <ImageUploader onImageUpload={handleImageUpload} imagePreview={null} isLoading={false} promptText="Open image in Darkroom"/>
             </div>
        );
    }

    const activeFilter = getFilterString(adjustments);
    const activeVignette = adjustments.vignette;
    const activeGrain = adjustments.grain;

    // Advanced SVG Filter Values
    const r = adjustments.redChannel / 100;
    const g = adjustments.greenChannel / 100;
    const b = adjustments.blueChannel / 100;
    
    // Split Toning Colors
    const shadowColor = `hsl(${adjustments.shadowsHue}, ${adjustments.shadowsSat}%, 50%)`;
    const highlightColor = `hsl(${adjustments.highlightsHue}, ${adjustments.highlightsSat}%, 50%)`;

    // Temperature (Warmth) Logic for SVG Matrix
    const warmthVal = adjustments.warmth / 100; // -1 to 1
    const rW = warmthVal > 0 ? 1 + warmthVal * 0.2 : 1 - Math.abs(warmthVal) * 0.1;
    const bW = warmthVal > 0 ? 1 - warmthVal * 0.1 : 1 + Math.abs(warmthVal) * 0.2;
    
    const originalImageSrc = history.length > 0 ? history[history.length - 1].thumbnail : image.preview;

    return (
        <div className="h-screen pt-20 flex flex-col md:flex-row bg-surface overflow-hidden">
            
            {/* SVG Definitions for Advanced Filters including Channel Mixing and Temperature */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <filter id="advancedCorrections">
                        {/* Channel Mixer & Temp Matrix Combo */}
                        <feColorMatrix 
                            type="matrix" 
                            values={`
                                ${r * rW} 0 0 0 0
                                0 ${g} 0 0 0
                                0 0 ${b * bW} 0 0
                                0 0 0 1 0
                            `}
                        />
                        <feComponentTransfer>
                            <feFuncR type="gamma" amplitude="1" exponent={1/adjustments.gamma} offset="0"/>
                            <feFuncG type="gamma" amplitude="1" exponent={1/adjustments.gamma} offset="0"/>
                            <feFuncB type="gamma" amplitude="1" exponent={1/adjustments.gamma} offset="0"/>
                        </feComponentTransfer>
                    </filter>
                </defs>
            </svg>

            {/* --- Left Panel: The Manual Darkroom --- */}
            <div className="w-full md:w-80 bg-surfaceHighlight/50 border-r border-white/5 flex flex-col z-20 shadow-2xl flex-shrink-0 backdrop-blur-md">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-xs font-display font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <WrenchScrewdriverIcon className="w-4 h-4" /> Darkroom Tools
                    </h2>
                </div>
                
                {/* Category Tabs */}
                <div className="flex p-2 gap-1 border-b border-white/5 bg-black/20 overflow-x-auto custom-scrollbar">
                    <TabButton active={activeCategory === 'light'} icon={<SunIcon className="w-5 h-5"/>} label="Light" onClick={() => setActiveCategory('light')} />
                    <TabButton active={activeCategory === 'color'} icon={<SwatchIcon className="w-5 h-5"/>} label="Color" onClick={() => setActiveCategory('color')} />
                    <TabButton active={activeCategory === 'mixer'} icon={<EyeDropperIcon className="w-5 h-5"/>} label="Mixer" onClick={() => setActiveCategory('mixer')} />
                    <TabButton active={activeCategory === 'grade'} icon={<SplitToningIcon className="w-5 h-5"/>} label="Grade" onClick={() => setActiveCategory('grade')} />
                    <TabButton active={activeCategory === 'detail'} icon={<ApertureIcon className="w-5 h-5"/>} label="Detail" onClick={() => setActiveCategory('detail')} />
                </div>

                {/* Sliders Container */}
                <div className="flex-grow overflow-y-auto p-5 space-y-8 custom-scrollbar">
                    {activeCategory === 'light' && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                <CurvesIcon className="w-4 h-4 text-indigo-400"/>
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Tone Curve Proxy</span>
                            </div>
                            <AdjustmentSlider label="Exposure" min={50} max={150} value={adjustments.exposure} onChange={(v) => updateAdj('exposure', v)} />
                            <AdjustmentSlider label="Contrast" min={50} max={150} value={adjustments.contrast} onChange={(v) => updateAdj('contrast', v)} />
                            <AdjustmentSlider label="Highlights" min={50} max={150} value={adjustments.highlights} onChange={(v) => updateAdj('highlights', v)} />
                            <AdjustmentSlider label="Shadows" min={50} max={150} value={adjustments.shadows} onChange={(v) => updateAdj('shadows', v)} />
                            <AdjustmentSlider label="Gamma" min={0.1} max={2.5} value={adjustments.gamma} onChange={(v) => updateAdj('gamma', v)} />
                        </div>
                    )}
                    {activeCategory === 'color' && (
                        <div className="space-y-5 animate-fade-in">
                            <AdjustmentSlider label="Saturation" min={0} max={200} value={adjustments.saturation} onChange={(v) => updateAdj('saturation', v)} />
                            <AdjustmentSlider label="Vibrance" min={0} max={200} value={adjustments.vibrance} onChange={(v) => updateAdj('vibrance', v)} />
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[10px] text-indigo-400 mb-4 uppercase font-bold tracking-widest">White Balance</p>
                                <div className="space-y-5">
                                    <AdjustmentSlider label="Temperature" min={-100} max={100} value={adjustments.warmth} onChange={(v) => updateAdj('warmth', v)} />
                                    <AdjustmentSlider label="Tint" min={-180} max={180} value={adjustments.tint} onChange={(v) => updateAdj('tint', v)} />
                                </div>
                            </div>
                        </div>
                    )}
                     {activeCategory === 'mixer' && (
                        <div className="space-y-5 animate-fade-in">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">RGB Channel Mixer</h3>
                            <AdjustmentSlider label="Red Intensity" min={0} max={200} value={adjustments.redChannel} onChange={(v) => updateAdj('redChannel', v)} />
                            <AdjustmentSlider label="Green Intensity" min={0} max={200} value={adjustments.greenChannel} onChange={(v) => updateAdj('greenChannel', v)} />
                            <AdjustmentSlider label="Blue Intensity" min={0} max={200} value={adjustments.blueChannel} onChange={(v) => updateAdj('blueChannel', v)} />
                        </div>
                    )}
                    {activeCategory === 'grade' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-3 flex items-center gap-2"><SunIcon className="w-3 h-3"/> Highlights</h3>
                                <div className="space-y-4">
                                     <AdjustmentSlider label="Hue" min={0} max={360} value={adjustments.highlightsHue} onChange={(v) => updateAdj('highlightsHue', v)} />
                                     <AdjustmentSlider label="Saturation" min={0} max={100} value={adjustments.highlightsSat} onChange={(v) => updateAdj('highlightsSat', v)} />
                                     <div className="h-4 w-full rounded mt-2 border border-white/10" style={{ backgroundColor: highlightColor }}></div>
                                </div>
                            </div>
                            <div className="border-t border-white/10 pt-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2"><ArrowDownTrayIcon className="w-3 h-3"/> Shadows</h3>
                                <div className="space-y-4">
                                     <AdjustmentSlider label="Hue" min={0} max={360} value={adjustments.shadowsHue} onChange={(v) => updateAdj('shadowsHue', v)} />
                                     <AdjustmentSlider label="Saturation" min={0} max={100} value={adjustments.shadowsSat} onChange={(v) => updateAdj('shadowsSat', v)} />
                                     <div className="h-4 w-full rounded mt-2 border border-white/10" style={{ backgroundColor: shadowColor }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeCategory === 'detail' && (
                        <div className="space-y-5 animate-fade-in">
                            <AdjustmentSlider label="Sharpen" min={0} max={100} value={adjustments.sharpen} onChange={(v) => updateAdj('sharpen', v)} />
                            <AdjustmentSlider label="Blur" min={0} max={20} value={adjustments.blur} onChange={(v) => updateAdj('blur', v)} />
                            <AdjustmentSlider label="Vignette" min={0} max={100} value={adjustments.vignette} onChange={(v) => updateAdj('vignette', v)} />
                            <AdjustmentSlider label="Film Grain" min={0} max={100} value={adjustments.grain} onChange={(v) => updateAdj('grain', v)} />
                        </div>
                    )}

                    {/* AI-Tuned Presets Section */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                         <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-4">
                             <SparklesIcon className="w-3 h-3" /> AI-Tuned Presets
                         </h3>
                         <div className="grid grid-cols-2 gap-2">
                             <button 
                                onClick={autoEnhance}
                                className="col-span-2 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 mb-2"
                             >
                                 <BoltIcon className="w-3 h-3" /> Auto-Balance
                             </button>
                             {PRESETS.map(preset => (
                                 <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset.name, preset.adjustments)}
                                    className="relative group overflow-hidden rounded-lg h-14 bg-gray-800 border border-white/5 hover:border-white/20 transition-all"
                                 >
                                     <div className={`absolute inset-0 bg-gradient-to-br ${preset.colorClass} opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                                     <span className="relative z-10 text-[10px] font-bold text-white uppercase tracking-wide shadow-black drop-shadow-md">
                                         {preset.name}
                                     </span>
                                 </button>
                             ))}
                         </div>
                    </div>
                    
                    <button 
                        onClick={() => setAdjustments(defaultAdjustments)}
                        className="w-full py-2.5 text-xs font-bold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors mt-8 uppercase tracking-wide"
                    >
                        Reset All Adjustments
                    </button>
                </div>
            </div>

            {/* --- Center Panel: The Canvas --- */}
            <div className="flex-grow bg-[#05050A] relative flex items-center justify-center overflow-hidden group p-4 md:p-8">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/50 via-transparent to-black/50"></div>
                
                {/* Comparison Control */}
                <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
                    <button 
                        className={`backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 shadow-lg ${showCompare ? 'bg-indigo-600/90 border-indigo-500 shadow-indigo-500/30' : 'bg-black/50'}`}
                        onClick={() => setShowCompare(!showCompare)}
                    >
                        <ArrowsPointingOutIcon className="w-3 h-3"/>
                        {showCompare ? 'Comparison Active' : 'Compare Original'}
                    </button>
                    <span className="text-[10px] text-gray-400 bg-black/50 border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md">
                        {history.length > 1 ? `Viewing Edit ${history.length - 1}` : 'Original Asset'}
                    </span>
                </div>

                {/* Image Container with Filters & Overlays */}
                <div className="relative max-w-full max-h-full shadow-[0_0_50px_-10px_rgba(0,0,0,0.7)] transition-transform duration-200 select-none">
                    
                    {/* Render Content Function */}
                    {(() => {
                        const renderImageLayer = (isOriginal: boolean) => {
                             const imgSrc = isOriginal ? originalImageSrc : image.preview;
                             const filterStyle = isOriginal ? {} : { filter: `${activeFilter} url(#advancedCorrections)` };
                             const showOverlays = !isOriginal;

                             return (
                                <div className="relative w-full h-full">
                                    {showOverlays && (
                                        <>
                                            {/* Vignette */}
                                            <div 
                                                className="absolute inset-0 z-10 pointer-events-none rounded-sm"
                                                style={{ boxShadow: `inset 0 0 ${activeVignette * 2}px ${activeVignette}px rgba(0,0,0,${activeVignette / 150})` }}
                                            ></div>
                                            
                                            {/* Grain */}
                                            <div 
                                                className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
                                                style={{ 
                                                    opacity: activeGrain / 100,
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` 
                                                }}
                                            ></div>

                                            {/* Split Toning: Highlights */}
                                            <div 
                                                className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
                                                style={{ backgroundColor: highlightColor, opacity: adjustments.highlightsSat / 200 }} 
                                            ></div>
                                            
                                            {/* Split Toning: Shadows (Soft Light approximation) */}
                                            <div 
                                                className="absolute inset-0 z-10 pointer-events-none mix-blend-soft-light"
                                                style={{ backgroundColor: shadowColor, opacity: adjustments.shadowsSat / 150 }} 
                                            ></div>
                                        </>
                                    )}
                                    <img 
                                        src={imgSrc} 
                                        alt={isOriginal ? "Original" : "Edited"}
                                        className="max-h-[calc(100vh-160px)] max-w-full object-contain rounded-lg border border-white/5"
                                        style={filterStyle}
                                        draggable={false}
                                    />
                                </div>
                             );
                        };

                        if (showCompare) {
                            return (
                                <div className="relative">
                                    {/* Bottom Layer: Original */}
                                    {renderImageLayer(true)}

                                    {/* Top Layer: Edited (Clipped) */}
                                    <div 
                                        className="absolute inset-0 overflow-hidden border-r border-white shadow-2xl"
                                        style={{ width: `${compareSplit}%` }}
                                    >
                                        {renderImageLayer(false)}
                                    </div>

                                    {/* Slider Handle */}
                                    <div 
                                        className="absolute top-0 bottom-0 w-8 -ml-4 cursor-ew-resize z-40 flex items-center justify-center group"
                                        style={{ left: `${compareSplit}%` }}
                                        onMouseDown={(e) => {
                                            const parent = e.currentTarget.parentElement;
                                            if (!parent) return;
                                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                                const rect = parent.getBoundingClientRect();
                                                const x = moveEvent.clientX - rect.left;
                                                const percent = Math.min(Math.max((x / rect.width) * 100, 0), 100);
                                                setCompareSplit(percent);
                                            };
                                            const handleMouseUp = () => {
                                                document.removeEventListener('mousemove', handleMouseMove);
                                                document.removeEventListener('mouseup', handleMouseUp);
                                            };
                                            document.addEventListener('mousemove', handleMouseMove);
                                            document.addEventListener('mouseup', handleMouseUp);
                                        }}
                                        onTouchStart={(e) => {
                                             const parent = e.currentTarget.parentElement;
                                             if (!parent) return;
                                             const handleTouchMove = (moveEvent: TouchEvent) => {
                                                 const rect = parent.getBoundingClientRect();
                                                 const x = moveEvent.touches[0].clientX - rect.left;
                                                 const percent = Math.min(Math.max((x / rect.width) * 100, 0), 100);
                                                 setCompareSplit(percent);
                                             };
                                             const handleTouchEnd = () => {
                                                 document.removeEventListener('touchmove', handleTouchMove);
                                                 document.removeEventListener('touchend', handleTouchEnd);
                                             }
                                             document.addEventListener('touchmove', handleTouchMove);
                                             document.addEventListener('touchend', handleTouchEnd);
                                        }}
                                    >
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur-md border border-white/30 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-xs select-none group-hover:scale-110 transition-transform">
                                            <ArrowsPointingOutIcon className="w-4 h-4 rotate-45" />
                                        </div>
                                    </div>
                                    
                                    {/* Labels */}
                                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full pointer-events-none border border-white/10">Edited</div>
                                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full pointer-events-none border border-white/10">Original</div>
                                </div>
                            );
                        } else {
                            // Standard View
                            return renderImageLayer(false);
                        }
                    })()}
                </div>
            </div>

            {/* --- Right Panel: The AI Lab --- */}
            <div className="w-full md:w-80 bg-surfaceHighlight/50 border-l border-white/5 flex flex-col z-20 shadow-2xl flex-shrink-0 backdrop-blur-md">
                 <div className="p-4 border-b border-white/5">
                    <h2 className="text-xs font-display font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" /> AI Generation Lab
                    </h2>
                </div>

                <div className="p-5 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => executeEdit('Remove background', 'Remove BG')}
                            disabled={isLoading}
                            className="p-3 bg-gray-800/50 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl flex flex-col items-center gap-2 transition-all disabled:opacity-50 group"
                        >
                            {isLoading && activeQuickEdit === 'Remove BG' ? <Spinner /> : <ScissorsIcon className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform"/>}
                            <span className="text-[10px] font-bold text-gray-300 uppercase">Remove BG</span>
                        </button>
                        <button 
                            onClick={executeUpscale}
                            disabled={isLoading}
                            className="p-3 bg-gray-800/50 hover:bg-green-500/10 border border-white/5 hover:border-green-500/30 rounded-xl flex flex-col items-center gap-2 transition-all disabled:opacity-50 group"
                        >
                             {isLoading && activeQuickEdit === 'Upscale' ? <Spinner /> : <ArrowsPointingOutIcon className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform"/>}
                             <span className="text-[10px] font-bold text-gray-300 uppercase">Upscale</span>
                        </button>
                         <button 
                            onClick={() => executeEdit('Make it black and white high contrast', 'B&W')}
                            disabled={isLoading}
                            className="p-3 bg-gray-800/50 hover:bg-gray-500/10 border border-white/5 hover:border-gray-500/30 rounded-xl flex flex-col items-center gap-2 transition-all disabled:opacity-50 group"
                        >
                             {isLoading && activeQuickEdit === 'B&W' ? <Spinner /> : <PaintBrushIcon className="w-5 h-5 text-gray-300 group-hover:scale-110 transition-transform"/>}
                             <span className="text-[10px] font-bold text-gray-300 uppercase">B&W</span>
                        </button>
                         <button 
                            onClick={() => executeEdit('Cinematic teal and orange lighting', 'Cinematic')}
                            disabled={isLoading}
                            className="p-3 bg-gray-800/50 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 rounded-xl flex flex-col items-center gap-2 transition-all disabled:opacity-50 group"
                        >
                             {isLoading && activeQuickEdit === 'Cinematic' ? <Spinner /> : <PlayIcon className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform"/>}
                             <span className="text-[10px] font-bold text-gray-300 uppercase">Cinematic</span>
                        </button>
                    </div>

                    {/* Creative Suggestions */}
                    {analysis && analysis.creative_remixes && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase tracking-widest flex items-center gap-2">
                                <SparklesIcon className="w-3 h-3 text-indigo-400"/> Creative AI Suggestions
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {analysis.creative_remixes.map((remix, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => executeEdit(remix.prompt, remix.title)}
                                        disabled={isLoading}
                                        className="group relative w-full text-left p-3 bg-gray-800/40 hover:bg-gradient-to-r hover:from-indigo-900/40 hover:to-purple-900/40 border border-white/5 hover:border-indigo-500/30 rounded-lg transition-all"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-gray-200 group-hover:text-white uppercase tracking-wide">
                                                {remix.title}
                                            </span>
                                            <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">
                                                {remix.category}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 group-hover:text-indigo-200 line-clamp-1 transition-colors">{remix.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generative Prompt */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generative Fill</h3>
                        <div className="relative">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe a change (e.g., 'Add a neon sign')..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-24 resize-none transition-all"
                            />
                            <div className="absolute bottom-2 right-2">
                                <SparklesIcon className="w-4 h-4 text-indigo-500/50" />
                            </div>
                        </div>
                        <button 
                            onClick={() => executeEdit(prompt, null)}
                            disabled={isLoading || !prompt}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                        >
                            {isLoading && !activeQuickEdit ? <Spinner /> : 'Generate Edit'}
                        </button>
                    </div>

                    {/* Smart Fixes (Corrective) */}
                    {analysis && analysis.social_media_strategy.suggested_edits && (
                         <div className="space-y-3 mt-6 pt-6 border-t border-white/5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <WrenchScrewdriverIcon className="w-3 h-3"/> Smart Fixes
                            </h3>
                            <div className="space-y-2">
                                {analysis.social_media_strategy.suggested_edits.map((edit, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => executeEdit(edit.suggestion, 'Smart Fix')}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 group transition-all"
                                    >
                                        <span className="text-xs text-gray-400 group-hover:text-gray-200">{edit.suggestion}</span>
                                        <ArrowRightIcon className="w-3 h-3 text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all"/>
                                    </button>
                                ))}
                            </div>
                         </div>
                    )}

                    {/* History List */}
                     <div className="border-t border-white/5 pt-6 mt-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ArrowPathIcon className="w-3 h-3" /> Version History
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                             {history.map((item, index) => (
                                <div 
                                    key={item.id}
                                    onClick={() => handleHistoryClick(item)}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${image.preview === item.imageData.preview && JSON.stringify(adjustments) === JSON.stringify(item.adjustments) ? 'bg-indigo-900/30 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                >
                                    <img src={item.thumbnail} alt="thumb" className="w-10 h-10 object-cover rounded-md border border-white/10" />
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-gray-200 truncate">{item.actionName}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">{index === history.length - 1 ? 'Original Asset' : `Version ${history.length - 1 - index}`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                     <div className="pt-4 space-y-2">
                        <button onClick={handleDownload} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-all border border-white/10">
                            <ArrowDownTrayIcon className="w-4 h-4" /> Download to Device
                        </button>
                        <button onClick={() => onSendToLightBox(image)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm transition-all border border-white/10">
                            Save to Light Box <ArrowRightIcon className="w-4 h-4" />
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

const StudioView: React.FC<{ 
  onSendToLightBox: (imageData: ImageData) => void;
  portfolioImages: ActiveImage[];
}> = ({ onSendToLightBox, portfolioImages }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'calendar' | 'madlibs'>('madlibs');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Mad Libs State
  const [madLibsInputs, setMadLibsInputs] = useState({ subject: '', location: '', mood: '', lighting: '' });
  const [shotConcepts, setShotConcepts] = useState<ShotConcept[]>([]);
  const [isConceptLoading, setIsConceptLoading] = useState(false);
  const [conceptImages, setConceptImages] = useState<Record<number, ImageData | null>>({});
  const [conceptImageLoading, setConceptImageLoading] = useState<Record<number, boolean>>({});

  // Populate calendar with active image analysis posts
  useEffect(() => {
    const events: CalendarEvent[] = [];
    portfolioImages.forEach(img => {
        if (img.analysis?.social_media_strategy?.sample_posts) {
            img.analysis.social_media_strategy.sample_posts.forEach((post, i) => {
                // Spread posts out starting from tomorrow
                const date = new Date();
                date.setDate(date.getDate() + (i + 1) + (Math.random() * 3)); 
                
                events.push({
                    id: `${img.id}-${i}`,
                    date: date,
                    platform: post.platform as PlatformName,
                    content: post.post_text,
                    thumbnail: img.data.preview,
                    status: 'scheduled'
                });
            });
        }
    });
    setCalendarEvents(events.sort((a, b) => a.date.getTime() - b.date.getTime()));
  }, [portfolioImages]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setGeneratedImage(null);
    try {
      const newBase64 = await GeminiService.generateImage(prompt, aspectRatio);
      const newImageData = {
        base64: newBase64,
        mimeType: 'image/png',
        preview: `data:image/png;base64,${newBase64}`,
      };
      setGeneratedImage(newImageData);
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateConcepts = async () => {
      const { subject, location, mood, lighting } = madLibsInputs;
      if (!subject || !location || !mood || !lighting) return;
      
      setIsConceptLoading(true);
      setConceptImages({}); // Clear previous images
      try {
          const concepts = await GeminiService.generateShotConcepts(madLibsInputs);
          setShotConcepts(concepts);
      } catch (error) {
          console.error("Error generating concepts", error);
      } finally {
          setIsConceptLoading(false);
      }
  };

  const handleGenerateConceptImage = async (concept: ShotConcept, index: number) => {
      setConceptImageLoading(prev => ({ ...prev, [index]: true }));
      try {
          // Use the visual description as the prompt
          const newBase64 = await GeminiService.generateImage(concept.visual_description, '16:9');
          const newImageData = {
              base64: newBase64,
              mimeType: 'image/png',
              preview: `data:image/png;base64,${newBase64}`,
          };
          setConceptImages(prev => ({ ...prev, [index]: newImageData }));
      } catch (error) {
          console.error("Error generating concept image", error);
      } finally {
          setConceptImageLoading(prev => ({ ...prev, [index]: false }));
      }
  };

  const randomizeMadLibs = () => {
      const subjects = ["Cyberpunk Samurai", "Floating Coffee Cup", "Neon Retro Car", "Minimalist Flower"];
      const locations = ["Rainy Tokyo Street", "White Void Studio", "Mars Colony", "Underwater Cave"];
      const moods = ["Melancholic", "Energetic", "Dreamy", "Sinister"];
      const lightings = ["Neon Pink & Blue", "Soft Window Light", "Hard Flash", "Golden Hour"];

      setMadLibsInputs({
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          mood: moods[Math.floor(Math.random() * moods.length)],
          lighting: lightings[Math.floor(Math.random() * lightings.length)],
      });
  };


  const renderCalendar = () => {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Content Calendar</h2>
                  <span className="text-gray-400 text-sm">Showing upcoming scheduled posts</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                   {/* Simple Calendar Grid (Next 7 days) */}
                   {Array.from({length: 7}).map((_, i) => {
                       const date = new Date();
                       date.setDate(date.getDate() + i);
                       const dayEvents = calendarEvents.filter(e => e.date.toDateString() === date.toDateString());

                       return (
                           <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 min-h-[150px] p-2">
                               <div className="text-center border-b border-gray-700 pb-2 mb-2">
                                   <p className="text-indigo-400 font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                   <p className="text-white text-lg">{date.getDate()}</p>
                               </div>
                               <div className="space-y-2">
                                   {dayEvents.length > 0 ? dayEvents.map(evt => (
                                       <div key={evt.id} className="bg-gray-700/50 rounded p-1.5 flex gap-2 items-center group relative cursor-pointer hover:bg-gray-600 transition-colors">
                                           <img src={evt.thumbnail} className="w-6 h-6 rounded object-cover" />
                                           <div className="min-w-0">
                                               <p className="text-[10px] font-bold text-gray-300 truncate">{evt.platform}</p>
                                           </div>
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-0 w-48 bg-black text-white text-xs p-2 rounded z-50 hidden group-hover:block shadow-xl border border-gray-600 mb-1">
                                                {evt.content}
                                            </div>
                                       </div>
                                   )) : (
                                       <p className="text-xs text-gray-600 text-center py-4">No posts</p>
                                   )}
                               </div>
                           </div>
                       )
                   })}
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <h3 className="font-bold text-white mb-4">Upcoming Feed Preview</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {calendarEvents.slice(0, 16).map(evt => (
                          <div key={evt.id} className="relative aspect-square">
                              <img src={evt.thumbnail} className="w-full h-full object-cover rounded" />
                              <div className="absolute bottom-0 right-0 bg-black/70 p-1 rounded-tl">
                                   {/* Very simple icon logic based on platform string */}
                                  <span className="text-[8px] text-white font-bold">{evt.platform[0]}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const renderMadLibs = () => {
      return (
          <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
               <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-10 rounded-2xl border border-gray-700 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-1000"></div>
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                         <div>
                            <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                                <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30">
                                     <BeakerIcon className="w-6 h-6 text-amber-400" />
                                </div>
                                Shot Architect
                            </h2>
                            <p className="text-gray-400 mt-2 text-lg font-light">Design your next photoshoot with AI-powered creative direction.</p>
                         </div>
                         <button 
                            onClick={randomizeMadLibs}
                            className="text-xs text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 px-4 py-2 rounded-full font-bold transition-all"
                         >
                             Autofill (Random)
                         </button>
                    </div>

                    <div className="text-xl md:text-3xl leading-loose font-serif text-gray-300 space-y-6 relative z-10">
                        <div className="flex flex-wrap items-baseline gap-4">
                            <span className="text-white">I want to photograph a</span>
                            <input 
                                type="text" 
                                placeholder="subject (e.g. vintage car)" 
                                value={madLibsInputs.subject}
                                onChange={(e) => setMadLibsInputs({...madLibsInputs, subject: e.target.value})}
                                className="bg-black/30 border-b-2 border-amber-500/50 focus:border-amber-400 outline-none px-4 py-1 text-amber-100 placeholder-gray-600 min-w-[250px] text-center font-bold italic transition-all focus:bg-black/50"
                            />
                            <span className="text-white">in a</span>
                            <input 
                                type="text" 
                                placeholder="location (e.g. neon city)" 
                                value={madLibsInputs.location}
                                onChange={(e) => setMadLibsInputs({...madLibsInputs, location: e.target.value})}
                                className="bg-black/30 border-b-2 border-amber-500/50 focus:border-amber-400 outline-none px-4 py-1 text-amber-100 placeholder-gray-600 min-w-[250px] text-center font-bold italic transition-all focus:bg-black/50"
                            />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-4">
                             <span className="text-white">with</span>
                             <input 
                                type="text" 
                                placeholder="mood (e.g. nostalgic)" 
                                value={madLibsInputs.mood}
                                onChange={(e) => setMadLibsInputs({...madLibsInputs, mood: e.target.value})}
                                className="bg-black/30 border-b-2 border-amber-500/50 focus:border-amber-400 outline-none px-4 py-1 text-amber-100 placeholder-gray-600 min-w-[200px] text-center font-bold italic transition-all focus:bg-black/50"
                            />
                            <span className="text-white">vibes and</span>
                            <input 
                                type="text" 
                                placeholder="lighting (e.g. hard flash)" 
                                value={madLibsInputs.lighting}
                                onChange={(e) => setMadLibsInputs({...madLibsInputs, lighting: e.target.value})}
                                className="bg-black/30 border-b-2 border-amber-500/50 focus:border-amber-400 outline-none px-4 py-1 text-amber-100 placeholder-gray-600 min-w-[200px] text-center font-bold italic transition-all focus:bg-black/50"
                            />
                            <span className="text-white">lighting.</span>
                        </div>
                    </div>

                    <div className="mt-12">
                        <button 
                            onClick={handleGenerateConcepts}
                            disabled={isConceptLoading || !madLibsInputs.subject}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-display font-bold py-5 rounded-xl shadow-lg shadow-amber-900/40 text-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                        >
                            {isConceptLoading ? <Spinner /> : <>Generate Concepts <SparklesIcon className="w-6 h-6"/></>}
                        </button>
                    </div>
               </div>

               {shotConcepts.length > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                       {shotConcepts.map((concept, idx) => (
                           <div key={idx} className="bg-gray-800 rounded-2xl border border-gray-700 p-8 hover:border-amber-500/50 transition-all hover:-translate-y-2 group shadow-xl flex flex-col">
                               <div className="flex justify-between items-start mb-6">
                                   <div className="bg-black/40 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-white/5">
                                       Concept {idx + 1}
                                   </div>
                                   <span className={`text-xs px-3 py-1.5 rounded-full font-bold border border-white/5 ${
                                       concept.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' :
                                       concept.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                       'bg-red-900/30 text-red-400'
                                   }`}>
                                       {concept.difficulty}
                                   </span>
                               </div>
                               <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">{concept.title}</h3>
                               <p className="text-gray-400 text-sm mb-6 leading-relaxed border-b border-gray-700 pb-6 flex-grow">{concept.visual_description}</p>
                               
                               <div className="space-y-4 mb-6">
                                   <div>
                                       <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><ApertureIcon className="w-3 h-3" /> Tech Specs</h4>
                                       <p className="text-gray-300 text-xs bg-black/20 p-2 rounded border border-white/5 font-mono">{concept.technical_specs}</p>
                                   </div>
                                   <div>
                                       <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><PaintBrushIcon className="w-3 h-3" /> Art Direction</h4>
                                       <p className="text-gray-300 text-xs bg-black/20 p-2 rounded border border-white/5">{concept.art_direction}</p>
                                   </div>
                               </div>

                               {/* Example Image Section */}
                               <div className="pt-4 border-t border-gray-700 mt-auto">
                                    {conceptImages[idx] ? (
                                        <div className="relative group/image">
                                            <img src={conceptImages[idx]?.preview} alt={`Concept ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border border-white/10 shadow-lg mb-3" />
                                            <button 
                                                onClick={() => onSendToLightBox(conceptImages[idx]!)}
                                                className="absolute bottom-2 right-2 bg-black/60 hover:bg-green-600 text-white p-2 rounded-lg opacity-0 group-hover/image:opacity-100 transition-all backdrop-blur-sm"
                                                title="Send to Light Box"
                                            >
                                                <ArrowRightIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleGenerateConceptImage(concept, idx)}
                                            disabled={conceptImageLoading[idx]}
                                            className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-2.5 rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            {conceptImageLoading[idx] ? <Spinner /> : <>Generate Example <PhotoIcon className="w-4 h-4" /></>}
                                        </button>
                                    )}
                               </div>
                           </div>
                       ))}
                   </div>
               )}
          </div>
      );
  };

  return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-100px)] pt-24">
          <div className="flex space-x-6 border-b border-gray-700 mb-8 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('madlibs')}
                className={`pb-4 font-bold text-lg transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'madlibs' ? 'text-white border-amber-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
              >
                  <BeakerIcon className="w-5 h-5" />
                  Shot Architect <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded ml-1 font-bold uppercase tracking-wide">New</span>
              </button>
              <button 
                onClick={() => setActiveTab('generate')}
                className={`pb-4 font-bold text-lg transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'generate' ? 'text-white border-indigo-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
              >
                  <SparklesIcon className="w-5 h-5" />
                  Generative Studio
              </button>
              <button 
                onClick={() => setActiveTab('calendar')}
                className={`pb-4 font-bold text-lg transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'calendar' ? 'text-white border-purple-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
              >
                  <CalendarEventIcon className="w-5 h-5" />
                  Content Calendar
              </button>
          </div>

          {activeTab === 'calendar' && renderCalendar()}
          {activeTab === 'madlibs' && renderMadLibs()}
          {activeTab === 'generate' && (
              <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
                  <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4 shadow-xl">
                      <h2 className="text-xl font-bold text-indigo-400">Image Generation Studio</h2>
                      <p className="text-gray-400 text-sm">Create high-fidelity assets from text descriptions.</p>
                      <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe the image you want to create... e.g., 'A cinematic photo of a wolf in a neon-lit forest'"
                          rows={3}
                          className="w-full bg-black/40 text-white placeholder-gray-500 p-4 rounded-xl border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                      <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-grow">
                              <label htmlFor="aspect-ratio" className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Aspect Ratio</label>
                              <select id="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none">
                                  <option value="1:1">Square (1:1)</option>
                                  <option value="16:9">Landscape (16:9)</option>
                                  <option value="9:16">Portrait (9:16)</option>
                                  <option value="4:3">Standard (4:3)</option>
                                  <option value="3:4">Tall (3:4)</option>
                              </select>
                          </div>
                          <div className="flex-shrink-0 self-end">
                              <button onClick={handleGenerate} disabled={isLoading || !prompt} className="flex items-center justify-center bg-indigo-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all w-full h-full shadow-lg shadow-indigo-500/20">
                                  {isLoading ? <Spinner /> : "Generate Asset"}
                              </button>
                          </div>
                      </div>
                  </div>
                  
                  {(isLoading || generatedImage) && (
                    <div className="relative min-h-[400px] flex items-center justify-center bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                        {isLoading && (
                            <div className="flex flex-col items-center">
                                <Spinner />
                                <p className="text-gray-300 mt-4 animate-pulse">Generating your masterpiece...</p>
                            </div>
                        )}
                        {generatedImage && !isLoading && (
                            <div className="p-8 space-y-6 w-full flex flex-col items-center">
                                <img src={generatedImage.preview} alt="Generated" className="max-h-[500px] w-auto rounded-xl shadow-2xl border border-white/10"/>
                                <div className="flex justify-center gap-4 pt-2">
                                    <button onClick={() => setGeneratedImage(null)} className="text-gray-400 hover:text-white font-medium transition-colors">Generate Another</button>
                                    <button onClick={() => onSendToLightBox(generatedImage)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-green-500/20 flex items-center gap-2 transform hover:scale-105 transition-all">
                                        Send to Light Box <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                  )}
              </div>
          )}
      </div>
  );
};

// Temp Icon for calendar to fix missing ref
const CalendarEventIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
);

const RouteBuilderView: React.FC = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
    const [runningStepId, setRunningStepId] = useState<string | null>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Scroll logs to bottom
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeWorkflow?.logs]);

    const handleCreateRoute = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setActiveWorkflow(null);
        setRunningStepId(null);

        try {
            const workflow = await GeminiService.generateWorkflowFromPrompt(input);
            setActiveWorkflow(workflow);
        } catch (error) {
            console.error("Failed to create route:", error);
            alert("Could not generate route. Please try a detailed prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    const runRoute = async () => {
        if (!activeWorkflow) return;
        
        const updatedWorkflow = { ...activeWorkflow, isActive: true, logs: [...(activeWorkflow.logs || []), "--- Starting Route Execution ---"] };
        setActiveWorkflow(updatedWorkflow);

        for (let i = 0; i < updatedWorkflow.steps.length; i++) {
            const step = updatedWorkflow.steps[i];
            setRunningStepId(step.id);
            
            // Log step start
            setActiveWorkflow(prev => prev ? { ...prev, logs: [...prev.logs, `> Initiating step: ${step.name} [Actor: ${step.actor.toUpperCase()}]...`] } : null);

            // Execute simulation via Gemini
            try {
                const stepOutput = await GeminiService.executeWorkflowStep(step.name, step.description, step.actor);
                
                // Update step status and logs
                const newSteps = [...updatedWorkflow.steps];
                newSteps[i] = { ...step, status: 'completed', output: stepOutput };
                
                setActiveWorkflow(prev => prev ? { 
                    ...prev, 
                    steps: newSteps, 
                    progress: ((i + 1) / updatedWorkflow.steps.length) * 100,
                    logs: [...prev.logs, `  [${step.actor === 'human' ? 'VERIFIED' : 'SUCCESS'}]: ${stepOutput}`]
                } : null);

            } catch (error) {
                console.error("Step execution failed", error);
                 setActiveWorkflow(prev => prev ? { ...prev, logs: [...prev.logs, `  [ERROR]: Failed to execute step ${step.name}`] } : null);
            }
        }

        setRunningStepId(null);
        setActiveWorkflow(prev => prev ? { ...prev, isActive: false, logs: [...prev.logs, "--- Route Complete ---"] } : null);
    };

    const getStepIcon = (iconName: string, actor: 'human' | 'system') => {
        if (actor === 'human') return <UserIcon className="w-5 h-5 text-amber-400" />;

        switch(iconName) {
            case 'upload': return <ArrowRightIcon className="w-5 h-5 text-blue-400" />;
            case 'ai': return <SparklesIcon className="w-5 h-5 text-purple-400" />;
            case 'edit': return <WrenchScrewdriverIcon className="w-5 h-5 text-yellow-400" />;
            case 'market': return <ShoppingCartIcon className="w-5 h-5 text-green-400" />;
            case 'social': return <InstagramIcon className="w-5 h-5 text-pink-400" />;
            case 'mail': return <PuzzlePieceIcon className="w-5 h-5 text-gray-400" />;
            case 'check': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            default: return <BoltIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-[calc(100vh-100px)] flex flex-col space-y-6 pt-24">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                    <MapIcon className="w-8 h-8 text-amber-400" />
                    Route Architect
                </h1>
                <p className="text-gray-400">Map out the perfect strategy. We'll identify what the AI does, and what you do.</p>
            </div>

            {/* Input Area */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleCreateRoute()}
                        placeholder="e.g., 'Launch a print store from my landscape photos'"
                        className="flex-grow bg-gray-900 text-white placeholder-gray-500 p-4 rounded-lg border border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none text-lg font-mono"
                        disabled={isLoading || (activeWorkflow?.isActive ?? false)}
                    />
                    <button 
                        onClick={handleCreateRoute}
                        disabled={isLoading || !input.trim() || (activeWorkflow?.isActive ?? false)}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2 text-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Spinner /> : <>Map Route <MapIcon className="w-5 h-5" /></>}
                    </button>
                </div>
            </div>

            <div className="flex-grow flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
                {/* Route Visualizer */}
                <div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-700 p-8 overflow-y-auto relative">
                    {!activeWorkflow && !isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-50">
                            <MapIcon className="w-24 h-24 mb-4" />
                            <p className="text-xl">No Route defined.</p>
                        </div>
                    )}

                    {activeWorkflow && (
                        <div className="max-w-2xl mx-auto relative pb-20">
                             <div className="flex justify-between items-start mb-8 border-b border-gray-700 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{activeWorkflow.title}</h2>
                                    <p className="text-gray-400 text-sm">{activeWorkflow.description}</p>
                                </div>
                                <button 
                                    onClick={runRoute}
                                    disabled={activeWorkflow.isActive}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-white shadow-lg transition-all ${
                                        activeWorkflow.isActive 
                                        ? 'bg-gray-700 cursor-not-allowed' 
                                        : 'bg-green-600 hover:bg-green-500 hover:scale-105'
                                    }`}
                                >
                                    {activeWorkflow.isActive ? <Spinner /> : <PlayIcon className="w-5 h-5" />}
                                    {activeWorkflow.isActive ? 'Executing...' : 'Run Route'}
                                </button>
                            </div>

                            <div className="space-y-0 relative">
                                {/* Connecting Line */}
                                <div className="absolute left-[2.25rem] top-4 bottom-4 w-0.5 bg-gray-700 -z-10"></div>

                                {activeWorkflow.steps.map((step, index) => {
                                    const isRunning = runningStepId === step.id;
                                    const isCompleted = step.status === 'completed';
                                    const isHuman = step.actor === 'human';

                                    return (
                                        <div key={step.id} className="relative flex gap-6 pb-8 last:pb-0 group">
                                            {/* Status Icon / Node */}
                                            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 flex-shrink-0 z-10 transition-all duration-500 bg-gray-900 shadow-xl ${
                                                isRunning 
                                                    ? (isHuman ? 'border-amber-500 text-amber-400 scale-110 shadow-amber-500/50' : 'border-indigo-500 text-indigo-400 scale-110 shadow-indigo-500/50') 
                                                : isCompleted 
                                                    ? 'border-green-500 text-green-500' 
                                                : 'border-gray-700 text-gray-600'
                                            }`}>
                                                {isCompleted ? <CheckBadgeIcon className="w-10 h-10" /> : getStepIcon(step.icon || 'bolt', step.actor)}
                                            </div>

                                            {/* Content Card */}
                                            <div className={`flex-grow p-4 rounded-lg border transition-all duration-300 relative ${
                                                isRunning 
                                                    ? (isHuman ? 'bg-amber-900/20 border-amber-500/50' : 'bg-indigo-900/20 border-indigo-500/50')
                                                : isCompleted 
                                                    ? 'bg-green-900/10 border-green-500/30' 
                                                : 'bg-gray-800 border-gray-700'
                                            }`}>
                                                {/* Actor Badge */}
                                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                                    isHuman ? 'bg-amber-900/40 text-amber-300 border-amber-500/30' : 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30'
                                                }`}>
                                                    {isHuman ? 'Human Task' : 'System Task'}
                                                </div>

                                                {isRunning && (
                                                    <span className="absolute bottom-2 right-2 flex h-3 w-3">
                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHuman ? 'bg-amber-400' : 'bg-indigo-400'}`}></span>
                                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isHuman ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
                                                    </span>
                                                )}

                                                <h3 className={`text-lg font-bold ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                                                    {step.name}
                                                </h3>
                                                <p className="text-gray-400 text-sm mt-1">{step.description}</p>
                                                
                                                {/* Step Output Visualization */}
                                                {step.output && (
                                                    <div className="mt-3 p-2 bg-black/30 rounded border border-black/20 text-xs font-mono text-green-300/90 break-all">
                                                        {'> ' + step.output}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Terminal / Log View */}
                <div className="lg:w-1/3 bg-black rounded-xl border border-gray-700 p-4 font-mono text-xs text-green-400 flex flex-col shadow-2xl h-64 lg:h-auto">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                        <span className="font-bold text-gray-400 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            ROUTE_LOGS
                        </span>
                        <span className="text-gray-600">v1.0.5</span>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-1 custom-scrollbar">
                        {activeWorkflow?.logs && activeWorkflow.logs.length > 0 ? (
                            activeWorkflow.logs.map((log, i) => (
                                <div key={i} className={`${log.includes('[ERROR]') ? 'text-red-400' : ''} ${log.includes('---') ? 'text-gray-500 py-2' : ''}`}>
                                    {log}
                                </div>
                            ))
                        ) : (
                             <div className="text-gray-600 italic">Route planner ready. Waiting for input...</div>
                        )}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [view, setView] = useState<AppView>(AppView.WELCOME);
    const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
    const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);
    const [portfolioImages, setPortfolioImages] = useState<ActiveImage[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [connections, setConnections] = useState<Connections>({
      'Adobe Stock': true,
      'Getty Images': false,
      'Shutterstock': true,
      'Alamy': false,
      '500px': true,
      'Etsy': false,
      'Redbubble': true,
      'Society6': false,
      'Fine Art America': false,
      'Instagram': true,
      'Pinterest': false,
      'TikTok': true,
      'X (Twitter)': false,
      'Facebook': false
    });
    
    // --- Initialization & Auth Check ---
    useEffect(() => {
        // 1. Check Auth
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }

        // 2. Check API Key
        const checkKey = async () => {
            if ((window as any).aistudio) {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                setIsApiKeySelected(hasKey);
            }
        };
        checkKey();

        // 3. Load Portfolio from IndexedDB
        const loadSavedImages = async () => {
            const images = await StorageService.getAllImages();
            // Sort by last modified desc
            images.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
            setPortfolioImages(images);
        };
        loadSavedImages();

    }, []);

    // Explicit handler to open key selection (passed to settings)
    const handleConnectGoogleCloud = async () => {
        if ((window as any).aistudio) {
            try {
                await (window as any).aistudio.openSelectKey();
                setIsApiKeySelected(true);
            } catch (e) {
                console.error("Failed to select key", e);
            }
        } else {
            console.warn("AI Studio interface not available");
        }
    };
    
    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        setView(AppView.LIGHT_BOX);
    };

    const handleLogout = () => {
        AuthService.logout();
        setUser(null);
        setView(AppView.WELCOME);
    };

    const handlePortfolioUpdate = async (imageToUpdate: ActiveImage) => {
        // 1. Update local state for instant UI feedback
        setPortfolioImages(prev => {
            const existingIndex = prev.findIndex(p => p.id === imageToUpdate.id);
            if (existingIndex > -1) {
                const newPortfolio = [...prev];
                newPortfolio[existingIndex] = imageToUpdate;
                return newPortfolio;
            } else {
                return [imageToUpdate, ...prev];
            }
        });

        // 2. Persist to IndexedDB (Fire and forget)
        StorageService.saveImage(imageToUpdate).catch(err => console.error("Auto-save failed", err));
    };

    const handleSignup = () => {
        if (user) {
            setView(AppView.LIGHT_BOX);
        } else {
            setAuthInitialMode('signup');
            setView(AppView.LOGIN);
        }
    };

    const handleLogin = () => {
         if (user) {
            setView(AppView.LIGHT_BOX);
        } else {
            setAuthInitialMode('login');
            setView(AppView.LOGIN);
        }
    };

    const handleSendToLightBox = (imageData: ImageData) => {
        const newImage: ActiveImage = {
            id: Date.now().toString(),
            data: imageData,
            analysis: null,
            isAnalyzed: false,
            isLoading: false,
        };
        setActiveImage(newImage);
        handlePortfolioUpdate(newImage); 
        setView(AppView.LIGHT_BOX);
    };
    
    const handleSwitchToEdit = (imageData: ImageData, existingAnalysis?: AnalysisResult | null) => {
        const newImage = {
             id: Date.now().toString(),
            data: imageData,
            analysis: existingAnalysis || null, // Persist analysis if available
            isAnalyzed: !!existingAnalysis,
            isLoading: false
        };
        setActiveImage(newImage);
        handlePortfolioUpdate(newImage);
        setView(AppView.EDIT);
    };

    const renderCurrentView = () => {
        switch (view) {
            case AppView.LOGIN:
                return <LoginView onLoginSuccess={handleLoginSuccess} initialMode={authInitialMode} />;
            case AppView.LIGHT_BOX:
                return <LightBoxView activeImage={activeImage} setActiveImage={setActiveImage} switchToEditView={(data) => handleSwitchToEdit(data, activeImage?.analysis)} connections={connections} isApiKeySelected={isApiKeySelected} setIsApiKeySelected={setIsApiKeySelected} onPortfolioUpdate={handlePortfolioUpdate} onNavigateToStudio={() => setView(AppView.STUDIO)} onSelectApiKey={handleConnectGoogleCloud} />;
            case AppView.PORTFOLIO:
                return <PortfolioView portfolioImages={portfolioImages} />;
            case AppView.EDIT:
                return <EditView initialImage={activeImage?.data || null} analysis={activeImage?.analysis || null} onSendToLightBox={handleSendToLightBox} />;
            case AppView.STUDIO:
                return <StudioView onSendToLightBox={handleSendToLightBox} portfolioImages={portfolioImages} />;
            case AppView.ROUTES:
                return <RouteBuilderView />;
            case AppView.EARNINGS:
                return <EarningsDashboard />;
            case AppView.SETTINGS:
                return (
                    <SettingsView 
                        connections={connections} 
                        setConnections={setConnections} 
                        isApiKeySelected={isApiKeySelected}
                        onConnectGoogleCloud={handleConnectGoogleCloud}
                    />
                );
            default:
                return <LightBoxView activeImage={activeImage} setActiveImage={setActiveImage} switchToEditView={(data) => handleSwitchToEdit(data, activeImage?.analysis)} connections={connections} isApiKeySelected={isApiKeySelected} setIsApiKeySelected={setIsApiKeySelected} onPortfolioUpdate={handlePortfolioUpdate} onNavigateToStudio={() => setView(AppView.STUDIO)} onSelectApiKey={handleConnectGoogleCloud} />;
        }
    };
    
    // Only show Header if not in Welcome or Login views
    const showHeader = view !== AppView.WELCOME && view !== AppView.LOGIN;

    if (view === AppView.WELCOME) {
        return <WelcomeScreen onSignup={handleSignup} onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-surface text-gray-100 font-sans selection:bg-indigo-500/30">
            {showHeader && <Header activeView={view} setActiveView={setView} user={user} onLogout={handleLogout} />}
            <main>
                {renderCurrentView()}
            </main>
        </div>
    );
};

export default App;
