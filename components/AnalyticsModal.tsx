import React, { useEffect, useState } from 'react';
import { ActiveImage, PerformanceData, PerformanceMetrics, PlatformName } from '../types';
import * as PerformanceService from '../services/performanceService';
import { Spinner } from './Spinner';
import { XCircleIcon, EyeIcon, ArrowDownTrayIcon, BanknotesIcon, TagIcon, ArrowTrendingUpIcon } from './icons';
import { platforms } from '../App';

// --- Helper Functions & Components ---
const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string; className?: string }> = ({ icon, label, value, className = '' }) => (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
        <div className="text-gray-400">{icon}</div>
        <span className="text-gray-300 whitespace-nowrap">{label}:</span>
        <span className="font-bold text-white">{value}</span>
    </div>
);

const ScoreBar: React.FC<{ label: string, score: number }> = ({ label, score }) => {
    const getScoreColor = () => {
        if (score >= 90) return 'bg-green-500';
        if (score >= 70) return 'bg-sky-500';
        if (score >= 50) return 'bg-yellow-500';
        if (score >= 30) return 'bg-orange-500';
        return 'bg-red-500';
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-300">{label}</span>
                <span className="text-xs font-bold text-white">{score}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className={`${getScoreColor()} h-1.5 rounded-full`} style={{ width: `${(score/99)*100}%` }}></div>
            </div>
        </div>
    );
};

const PlatformPerformanceChart: React.FC<{ data: PerformanceData }> = ({ data }) => {
    const entries = Object.entries(data).filter(([, metrics]) => metrics) as [PlatformName, PerformanceMetrics][];
    const maxEarning = Math.max(...entries.map(([, metrics]) => metrics.earnings));

    if (entries.length === 0) return null;

    return (
        <div className="space-y-2">
            {entries.sort((a,b) => b[1].earnings - a[1].earnings).map(([platform, metrics]) => (
                <div key={platform} className="flex items-center text-xs">
                    <span className="w-24 text-gray-400 truncate">{platform}</span>
                    <div className="flex-grow bg-gray-700 rounded-full h-4">
                        <div 
                            className="bg-indigo-500 h-4 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(metrics.earnings / maxEarning) * 100}%` }}
                        >
                             <span className="text-white font-bold">{formatCurrency(metrics.earnings)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const MiniSparkline: React.FC<{ data: { day: number; amount: number }[], className?: string }> = ({ data = [], className = '' }) => {
    const width = 100;
    const height = 25;
    if (data.length < 2) return null;

    const maxAmount = Math.max(...data.map(d => d.amount));
    const minAmount = Math.min(...data.map(d => d.amount));

    const getX = (index: number) => (width / (data.length - 1)) * index;
    const getY = (amount: number) => {
        if (maxAmount === minAmount) return height / 2;
        return height - (height * (amount - minAmount) / (maxAmount - minAmount));
    };

    const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.amount)}`).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-auto ${className}`} preserveAspectRatio="none">
             <path d={pathData} stroke="#4f46e5" strokeWidth="2" fill="none" />
        </svg>
    );
};


// --- Main Modal Component ---
export const AnalyticsModal: React.FC<{
    image: ActiveImage;
    onClose: () => void;
}> = ({ image, onClose }) => {
    const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!image.isDistributed) {
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                const data = await PerformanceService.fetchPerformanceData(image);
                setPerformanceData(data);
            } catch (error) {
                console.error("Failed to fetch performance data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [image]);

    return (
        <div 
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full md:w-1/2 lg:w-2/5 relative flex-shrink-0">
                     <img src={image.data.preview} alt="Analytics Detail" className="w-full h-full object-cover" />
                </div>
                <div className="w-full md:w-1/2 lg:w-3/5 p-6 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                         <h2 className="text-2xl font-bold text-white">Image Performance</h2>
                         <button onClick={onClose} className="text-gray-400 hover:text-white">
                             <XCircleIcon className="w-8 h-8"/>
                         </button>
                    </div>

                    {isLoading ? (
                         <div className="flex justify-center items-center flex-grow">
                            <Spinner />
                         </div>
                    ) : (
                        <div className="space-y-6">
                            {/* AI Insights Section */}
                            {image.analysis && (
                                <div className="bg-gray-900/50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-300 mb-3">AI Insights & Metadata</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                             <ScoreBar label="Tech Quality" score={image.analysis.scores.technical_quality} />
                                             <ScoreBar label="Commercial Appeal" score={image.analysis.scores.monetization} />
                                             <ScoreBar label="Artistic Merit" score={image.analysis.scores.portfolio} />
                                             <ScoreBar label="Viral Potential" score={image.analysis.scores.social} />
                                        </div>
                                        <div>
                                             <h4 className="text-sm font-bold text-gray-400 mb-2">Keywords</h4>
                                             <div className="flex flex-wrap gap-1">
                                                 {image.analysis.monetization_strategy.suggested_keywords.map(kw => (
                                                    <span key={kw} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-md">{kw}</span>
                                                 ))}
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Platform Performance Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-300 mb-3">Platform Performance</h3>
                                {!image.isDistributed || !performanceData || Object.keys(performanceData).length === 0 ? (
                                    <div className="text-center text-gray-400 p-4 bg-gray-900/50 rounded-lg">This image has not been distributed yet.</div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 mb-2">Earnings by Platform</h4>
                                            <PlatformPerformanceChart data={performanceData} />
                                        </div>
                                        <div className="space-y-3">
                                            {Object.entries(performanceData).map(([platform, metrics]) => {
                                                const platformDetails = platforms.find(p => p.name === platform);
                                                const perfMetrics = metrics as PerformanceMetrics;
                                                if (!perfMetrics || !platformDetails) return null;

                                                const conversionRate = perfMetrics.views > 0 ? (perfMetrics.downloads / perfMetrics.views * 100) : 0;
                                                const avgEarning = perfMetrics.downloads > 0 ? (perfMetrics.earnings / perfMetrics.downloads) : 0;

                                                return (
                                                    <div key={platform} className="bg-gray-900/50 p-3 rounded-lg">
                                                        <div className="flex items-center space-x-3 mb-3">
                                                            <img src={platformDetails.logo} alt={platformDetails.name} className="h-6 w-auto object-contain invert-[.85] brightness-200" style={{maxHeight: '1.5rem', maxWidth: '80px'}} />
                                                            <h4 className="font-bold text-gray-200 flex-grow">{platform}</h4>
                                                            <div className="w-24">
                                                                <MiniSparkline data={perfMetrics.earningsOverTime} />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
                                                            <Metric icon={<EyeIcon className="w-4 h-4"/>} label="Views" value={formatNumber(perfMetrics.views)} />
                                                            <Metric icon={<ArrowDownTrayIcon className="w-4 h-4"/>} label="Downloads" value={formatNumber(perfMetrics.downloads)} />
                                                            <Metric icon={<ArrowTrendingUpIcon className="w-4 h-4"/>} label="Conv. Rate" value={`${conversionRate.toFixed(2)}%`} />
                                                            <Metric icon={<BanknotesIcon className="w-4 h-4"/>} label="Avg. Earning/DL" value={formatCurrency(avgEarning)} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};