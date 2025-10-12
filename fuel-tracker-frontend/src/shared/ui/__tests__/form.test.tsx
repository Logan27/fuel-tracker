import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../form';
import { Button } from '../button';
import { Input } from '../input';

const testSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type TestFormData = z.infer<typeof testSchema>;

const TestForm = () => {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = vi.fn((data: TestFormData) => {
    console.log(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormDescription>
                Enter your email address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormDescription>
                Password must be at least 8 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

describe('Form', () => {
  it('should render form fields', () => {
    render(<TestForm />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('should show form descriptions', () => {
    render(<TestForm />);
    
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('should validate form on submit', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    // Should show validation errors
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    const TestFormWithCallback = () => {
      const form = useForm<TestFormData>({
        resolver: zodResolver(testSchema),
        defaultValues: {
          email: '',
          password: '',
        },
      });

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      );
    };
    
    render(<TestFormWithCallback />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should show field-specific validation errors', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.blur(emailInput);
    
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    
    // Enter short password
    await user.type(passwordInput, '123');
    await user.blur(passwordInput);
    
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('should clear validation errors when field becomes valid', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    
    const emailInput = screen.getByLabelText('Email');
    
    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.blur(emailInput);
    
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    
    // Fix email
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');
    await user.blur(emailInput);
    
    expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
  });

  it('should handle form submission with loading state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const TestFormWithLoading = () => {
      const form = useForm<TestFormData>({
        resolver: zodResolver(testSchema),
        defaultValues: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      );
    };
    
    render(<TestFormWithLoading />);
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalled();
  });
});
