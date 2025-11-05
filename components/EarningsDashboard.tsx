import React from 'react';
import { mockEarningsData } from '../services/mockData';
import { DollarSignIcon, ShoppingCartIcon } from './icons';

// A simple SVG line chart component
const EarningsChart: React.FC<{ data: { date: string, amount: number }[] }> = ({ data }) => {
    const width = 500;
    const height = 200;
    const padding = 20;

    const maxAmount = Math.max(...data.map(d => d.amount));
    const minAmount = 0;

    const getX = (index: number) => (width - 2 * padding) / (data.length - 1) * index + padding;
    const getY = (amount: number) => height - padding - (height - 2 * padding) * (amount - minAmount) / (maxAmount - minAmount);

    const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.amount)}`).join(' ');

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'rgba(79, 70, 229, 0.4)' }} />
                        <stop offset="100%" style={{ stopColor: 'rgba(79, 70, 229, 0)' }} />
                    </linearGradient>
                </defs>
                <path d={pathData} stroke="#4F46E5" strokeWidth="2" fill="none" />
                <path d={`${pathData} L ${getX(data.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`} fill="url(#gradient)" />
            </svg>
        </div>
    );
};


export const EarningsDashboard: React.FC = () => {
    const data = mockEarningsData;
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between md:items-center space-y-2 md:space-y-0">
                <h1 className="text-3xl font-bold text-white">Earnings Dashboard</h1>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">Date Range:</span>
                    <select className="bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>All Time</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium">Total Earnings</h3>
                    <p className="text-3xl font-bold text-white mt-1">{formatCurrency(data.totalEarnings)}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium">Photos Sold</h3>
                    <p className="text-3xl font-bold text-white mt-1">{data.photosSold}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium">Top Platform</h3>
                    <p className="text-3xl font-bold text-white mt-1">{data.topPlatform}</p>
                </div>
            </div>

            {/* Earnings Chart */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                 <h3 className="text-xl font-semibold text-indigo-400 mb-4">Earnings Over Time</h3>
                <EarningsChart data={data.earningsOverTime} />
            </div>
            
            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Performing Photos */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                    <h3 className="text-xl font-semibold text-indigo-400">Top Performing Photos</h3>
                    <ul className="space-y-3">
                        {data.topPerformingPhotos.map(photo => (
                            <li key={photo.id} className="flex items-center space-x-4">
                                <img src={photo.thumbnailUrl} alt={photo.title} className="w-16 h-16 rounded-md object-cover"/>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-200">{photo.title}</p>
                                    <p className="text-sm text-gray-400">Total Earnings</p>
                                </div>
                                <p className="font-bold text-lg text-green-400">{formatCurrency(photo.earnings)}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                 {/* Recent Sales */}
                 <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-semibold text-indigo-400 mb-4">Recent Sales</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Photo</th>
                                    <th scope="col" className="px-4 py-3">Platform</th>
                                    <th scope="col" className="px-4 py-3">Date</th>
                                    <th scope="col" className="px-4 py-3 text-right">Earnings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentSales.map(sale => (
                                    <tr key={sale.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-4 py-3 font-medium text-gray-200 flex items-center space-x-3">
                                            <img src={sale.photo.thumbnailUrl} alt={sale.photo.title} className="w-8 h-8 rounded-md object-cover"/>
                                            <span>{sale.photo.title}</span>
                                        </td>
                                        <td className="px-4 py-3">{sale.platform}</td>
                                        <td className="px-4 py-3">{sale.date}</td>
                                        <td className="px-4 py-3 font-bold text-green-400 text-right">{formatCurrency(sale.earnings)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
