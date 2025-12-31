import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../components/layout/Header';
import { AppView, User } from '../../types';

describe('Header', () => {
  const mockUser: User = {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    plan: 'Pro',
  };

  const mockSetActiveView = vi.fn();
  const mockOnLogout = vi.fn();

  const defaultProps = {
    activeView: AppView.LIGHT_BOX,
    setActiveView: mockSetActiveView,
    user: mockUser,
    onLogout: mockOnLogout,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo and app name', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Photon')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Light Box')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Earnings')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    render(<Header {...defaultProps} />);
    const lightBoxButton = screen.getByRole('button', { name: /Light Box/i });
    expect(lightBoxButton).toHaveClass('bg-gray-800');
  });

  it('displays user information', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
  });

  it('calls setActiveView when clicking navigation item', () => {
    render(<Header {...defaultProps} />);
    const portfolioButton = screen.getByRole('button', { name: /Portfolio/i });
    fireEvent.click(portfolioButton);
    expect(mockSetActiveView).toHaveBeenCalledWith(AppView.PORTFOLIO);
  });

  it('opens profile dropdown when clicking user area', () => {
    render(<Header {...defaultProps} />);
    const userButton = screen.getByRole('button', { name: '' });
    fireEvent.click(userButton);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls onLogout when clicking sign out', () => {
    render(<Header {...defaultProps} />);
    const userButton = screen.getByRole('button', { name: '' });
    fireEvent.click(userButton);

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('navigates to Light Box when clicking logo', () => {
    render(<Header {...defaultProps} activeView={AppView.SETTINGS} />);
    const logo = screen.getByText('Photon').closest('div');
    fireEvent.click(logo!);
    expect(mockSetActiveView).toHaveBeenCalledWith(AppView.LIGHT_BOX);
  });
});
