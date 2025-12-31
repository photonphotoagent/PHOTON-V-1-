import { describe, it, expect, vi } from 'vitest';
import {
  formatCurrency,
  formatDate,
  truncateText,
  generateId,
  debounce,
  throttle,
  isValidEmail,
  isStrongPassword,
} from '../../utils/helpers';

describe('helpers', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-50)).toBe('-$50.00');
    });
  });

  describe('formatDate', () => {
    it('formats date strings correctly', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('truncateText', () => {
    it('returns original text if shorter than max length', () => {
      expect(truncateText('hello', 10)).toBe('hello');
    });

    it('truncates text and adds ellipsis', () => {
      expect(truncateText('hello world', 8)).toBe('hello...');
    });

    it('handles exact length', () => {
      expect(truncateText('hello', 5)).toBe('hello');
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with expected format', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('debounce', () => {
    it('delays function execution', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('only calls once for rapid invocations', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('limits function calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      throttledFn();
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('isValidEmail', () => {
    it('validates correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('no@domain')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('accepts passwords with 6+ characters', () => {
      const result = isStrongPassword('password123');
      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });

    it('rejects short passwords', () => {
      const result = isStrongPassword('12345');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('6 characters');
    });
  });
});
