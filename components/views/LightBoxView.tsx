import React, { useState, useCallback, useEffect } from 'react';
import {
  ActiveImage,
  Connections,
  PlatformName,
  DistributionStatus,
  DistributionResult,
  ImageData,
} from '../../types';
import * as GeminiService from '../../services/geminiService';
import * as DistributionService from '../../services/distributionService';
import { ImageUploader } from '../ui/ImageUploader';
import { AnalysisDashboard } from '../AnalysisDashboard';
import { EditIcon, BeakerIcon } from '../icons';

interface LightBoxViewProps {
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
}

export const LightBoxView: React.FC<LightBoxViewProps> = ({
  activeImage,
  setActiveImage,
  switchToEditView,
  connections,
  isApiKeySelected,
  setIsApiKeySelected,
  onPortfolioUpdate,
  onNavigateToStudio,
  onSelectApiKey,
  onUploadNew,
}) => {
  const [editingState, setEditingState] = useState({ isEditing: false, suggestion: '' });
  const [distributionStatus, setDistributionStatus] = useState<DistributionStatus[]>([]);
  const [distributionResult, setDistributionResult] = useState<DistributionResult | null>(null);

  const performAnalysis = useCallback(
    async (imageData: ImageData, imageId: string) => {
      try {
        const analysisResult = await GeminiService.analyzeImage(
          imageData.base64,
          imageData.mimeType
        );

        setActiveImage((prev) => {
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
        console.error('Error analyzing image:', error);
        setActiveImage((prev) => {
          if (prev?.id === imageId) {
            return { ...prev, isLoading: false, analysis: null };
          }
          return prev;
        });
      }
    },
    [setActiveImage, onPortfolioUpdate]
  );

  const handleImageUpload = async (imageData: ImageData) => {
    const imageId = Date.now().toString();

    const currentImage: ActiveImage = {
      id: imageId,
      data: imageData,
      analysis: null,
      isAnalyzed: false,
      isLoading: true,
    };
    setActiveImage(currentImage);
    setDistributionResult(null);
    setDistributionStatus([]);

    performAnalysis(imageData, imageId);
  };

  useEffect(() => {
    if (activeImage && activeImage.isLoading && !activeImage.isAnalyzed) {
      performAnalysis(activeImage.data, activeImage.id);
    }
  }, [activeImage?.id, activeImage?.isLoading, performAnalysis]);

  const handleApplyEdit = async (suggestion: string) => {
    if (!activeImage) return;
    setEditingState({ isEditing: true, suggestion: suggestion });
    try {
      const newBase64 = await GeminiService.editImage(
        suggestion,
        activeImage.data.base64,
        activeImage.data.mimeType
      );
      const newImageData = {
        base64: newBase64,
        mimeType: 'image/png',
        preview: `data:image/png;base64,${newBase64}`,
      };
      await handleImageUpload(newImageData);
    } catch (error) {
      console.error('Error applying edit:', error);
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
          setDistributionStatus((prev) => {
            const existingIndex = prev.findIndex(
              (s) =>
                s.platform === statusUpdate.platform && s.status === statusUpdate.status
            );
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
        const updatedImage = {
          ...activeImage,
          isDistributed: true,
          distributionResult: result,
        };
        setActiveImage(updatedImage);
        onPortfolioUpdate(updatedImage);
      }
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('Requested entity was not found.')
      ) {
        console.error('API Key error during distribution:', error);
        alert(
          'Distribution failed due to an invalid API Key. Please select a valid key and try again.'
        );
        setIsApiKeySelected(false);
      } else {
        console.error('An unexpected error occurred during distribution:', error);
        alert(
          'An unexpected error occurred during distribution. Please check the console for details.'
        );
      }
    }
  };

  const handleReAnalyze = () => {
    if (!activeImage) return;
    setActiveImage((prev) =>
      prev ? { ...prev, isLoading: true, isAnalyzed: false, analysis: null } : null
    );
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
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${activeImage.data.base64}`;
      link.download = `photon_agent_${activeImage.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
              <EditIcon className="w-5 h-5" /> Launch Pro Editor
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
            showAnalyzeButton={
              !!activeImage && !activeImage.isAnalyzed && !activeImage.isLoading
            }
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
