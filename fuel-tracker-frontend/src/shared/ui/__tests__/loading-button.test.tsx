import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingButton } from '../loading-button';

describe('LoadingButton', () => {
  it('should render normally when not loading', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('should show loading state when loading is true', () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show loading text when provided', () => {
    render(<LoadingButton loading loadingText="Loading...">Click me</LoadingButton>);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Click me')).not.toBeInTheDocument();
  });

  it('should show spinner when loading without loading text', () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should not be clickable when loading', async () => {
    const handleClick = vi.fn();
    render(<LoadingButton loading onClick={handleClick}>Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should be clickable when not loading', async () => {
    const handleClick = vi.fn();
    render(<LoadingButton onClick={handleClick}>Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should pass through all button props', () => {
    render(
      <LoadingButton 
        type="submit" 
        className="custom-class"
        data-testid="test-button"
        aria-label="Submit form"
      >
        Submit
      </LoadingButton>
    );
    
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });

  it('should handle different variants', () => {
    const { rerender } = render(<LoadingButton variant="destructive" loading>Delete</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<LoadingButton variant="outline" loading>Outline</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('border', 'border-input');
  });

  it('should handle different sizes', () => {
    const { rerender } = render(<LoadingButton size="sm" loading>Small</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<LoadingButton size="lg" loading>Large</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('h-11');
  });

  it('should show loading state with custom loading text', () => {
    render(
      <LoadingButton 
        loading 
        loadingText="Saving changes..." 
        variant="secondary"
      >
        Save
      </LoadingButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Saving changes...')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should transition between loading and normal states', () => {
    const { rerender } = render(<LoadingButton loading>Click me</LoadingButton>);
    
    // Loading state
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Normal state
    rerender(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByRole('button')).not.toBeDisabled();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});
