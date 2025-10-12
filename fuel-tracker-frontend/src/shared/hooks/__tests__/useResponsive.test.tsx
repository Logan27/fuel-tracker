import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResponsive, useBreakpoint, useBreakpointDown, useBreakpointBetween } from '../useResponsive';

// Mock window.innerWidth and window.innerHeight
const mockWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    value: height,
  });
};

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset window size to desktop
    mockWindowSize(1024, 768);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct screen size for desktop', () => {
    mockWindowSize(1024, 768);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
    expect(result.current.breakpoint).toBe('lg');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  it('should return correct screen size for tablet', () => {
    mockWindowSize(800, 600);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
    expect(result.current.breakpoint).toBe('md');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should return correct screen size for mobile', () => {
    mockWindowSize(600, 400);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.width).toBe(600);
    expect(result.current.height).toBe(400);
    expect(result.current.breakpoint).toBe('xs');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should return correct breakpoint for xs', () => {
    mockWindowSize(400, 300);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.breakpoint).toBe('xs');
    expect(result.current.isMobile).toBe(true);
  });

  it('should return correct breakpoint for xl', () => {
    mockWindowSize(1400, 900);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.breakpoint).toBe('xl');
    expect(result.current.isDesktop).toBe(true);
  });

  it('should return correct breakpoint for 2xl', () => {
    mockWindowSize(1600, 1000);
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.breakpoint).toBe('2xl');
    expect(result.current.isDesktop).toBe(true);
  });
});

describe('useBreakpoint', () => {
  it('should return true when screen is at or above breakpoint', () => {
    mockWindowSize(1024, 768);
    
    const { result } = renderHook(() => useBreakpoint('lg'));
    
    expect(result.current).toBe(true);
  });

  it('should return false when screen is below breakpoint', () => {
    mockWindowSize(600, 400);
    
    const { result } = renderHook(() => useBreakpoint('lg'));
    
    expect(result.current).toBe(false);
  });
});

describe('useBreakpointDown', () => {
  it('should return true when screen is below breakpoint', () => {
    mockWindowSize(600, 400);
    
    const { result } = renderHook(() => useBreakpointDown('md'));
    
    expect(result.current).toBe(true);
  });

  it('should return false when screen is at or above breakpoint', () => {
    mockWindowSize(1024, 768);
    
    const { result } = renderHook(() => useBreakpointDown('md'));
    
    expect(result.current).toBe(false);
  });
});

describe('useBreakpointBetween', () => {
  it('should return true when screen is between breakpoints', () => {
    mockWindowSize(800, 600);
    
    const { result } = renderHook(() => useBreakpointBetween('md', 'lg'));
    
    expect(result.current).toBe(true);
  });

  it('should return false when screen is below min breakpoint', () => {
    mockWindowSize(600, 400);
    
    const { result } = renderHook(() => useBreakpointBetween('md', 'lg'));
    
    expect(result.current).toBe(false);
  });

  it('should return false when screen is above max breakpoint', () => {
    mockWindowSize(1200, 800);
    
    const { result } = renderHook(() => useBreakpointBetween('md', 'lg'));
    
    expect(result.current).toBe(false);
  });
});
