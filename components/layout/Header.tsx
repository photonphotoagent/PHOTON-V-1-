import React, { useState } from 'react';
import { AppView, User } from '../../types';
import {
  LightBoxIcon,
  DollarSignIcon,
  EditIcon,
  StudioIcon,
  SettingsIcon,
  RectangleStackIcon,
  MapIcon,
  BoltIcon,
  UserIcon,
  ArrowRightIcon,
} from '../icons';

interface HeaderProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  user: User | null;
  onLogout: () => void;
}

const navItems = [
  { view: AppView.LIGHT_BOX, icon: LightBoxIcon, label: 'Light Box' },
  { view: AppView.PORTFOLIO, icon: RectangleStackIcon, label: 'Portfolio' },
  { view: AppView.EARNINGS, icon: DollarSignIcon, label: 'Earnings' },
  { view: AppView.EDIT, icon: EditIcon, label: 'Editor' },
  { view: AppView.STUDIO, icon: StudioIcon, label: 'Studio' },
  { view: AppView.ROUTES, icon: MapIcon, label: 'Routes' },
  { view: AppView.SETTINGS, icon: SettingsIcon, label: 'Settings' },
];

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  user,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 shadow-2xl flex justify-between items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setActiveView(AppView.LIGHT_BOX)}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BoltIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="hidden md:block text-xl font-display font-bold text-white tracking-tight">
              Photon<span className="text-indigo-400">Agent</span>
            </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
            {navItems.map((item) => {
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
            {navItems.slice(0, 4).map((item) => (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={`p-2 rounded-lg transition-colors ${
                  activeView === item.view ? 'text-indigo-400 bg-white/5' : 'text-gray-400'
                }`}
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
                <p className="text-sm font-display font-bold text-white leading-none">
                  {user?.name}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mt-1">
                  {user?.plan} Plan
                </p>
              </div>
              <img
                src={user?.avatar || 'https://via.placeholder.com/150'}
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
