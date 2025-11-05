import React, { useState } from 'react';
import { ActiveImage } from '../types';
import { AnalyticsModal } from './AnalyticsModal';
import { RectangleStackIcon } from './icons';

export const PortfolioView: React.FC<{
    portfolioImages: ActiveImage[];
}> = ({ portfolioImages }) => {
    const [selectedImage, setSelectedImage] = useState<ActiveImage | null>(null);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-6">My Portfolio</h1>
            
            {portfolioImages.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                     <RectangleStackIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                     <h3 className="text-xl font-semibold text-gray-300">Your Portfolio is Empty</h3>
                     <p className="mt-2">Analyzed and distributed images will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {portfolioImages.map(image => (
                        <div 
                            key={image.id} 
                            className="relative aspect-square group cursor-pointer"
                            onClick={() => setSelectedImage(image)}
                        >
                            <img src={image.data.preview} alt={`Portfolio item ${image.id}`} className="w-full h-full object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                <div className="text-center text-white">
                                    <p className="text-sm font-bold">View Analytics</p>
                                    {image.analysis && (
                                         <p className="text-xs">{image.analysis.monetization_score.overall}/99 Score</p>
                                    )}
                                </div>
                            </div>
                            {image.isDistributed && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    Live
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {selectedImage && (
                <AnalyticsModal 
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
};
