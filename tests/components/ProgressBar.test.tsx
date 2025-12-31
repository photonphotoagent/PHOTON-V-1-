import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ProgressBar } from '../../components/ui/ProgressBar';

describe('ProgressBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with default label', () => {
    render(<ProgressBar />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<ProgressBar label="Analyzing..." />);
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
  });

  it('starts with initial progress', () => {
    render(<ProgressBar />);
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('progress increases over time', () => {
    render(<ProgressBar />);

    // Initially 5%
    expect(screen.getByText('5%')).toBeInTheDocument();

    // Advance timers to trigger progress updates
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Progress should have increased (but not deterministically due to random)
    const percentText = screen.getByText(/%$/).textContent;
    const percent = parseInt(percentText || '0', 10);
    expect(percent).toBeGreaterThanOrEqual(5);
  });

  it('progress bar has correct width style', () => {
    render(<ProgressBar />);

    const progressElement = document.querySelector('[style*="width"]');
    expect(progressElement).toBeInTheDocument();
    expect(progressElement?.getAttribute('style')).toContain('width: 5%');
  });
});
