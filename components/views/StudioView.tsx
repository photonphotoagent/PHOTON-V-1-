import React, { useState } from 'react';
import { ShotConcept, ImageData } from '../../types';
import * as GeminiService from '../../services/geminiService';
import { Spinner } from '../Spinner';
import { ProgressBar } from '../ui/ProgressBar';
import { StudioIcon, PhotoIcon, ArrowRightIcon } from '../icons';

interface StudioViewProps {
  onGenerate?: (concept: ShotConcept) => void;
  onSendToLightBox: (imageData: ImageData) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({ onGenerate, onSendToLightBox }) => {
  const [inputs, setInputs] = useState({
    subject: '',
    location: '',
    mood: '',
    lighting: '',
  });
  const [concepts, setConcepts] = useState<ShotConcept[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [conceptImages, setConceptImages] = useState<Record<number, ImageData | null>>({});
  const [conceptImageLoading, setConceptImageLoading] = useState<Record<number, boolean>>({});

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const results = await GeminiService.generateShotConcepts(inputs);
      setConcepts(results);
      setConceptImages({});
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateConceptImage = async (concept: ShotConcept, index: number) => {
    setConceptImageLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const newBase64 = await GeminiService.generateImage(concept.visual_description, '16:9');
      const newImageData = {
        base64: newBase64,
        mimeType: 'image/png',
        preview: `data:image/png;base64,${newBase64}`,
      };
      setConceptImages((prev) => ({ ...prev, [index]: newImageData }));
    } catch (error) {
      console.error('Error generating concept image', error);
    } finally {
      setConceptImageLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto pt-24">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
        <StudioIcon className="w-8 h-8 text-indigo-400" /> Shot Architect
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Concept Inputs
          </h3>
          <input
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
            placeholder="Subject (e.g., Cyberpunk Street Racer)"
            value={inputs.subject}
            onChange={(e) => setInputs({ ...inputs, subject: e.target.value })}
          />
          <input
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
            placeholder="Location (e.g., Neon Rain City)"
            value={inputs.location}
            onChange={(e) => setInputs({ ...inputs, location: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="Mood (e.g., Melancholy)"
              value={inputs.mood}
              onChange={(e) => setInputs({ ...inputs, mood: e.target.value })}
            />
            <input
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="Lighting (e.g., Blue Hour)"
              value={inputs.lighting}
              onChange={(e) => setInputs({ ...inputs, lighting: e.target.value })}
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
            <div
              key={i}
              className="bg-gray-900/50 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-white text-lg">{concept.title}</h4>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 uppercase tracking-wider">
                  {concept.difficulty}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-3">{concept.visual_description}</p>
              <div className="text-xs text-gray-500 font-mono bg-black/30 p-2 rounded border border-white/5">
                {concept.technical_specs}
              </div>

              {/* Image Generation Section */}
              <div className="pt-4 border-t border-white/5 mt-4 relative">
                {conceptImages[i] ? (
                  <div className="relative group/image">
                    <img
                      src={conceptImages[i]!.preview}
                      className="w-full h-40 object-cover rounded-lg border border-white/10 shadow-lg"
                      alt={concept.title}
                    />
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
