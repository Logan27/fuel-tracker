import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
});

describe('useIsMobile', () => {
  let mockMediaQueryList: {
    matches: boolean;
    media: string;
    onchange: null;
    addListener: vi.Mock;
    removeListener: vi.Mock;
    addEventListener: vi.Mock;
    removeEventListener: vi.Mock;
    dispatchEvent: vi.Mock;
  };

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQueryList);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return false for desktop width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return true for mobile width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 600,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return true for tablet width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 767,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return false for desktop width at breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should add event listener on mount', () => {
    renderHook(() => useIsMobile());
    
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());
    
    unmount();
    
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should update when media query changes', () => {
    const { result, rerender } = renderHook(() => useIsMobile());
    
    // Initially desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });
    expect(result.current).toBe(false);
    
    // Simulate media query change to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 600,
    });
    
    // Get the change handler that was added
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
    changeHandler();
    
    rerender();
    expect(result.current).toBe(true);
  });

  it('should return correct value based on window width', () => {
    // Set desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });
    
    const { result } = renderHook(() => useIsMobile());
    
    // Should return false for desktop width
    expect(result.current).toBe(false);
  });
});
