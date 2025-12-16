import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppView, ChatMessage as ChatMessageType, AnalysisResult, ImageData, ActiveImage, Connections, PlatformName, DistributionStatus, DistributionResult, Platform, User, Workflow, WorkflowStep, EditHistoryItem, ImageAdjustments, CalendarEvent, ShotConcept, RouteChatMessage } from './types';
import * as GeminiService from './services/geminiService';
import * as DistributionService from './services/distributionService';
import * as AuthService from './services/authService';
import * as StorageService from './services/storageService';
import { Spinner } from './components/Spinner';
import { LightBoxIcon, ChatIcon, EditIcon, StudioIcon, CheckCircleIcon, XCircleIcon, WrenchScrewdriverIcon, InstagramIcon, PinterestIcon, LinkedInIcon, ShoppingCartIcon, DollarSignIcon, SettingsIcon, DownloadIcon, SparklesIcon, ScissorsIcon, PaintBrushIcon, ArrowsPointingOutIcon, RectangleStackIcon, ChartBarIcon, ViewfinderIcon, SunIcon, BookOpenIcon, BoltIcon, PuzzlePieceIcon, ArrowRightIcon, PlayIcon, StopIcon, CheckBadgeIcon, GoogleIcon, EyeIcon, ArrowDownTrayIcon, ArrowTrendingUpIcon, ArrowPathIcon, PhotoIcon, AdjustmentsIcon, SwatchIcon, ApertureIcon, MapIcon, UserIcon, SplitToningIcon, CurvesIcon, EyeDropperIcon, BeakerIcon, BrushIcon, EraserIcon, ArrowUpTrayIcon, ChatBubbleLeftRightIcon, PaperClipIcon } from './components/icons';
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

const ProgressBar: React.FC<{ label?: string }> = ({ label = "Processing..." }) => {
    const [progress, setProgress] = useState(5);

    useEffect(() => {
        // Simulate progress: Fast start, then slow down
        const timer = setInterval(() => {
            setProgress((oldProgress) => {
                if (oldProgress === 100) return 100;
                const diff = Math.random() * 10;
                // Slow down as we get higher
                const increment = diff * (1 - oldProgress / 100);
                return Math.min(oldProgress + increment, 95);
            });
        }, 200);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <div className="w-full max-w-xs p-4 bg-gray-900/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl animate-fade-in z-50">
            <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{label}</span>
                <span className="text-xs font-mono text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-200 ease-out relative" 
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

interface ImageUploaderProps {
  onImageUpload: (data: ImageData) => void;
  imagePreview: string | null;
  isLoading: boolean;
  promptText?: string;
  showAnalyzeButton?: boolean;
  onAnalyzeClick?: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreview, isLoading, promptText = "Drop your work here to begin.", showAnalyzeButton = false, onAnalyzeClick }) => {
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
          <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img src={imagePreview} alt="Preview" className={`max-h-[70vh] rounded-lg transition-opacity ${isLoading ? 'opacity-30 blur-sm' : 'opacity-100'} shadow-2xl border border-white/10`} />
              
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <ProgressBar label="Analyzing..." />
                </div>
              )}

              {/* Manual Analyze Button Overlay */}
              {showAnalyzeButton && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                      <button 
                        onClick={(e) => {
                            e.preventDefault();
                            onAnalyzeClick?.();
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transform hover:scale-105 transition-all text-lg border border-white/10"
                      >
                          <BoltIcon className="w-6 h-6" /> Analyze Now
                      </button>
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
  onUploadNew: () => void;
}> = ({ activeImage, setActiveImage, switchToEditView, connections, isApiKeySelected, setIsApiKeySelected, onPortfolioUpdate, onNavigateToStudio, onSelectApiKey, onUploadNew }) => {
  const [editingState, setEditingState] = useState({ isEditing: false, suggestion: '' });
  const [distributionStatus, setDistributionStatus] = useState<DistributionStatus[]>([]);
  const [distributionResult, setDistributionResult] = useState<DistributionResult | null>(null);

  // Core analysis logic refactored for reuse
  const performAnalysis = useCallback(async (imageData: ImageData, imageId: string) => {
      // If already analyzing, don't trigger again (prevent double calls if logic loops)
      // Note: The caller should ensure loading state is set.

      try {
          const analysisResult = await GeminiService.analyzeImage(imageData.base64, imageData.mimeType);
          
          setActiveImage(prev => {
             // Ensure we are updating the correct image context
             if (prev?.id === imageId) {
                 const updatedImage = {
                     ...prev,
                     analysis: analysisResult,
                     isAnalyzed: true,
                     isLoading: false,
                 };
                 onPortfolioUpdate(updatedImage);
                 return updatedImage;
             }
             return prev;
          });

      } catch (error) {
          console.error("Error analyzing image:", error);
          setActiveImage(prev => {
              if (prev?.id === imageId) {
                  return { ...prev, isLoading: false, analysis: null };
              }
              return prev;
          });
      }
  }, [setActiveImage, onPortfolioUpdate]);

  // Handle new file uploads
  const handleImageUpload = async (imageData: ImageData) => {
    const imageId = Date.now().toString();
    
    const currentImage: ActiveImage = {
      id: imageId,
      data: imageData,
      analysis: null,
      isAnalyzed: false,
      isLoading: true // Start loading immediately
    };
    setActiveImage(currentImage);
    setDistributionResult(null);
    setDistributionStatus([]);

    // Trigger analysis
    performAnalysis(imageData, imageId);
  };

  // Auto-trigger analysis if image is in loading state on mount (e.g. from Editor save & analyze)
  useEffect(() => {
      if (activeImage && activeImage.isLoading && !activeImage.isAnalyzed) {
          performAnalysis(activeImage.data, activeImage.id);
      }
  }, [activeImage?.id, activeImage?.isLoading, performAnalysis]);


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
    // Set to loading and re-run
    setActiveImage(prev => prev ? { ...prev, isLoading: true, isAnalyzed: false, analysis: null } : null);
    performAnalysis(activeImage.data, activeImage.id);
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
              onUploadNew={onUploadNew}
            />
        </>
      ) : (
        <div className="max-w-4xl mx-auto pt-12 animate-fade-in-up">
            <ImageUploader
                onImageUpload={handleImageUpload}
                imagePreview={activeImage?.data.preview || null}
                isLoading={activeImage?.isLoading || false}
                showAnalyzeButton={!!activeImage && !activeImage.isAnalyzed && !activeImage.isLoading}
                onAnalyzeClick={handleReAnalyze}
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
    onSendToLightBox: (imageData: ImageData, shouldAnalyze: boolean) => void;
    onUploadNew: () => void;
}> = ({ initialImage, analysis, onSendToLightBox, onUploadNew }) => {
    const [image, setImage] = useState<ImageData | null>(initialImage);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeQuickEdit, setActiveQuickEdit] = useState<string | null>(null);
    const [history, setHistory] = useState<EditHistoryItem[]>([]);
    const [showCompare, setShowCompare] = useState(false);
    const [compareSplit, setCompareSplit] = useState(50);
    const [activeCategory, setActiveCategory] = useState<'light' | 'color' | 'detail' | 'grade' | 'mixer'>('light');

    // Annotation / Mask State
    const [annotationMode, setAnnotationMode] = useState<'none' | 'brush' | 'eraser'>('none');
    const [brushSize, setBrushSize] = useState(20);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasMask, setHasMask] = useState(false);
    const [applyToSelection, setApplyToSelection] = useState(false); // Toggle: Whole Image vs Selection

    // Style Match AI State
    const [stylePrompt, setStylePrompt] = useState('');
    const [refImagePreview, setRefImagePreview] = useState<string | null>(null);
    const [refImageBase64, setRefImageBase64] = useState<string | null>(null);
    const [isStyleMatching, setIsStyleMatching] = useState(false);

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

    // Canvas Resize Observer
    useEffect(() => {
        const resizeCanvas = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                const parent = canvasRef.current.parentElement;
                // Match the visual size of the image, not just the parent container
                const img = parent.querySelector('img');
                if (img) {
                    canvasRef.current.width = img.clientWidth;
                    canvasRef.current.height = img.clientHeight;
                    // Position absolute relative to container handled by CSS
                }
            }
        };
        
        window.addEventListener('resize', resizeCanvas);
        // Small delay to ensure image renders
        const t = setTimeout(resizeCanvas, 100);
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            clearTimeout(t);
        };
    }, [image]);

    // --- Drawing Handlers ---
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (annotationMode === 'none') return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            // Check if canvas is empty to toggle hasMask
            // optimization: assume true if drawing happened, provide clear button
            setHasMask(true);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || annotationMode === 'none' || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (annotationMode === 'brush') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white
            ctx.beginPath();
            ctx.moveTo(x, y); // Simply plotting points for now, needs `prevX` for smooth lines
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (annotationMode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.beginPath();
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };
    
    // Improved drawing with previous coordinates
    const lastPos = useRef<{x: number, y: number} | null>(null);
    const drawSmooth = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || annotationMode === 'none' || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;
        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        if (lastPos.current) {
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (annotationMode === 'brush') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; 
            } else {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            }

            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        lastPos.current = { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (annotationMode === 'none') return;
        setIsDrawing(true);
        const rect = canvasRef.current!.getBoundingClientRect();
        lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    
    const handleTouchStart = (e: React.TouchEvent) => {
        if (annotationMode === 'none') return;
        setIsDrawing(true);
        const rect = canvasRef.current!.getBoundingClientRect();
        lastPos.current = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    };

    const clearMask = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setHasMask(false);
        }
    };

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
            let maskBase64: string | undefined = undefined;
            if (applyToSelection && hasMask && canvasRef.current) {
                // Get the mask from the canvas
                // Create a temporary canvas to ensure black background and white mask
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvasRef.current.width;
                tempCanvas.height = canvasRef.current.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    tempCtx.fillStyle = 'black';
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                    tempCtx.drawImage(canvasRef.current, 0, 0); // Overlay the white strokes
                    const dataUrl = tempCanvas.toDataURL('image/png');
                    maskBase64 = dataUrl.split(',')[1];
                }
            }

            const newBase64 = await GeminiService.editImage(editPrompt, image.base64, image.mimeType, maskBase64);
            const newImageData = {
                base64: newBase64,
                mimeType: 'image/png',
                preview: `data:image/png;base64,${newBase64}`,
            };
            setImage(newImageData);
            addToHistory(newImageData, quickEditName || (applyToSelection ? 'Generative Fill (Selection)' : 'Generative Fill'), adjustments);
            
            // Clear mask after successful edit if it was a selection edit
            if (applyToSelection) clearMask();

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
            addToHistory(newImageData, 'Upscale (24MP)', adjustments);
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

    // --- Style Match AI ---
    const handleRefUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const imageData = await fileToImageData(file);
                setRefImagePreview(imageData.preview);
                setRefImageBase64(imageData.base64);
            } catch (error) {
                console.error("Error reading ref file", error);
            }
        }
    };

    const handleStyleMatch = async () => {
        if (!stylePrompt && !refImageBase64) return;
        setIsStyleMatching(true);
        try {
            const newAdjustments = await GeminiService.generateAdjustments(stylePrompt, refImageBase64 || undefined);
            setAdjustments(prev => ({ ...prev, ...newAdjustments }));
        } catch (error) {
            console.error("Style match failed", error);
        } finally {
            setIsStyleMatching(false);
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

                {/* Style Match AI - Placed prominently at the top */}
                <div className="p-4 border-b border-white/5 bg-indigo-900/10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-3">
                        <ChatBubbleLeftRightIcon className="w-3 h-3" /> Style Match AI
                    </h3>
                    <div className="space-y-3">
                        <textarea 
                            value={stylePrompt}
                            onChange={(e) => setStylePrompt(e.target.value)}
                            placeholder="Describe style (e.g. 'Warm 1980s film look')"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-16"
                        />
                        <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-1.5 px-2 flex items-center justify-center gap-2 transition-all">
                                <PaperClipIcon className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-300 truncate">
                                    {refImagePreview ? 'Ref Selected' : 'Upload Ref'}
                                </span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleRefUpload} />
                            </label>
                            {refImagePreview && (
                                <img src={refImagePreview} alt="ref" className="w-8 h-8 rounded object-cover border border-white/10" />
                            )}
                        </div>
                        <button 
                            onClick={handleStyleMatch}
                            disabled={isStyleMatching || (!stylePrompt && !refImageBase64)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isStyleMatching ? <Spinner /> : 'Match Sliders'}
                        </button>
                    </div>
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

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <ProgressBar label={activeQuickEdit ? `Applying ${activeQuickEdit}...` : 'Processing Edit...'} />
                    </div>
                )}

                {/* Image Container with Filters & Overlays */}
                <div className="relative max-w-full max-h-full shadow-[0_0_50px_-10px_rgba(0,0,0,0.7)] transition-transform duration-200 select-none">
                    
                    {/* Render Content Function */}
                    {(() => {
                        const renderImageLayer = (isOriginal: boolean) => {
                             const imgSrc = isOriginal ? originalImageSrc : image.preview;
                             const filterStyle = isOriginal ? {} : { filter: `${activeFilter} url(#advancedCorrections)` };
                             const showOverlays = !isOriginal;

                             return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {showOverlays && (
                                        <>
                                            {/* Mask Canvas Overlay */}
                                            <canvas
                                                ref={canvasRef}
                                                className={`absolute z-20 touch-none ${annotationMode !== 'none' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                                                onMouseDown={handleMouseDown}
                                                onMouseMove={drawSmooth}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={handleTouchStart}
                                                onTouchMove={drawSmooth}
                                                onTouchEnd={stopDrawing}
                                            />

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
                
                {/* Annotation Tools Floating Toolbar */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md p-2 rounded-2xl flex items-center gap-4 border border-white/10 shadow-2xl z-40">
                    <button 
                        onClick={() => setAnnotationMode('none')}
                        className={`p-2.5 rounded-xl transition-all ${annotationMode === 'none' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="View Mode"
                    >
                        <ArrowsPointingOutIcon className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-white/10"></div>
                    <button 
                        onClick={() => setAnnotationMode('brush')}
                        className={`p-2.5 rounded-xl transition-all ${annotationMode === 'brush' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Mask Brush"
                    >
                        <BrushIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setAnnotationMode('eraser')}
                        className={`p-2.5 rounded-xl transition-all ${annotationMode === 'eraser' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Mask Eraser"
                    >
                        <EraserIcon className="w-5 h-5" />
                    </button>
                    {hasMask && (
                        <button 
                            onClick={clearMask}
                            className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Clear Mask"
                        >
                            <XCircleIcon className="w-5 h-5" />
                        </button>
                    )}
                    {/* Brush Size Slider */}
                    {(annotationMode === 'brush' || annotationMode === 'eraser') && (
                        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                            <span className="text-[10px] font-bold text-gray-400 w-4">{brushSize}</span>
                            <input 
                                type="range" 
                                min="5" 
                                max="100" 
                                value={brushSize} 
                                onChange={(e) => setBrushSize(Number(e.target.value))} 
                                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* --- Right Panel: The AI Lab --- */}
            <div className="w-full md:w-80 bg-surfaceHighlight/50 border-l border-white/5 flex flex-col z-20 shadow-2xl flex-shrink-0 backdrop-blur-md">
                 
                {/* Updated Header with Top Action Buttons */}
                <div className="p-4 border-b border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {/* Primary Action: Save & Analyze */}
                        <button 
                            onClick={() => onSendToLightBox(image, true)}
                            className="col-span-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-xs transition-all border border-white/10"
                        >
                            <SparklesIcon className="w-4 h-4" /> Save & Analyze
                        </button>
                        
                        {/* Secondary Action: Save Only */}
                        <button 
                            onClick={() => onSendToLightBox(image, false)}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all border border-white/10"
                        >
                            <RectangleStackIcon className="w-3 h-3" /> Save to Light Box
                        </button>

                        {/* Tertiary Action: Download */}
                        <button 
                            onClick={handleDownload}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all border border-white/10"
                            title="Download to Device"
                        >
                            <ArrowDownTrayIcon className="w-3 h-3" /> Download
                        </button>

                        {/* Quaternary Action: Upload New */}
                        <button 
                            onClick={onUploadNew}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all border border-white/10"
                            title="Upload New Photo"
                        >
                            <ArrowUpTrayIcon className="w-3 h-3" /> New
                        </button>
                    </div>

                    <h2 className="text-xs font-display font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 pt-2 border-t border-white/5">
                        <SparklesIcon className="w-4 h-4" /> AI Generation Lab
                    </h2>
                </div>

                <div className="p-5 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
                    {/* Analyze CTA if analysis is missing */}
                    {!analysis && (
                        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-4 rounded-xl border border-indigo-500/30 text-center animate-fade-in">
                            <SparklesIcon className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                            <h3 className="text-sm font-bold text-white mb-1">Unlock Creative Intelligence</h3>
                            <p className="text-[10px] text-gray-300 mb-3">Analyze this image to get AI-powered creative remixes and smart fixes.</p>
                            <button 
                                onClick={() => onSendToLightBox(image, true)}
                                className="w-full bg-white text-black font-bold py-2 rounded-lg text-xs hover:bg-gray-200 transition-colors shadow-lg"
                            >
                                Analyze Image
                            </button>
                        </div>
                    )}

                    {/* Creative Suggestions (Only show if analysis exists) */}
                    {analysis && analysis.creative_remixes && (
                        <div className="space-y-3 animate-fade-in">
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

                    {/* Generative Prompt with Selection Toggle */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generative Fill</h3>
                            {/* Toggle Switch */}
                            <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                                <button 
                                    onClick={() => setApplyToSelection(false)}
                                    className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${!applyToSelection ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Whole Image
                                </button>
                                <button 
                                    onClick={() => setApplyToSelection(true)}
                                    className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all flex items-center gap-1 ${applyToSelection ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Selection {hasMask && <span className="w-1.5 h-1.5 rounded-full bg-green-400 block"></span>}
                                </button>
                            </div>
                        </div>
                        
                        {applyToSelection && !hasMask && (
                            <div className="bg-yellow-900/20 border border-yellow-500/20 p-2 rounded text-[10px] text-yellow-200 flex items-center gap-2">
                                <BrushIcon className="w-3 h-3" />
                                Use the brush tool below the image to select an area.
                            </div>
                        )}

                        <div className="relative">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={applyToSelection ? "Describe change for selection..." : "Describe a change (e.g., 'Add a neon sign')..."}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-24 resize-none transition-all"
                            />
                            <div className="absolute bottom-2 right-2">
                                <SparklesIcon className="w-4 h-4 text-indigo-500/50" />
                            </div>
                        </div>
                        <button 
                            onClick={() => executeEdit(prompt, null)}
                            disabled={isLoading || !prompt || (applyToSelection && !hasMask)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                        >
                            {isLoading && !activeQuickEdit ? <Spinner /> : 'Generate Edit'}
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
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
                </div>
            </div>
        </div>
    );
};

const RoutesView: React.FC = () => {
    const [messages, setMessages] = useState<RouteChatMessage[]>([
        { role: 'model', text: 'I am your Strategy Consultant. What business process do you want to automate today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;
        
        const newMessages = [...messages, { role: 'user', text } as RouteChatMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Convert to history format for service
            const history = newMessages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const response = await GeminiService.routeStrategistChat(history, text);
            
            setMessages(prev => [...prev, { 
                role: 'model', 
                text: response.text, 
                options: response.options 
            }]);

            if (response.build_trigger && response.final_prompt) {
                // Generate workflow
                setMessages(prev => [...prev, { role: 'model', text: 'Generating your route workflow...' }]);
                const wf = await GeminiService.generateWorkflowFromPrompt(response.final_prompt);
                setWorkflow(wf);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto pt-24 h-screen flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                <MapIcon className="w-8 h-8 text-indigo-400" /> Route Builder
            </h1>
            
            <div className="flex-grow bg-gray-900/50 border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col md:flex-row gap-6">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-grow overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200 border border-white/5'}`}>
                                    <p>{msg.text}</p>
                                    {msg.options && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {msg.options.map(opt => (
                                                <button 
                                                    key={opt}
                                                    onClick={() => handleSend(opt)}
                                                    className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs font-bold transition-colors"
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="text-gray-500 text-xs animate-pulse">Strategist is thinking...</div>}
                    </div>
                    
                    <div className="relative">
                        <input 
                            type="text" 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSend(input)}
                            placeholder="Describe your goal..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <button 
                            onClick={() => handleSend(input)}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 bg-indigo-600 p-1.5 rounded-lg text-white disabled:opacity-50"
                        >
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Workflow Preview Area */}
                <div className="w-full md:w-80 bg-black/20 border-l border-white/5 pl-6 hidden md:flex flex-col">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Active Route</h3>
                    {workflow ? (
                        <div className="space-y-4 overflow-y-auto flex-grow">
                             <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-xl">
                                <h4 className="font-bold text-white text-sm">{workflow.title}</h4>
                                <p className="text-xs text-gray-400 mt-1">{workflow.description}</p>
                             </div>
                             <div className="space-y-2">
                                {workflow.steps.map((step, i) => (
                                    <div key={step.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
                                        <div className="bg-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-200">{step.name}</p>
                                            <p className="text-[10px] text-gray-500">{step.actor.toUpperCase()}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-center p-4">
                            <p className="text-gray-600 text-sm">Chat with the strategist to build a new workflow.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const StudioView: React.FC<{ 
    onGenerate?: (concept: ShotConcept) => void;
    onSendToLightBox: (imageData: ImageData) => void;
}> = ({ onGenerate, onSendToLightBox }) => {
    const [inputs, setInputs] = useState({ subject: '', location: '', mood: '', lighting: '' });
    const [concepts, setConcepts] = useState<ShotConcept[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // New state for images
    const [conceptImages, setConceptImages] = useState<Record<number, ImageData | null>>({});
    const [conceptImageLoading, setConceptImageLoading] = useState<Record<number, boolean>>({});

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const results = await GeminiService.generateShotConcepts(inputs);
            setConcepts(results);
            setConceptImages({}); // Clear previous
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateConceptImage = async (concept: ShotConcept, index: number) => {
        setConceptImageLoading(prev => ({ ...prev, [index]: true }));
        try {
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

    return (
        <div className="p-8 max-w-5xl mx-auto pt-24">
             <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                <StudioIcon className="w-8 h-8 text-indigo-400" /> Shot Architect
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Concept Inputs</h3>
                    <input 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Subject (e.g., Cyberpunk Street Racer)"
                        value={inputs.subject}
                        onChange={e => setInputs({...inputs, subject: e.target.value})}
                    />
                    <input 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Location (e.g., Neon Rain City)"
                        value={inputs.location}
                        onChange={e => setInputs({...inputs, location: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                            placeholder="Mood (e.g., Melancholy)"
                            value={inputs.mood}
                            onChange={e => setInputs({...inputs, mood: e.target.value})}
                        />
                        <input 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                            placeholder="Lighting (e.g., Blue Hour)"
                            value={inputs.lighting}
                            onChange={e => setInputs({...inputs, lighting: e.target.value})}
                        />
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Spinner /> : 'Generate Concepts'}
                    </button>
                </div>

                <div className="space-y-4">
                    {concepts.map((concept, i) => (
                        <div key={i} className="bg-gray-900/50 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all cursor-pointer group">
                             <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-white text-lg">{concept.title}</h4>
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 uppercase tracking-wider">{concept.difficulty}</span>
                             </div>
                             <p className="text-gray-400 text-sm mb-3">{concept.visual_description}</p>
                             <div className="text-xs text-gray-500 font-mono bg-black/30 p-2 rounded border border-white/5">
                                 {concept.technical_specs}
                             </div>

                             {/* Image Generation Section */}
                             <div className="pt-4 border-t border-white/5 mt-4 relative">
                                 {conceptImages[i] ? (
                                     <div className="relative group/image">
                                         <img src={conceptImages[i]!.preview} className="w-full h-40 object-cover rounded-lg border border-white/10 shadow-lg" alt={concept.title} />
                                         <button 
                                            onClick={() => onSendToLightBox(conceptImages[i]!)}
                                            className="absolute bottom-2 right-2 bg-black/60 hover:bg-green-600 text-white p-2 rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover/image:opacity-100 shadow-xl border border-white/10"
                                            title="Edit in Light Box"
                                         >
                                            <ArrowRightIcon className="w-4 h-4" />
                                         </button>
                                     </div>
                                 ) : (
                                     <>
                                        {conceptImageLoading[i] && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                                                <ProgressBar label="Dreaming..." />
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleGenerateConceptImage(concept, i)}
                                            disabled={conceptImageLoading[i]}
                                            className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-2 rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
                                        >
                                            Generate Preview <PhotoIcon className="w-3 h-3" />
                                        </button>
                                     </>
                                 )}
                            </div>
                        </div>
                    ))}
                    {concepts.length === 0 && !isLoading && (
                        <div className="h-full flex items-center justify-center text-gray-600 border border-dashed border-white/5 rounded-2xl min-h-[300px]">
                            Enter details to generate shot lists.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<AppView>(AppView.WELCOME);
    const [user, setUser] = useState<User | null>(null);
    const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);
    const [connections, setConnections] = useState<Connections>({ 'Instagram': true });
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [portfolioImages, setPortfolioImages] = useState<ActiveImage[]>([]);

    // Check for API key on mount
    useEffect(() => {
        const checkApiKey = async () => {
            if ((window as any).aistudio) {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                setIsApiKeySelected(hasKey);
            } else {
                // Fallback or dev mode check
                setIsApiKeySelected(!!process.env.API_KEY);
            }
        };
        checkApiKey();
    }, []);

    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        setActiveView(AppView.LIGHT_BOX);
    };

    const handleLogout = () => {
        setUser(null);
        setActiveView(AppView.WELCOME);
    };

    const handleSendToLightBox = (imageData: ImageData, shouldAnalyze: boolean) => {
        const newImage: ActiveImage = {
            id: Date.now().toString(),
            data: imageData,
            analysis: null,
            isAnalyzed: false,
            isLoading: shouldAnalyze
        };
        setActiveImage(newImage);
        setActiveView(AppView.LIGHT_BOX);
    };
    
    const handlePortfolioUpdate = (updatedImage: ActiveImage) => {
        // Update active image if it matches
        if (activeImage?.id === updatedImage.id) {
            setActiveImage(updatedImage);
        }
        
        // Update list
        setPortfolioImages(prev => {
            const index = prev.findIndex(img => img.id === updatedImage.id);
            if (index > -1) {
                const newList = [...prev];
                newList[index] = updatedImage;
                return newList;
            }
            return [updatedImage, ...prev];
        });
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
                                    setActiveImage(prev => prev ? {...prev, data: imgData} : null); 
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

                        {activeView === AppView.ROUTES && (
                             <RoutesView />
                        )}

                        {activeView === AppView.EARNINGS && <EarningsDashboard />}
                        
                        {activeView === AppView.PORTFOLIO && <PortfolioView portfolioImages={portfolioImages} />}
                        
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