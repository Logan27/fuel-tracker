import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { VehicleForm } from '../ui/VehicleForm';
import { setupApiMocks, vehicleApiMocks, resetAllMocks } from '@/shared/lib/__tests__/api-mocks';

// Setup API mocks
setupApiMocks();

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('VehicleForm Integration', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should submit form with valid vehicle data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    render(
      <TestWrapper>
        <VehicleForm onSuccess={onSuccess} />
      </TestWrapper>
    );

    const makeInput = screen.getByLabelText(/make/i);
    const modelInput = screen.getByLabelText(/model/i);
    const yearSelect = screen.getByLabelText(/year/i);
    const submitButton = screen.getByRole('button', { name: /add vehicle/i });

    await user.type(makeInput, 'Toyota');
    await user.type(modelInput, 'Camry');
    await user.selectOptions(yearSelect, '2020');
    await user.click(submitButton);

    await waitFor(() => {
      expect(vehicleApiMocks.createVehicle).toHaveBeenCalledWith({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
      });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should show validation errors for invalid input', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <VehicleForm />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /add vehicle/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/make is required/i)).toBeInTheDocument();
      expect(screen.getByText(/model is required/i)).toBeInTheDocument();
      expect(screen.getByText(/year is required/i)).toBeInTheDocument();
    });

    expect(vehicleApiMocks.createVehicle).not.toHaveBeenCalled();
  });

  it('should validate year range', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <VehicleForm />
      </TestWrapper>
    );

    const makeInput = screen.getByLabelText(/make/i);
    const modelInput = screen.getByLabelText(/model/i);
    const yearSelect = screen.getByLabelText(/year/i);
    const submitButton = screen.getByRole('button', { name: /add vehicle/i });

    await user.type(makeInput, 'Toyota');
    await user.type(modelInput, 'Camry');
    await user.selectOptions(yearSelect, '1800'); // Invalid year
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/year must be 1900 or later/i)).toBeInTheDocument();
    });

    expect(vehicleApiMocks.createVehicle).not.toHaveBeenCalled();
  });

  it('should show error message on failed creation', async () => {
    const user = userEvent.setup();
    vehicleApiMocks.createVehicle.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Vehicle already exists' },
      },
    });

    render(
      <TestWrapper>
        <VehicleForm />
      </TestWrapper>
    );

    const makeInput = screen.getByLabelText(/make/i);
    const modelInput = screen.getByLabelText(/model/i);
    const yearSelect = screen.getByLabelText(/year/i);
    const submitButton = screen.getByRole('button', { name: /add vehicle/i });

    await user.type(makeInput, 'Toyota');
    await user.type(modelInput, 'Camry');
    await user.selectOptions(yearSelect, '2020');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/vehicle already exists/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    vehicleApiMocks.createVehicle.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
    );

    render(
      <TestWrapper>
        <VehicleForm />
      </TestWrapper>
    );

    const makeInput = screen.getByLabelText(/make/i);
    const modelInput = screen.getByLabelText(/model/i);
    const yearSelect = screen.getByLabelText(/year/i);
    const submitButton = screen.getByRole('button', { name: /add vehicle/i });

    await user.type(makeInput, 'Toyota');
    await user.type(modelInput, 'Camry');
    await user.selectOptions(yearSelect, '2020');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/adding vehicle/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/adding vehicle/i)).not.toBeInTheDocument();
    });
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    render(
      <TestWrapper>
        <VehicleForm onSuccess={onSuccess} />
      </TestWrapper>
    );

    const makeInput = screen.getByLabelText(/make/i);
    const modelInput = screen.getByLabelText(/model/i);
    const yearSelect = screen.getByLabelText(/year/i);
    const submitButton = screen.getByRole('button', { name: /add vehicle/i });

    await user.type(makeInput, 'Toyota');
    await user.type(modelInput, 'Camry');
    await user.selectOptions(yearSelect, '2020');
    await user.click(submitButton);

    await waitFor(() => {
      expect(vehicleApiMocks.createVehicle).toHaveBeenCalled();
    });

    // Form should be cleared after successful submission
    expect(makeInput).toHaveValue('');
    expect(modelInput).toHaveValue('');
    expect(yearSelect).toHaveValue('');
  });

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup();
    vehicleApiMocks.createVehicle.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <TestWrapper>
        <VehicleForm />
      </TestWrapper>
    );

    const makeInput = screen.getByLabelText(/make/i);
    const modelInput = screen.getByLabelText(/model/i);
    const yearSelect = screen.getByLabelText(/year/i);
    const submitButton = screen.getByRole('button', { name: /add vehicle/i });

    await user.type(makeInput, 'Toyota');
    await user.type(modelInput, 'Camry');
    await user.selectOptions(yearSelect, '2020');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should validate make and model length', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <VehicleForm />
      </TestWrapper>
    );

    const makeInput = screen.getByLabelText(/make/i);
    const modelInput = screen.getByLabelText(/model/i);
    const submitButton = screen.getByRole('button', { name: /add vehicle/i });

    // Test empty strings
    await user.type(makeInput, '   '); // Only spaces
    await user.type(modelInput, '   ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/make is required/i)).toBeInTheDocument();
      expect(screen.getByText(/model is required/i)).toBeInTheDocument();
    });

    expect(vehicleApiMocks.createVehicle).not.toHaveBeenCalled();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <VehicleForm />
      </TestWrapper>
    );

    const makeInput = screen.getByLabelText(/make/i);
    const modelInput = screen.getByLabelText(/model/i);
    const yearSelect = screen.getByLabelText(/year/i);
    const submitButton = screen.getByRole('button', { name: /add vehicle/i });

    // Tab navigation
    await user.tab();
    expect(makeInput).toHaveFocus();

    await user.tab();
    expect(modelInput).toHaveFocus();

    await user.tab();
    expect(yearSelect).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();

    // Enter key submission
    await user.type(makeInput, 'Toyota');
    await user.type(modelInput, 'Camry');
    await user.selectOptions(yearSelect, '2020');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(vehicleApiMocks.createVehicle).toHaveBeenCalled();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    
    render(
      <TestWrapper>
        <VehicleForm onCancel={onCancel} />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});
