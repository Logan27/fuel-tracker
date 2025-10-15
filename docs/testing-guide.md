# Testing Guide

## Overview

The project uses **Vitest** + **React Testing Library** for testing.

## Test Structure

```
src/
├── test/
│   ├── setup.ts          # Global test configuration
│   └── utils.tsx         # Helper functions for tests
├── shared/
│   └── lib/
│       └── utils/
│           └── __tests__/  # Unit tests for utils
├── app/
│   └── stores/
│       └── __tests__/      # Unit tests for stores
└── features/
    └── auth/
        └── __tests__/      # Integration tests for features
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Unit Tests

**For utilities (converters, formatters):**

```typescript
import { describe, it, expect } from 'vitest';
import { kmToMiles } from '../converters';

describe('converters', () => {
  describe('kmToMiles', () => {
    it('should convert kilometers to miles correctly', () => {
      expect(kmToMiles(100)).toBeCloseTo(62.1371, 4);
    });
  });
});
```

**For Zustand stores:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });
  });

  it('should login user', () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    useAuthStore.getState().login(mockUser);
    
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
```

### Integration Tests

**For React components:**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { SignInForm } from '../SignInForm';

describe('SignInForm', () => {
  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Assertions...
  });
});
```

## Best Practices

### 1. Naming Tests

- Use `describe` for grouping
- `it` should describe what the test does: "should do something"
- Readable names: `it('should show validation error for invalid email')`

### 2. Arrange-Act-Assert (AAA)

```typescript
it('should update state', () => {
  // Arrange
  const initialValue = 0;
  
  // Act
  const result = increment(initialValue);
  
  // Assert
  expect(result).toBe(1);
});
```

### 3. Use `beforeEach` for setup

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    // Reset mocks, stores, etc.
  });
});
```

### 4. Mocking

**Mocking modules:**

```typescript
vi.mock('../model/useAuth', () => ({
  useAuth: vi.fn(),
}));
```

**Mocking functions:**

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue('result');
mockFn.mockResolvedValue(Promise.resolve('async result'));
```

### 5. Async testing

```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText(/loaded/i)).toBeInTheDocument();
  });
});
```

## Testing React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

it('should fetch data', async () => {
  const queryClient = createTestQueryClient();
  
  render(
    <QueryClientProvider client={queryClient}>
      <MyComponent />
    </QueryClientProvider>
  );
  
  await waitFor(() => {
    expect(screen.getByText(/data/i)).toBeInTheDocument();
  });
});
```

## Coverage

Coverage targets:
- **Statements**: ≥80%
- **Branches**: ≥75%
- **Functions**: ≥80%
- **Lines**: ≥80%

Checking coverage:

```bash
npm run test:coverage
```

The report will be in `coverage/index.html`.

## What to test

### ✅ Mandatory to test:

1. **Utilities:**
   - Converters (unit conversions)
   - Formatters (date, number, currency)
   - Validators (if any)

2. **State Management:**
   - Zustand stores
   - State transitions
   - Computed values

3. **Business Logic:**
   - Calculations (consumption, cost)
   - Validations (odometer monotonicity)
   - Data transformations

4. **Critical UI:**
   - Forms (validation, submission)
   - Authentication flow
   - Error states

### ❌ Not necessary to test:

1. **Third-party libraries:**
   - Radix UI components
   - React Router
   - Date-fns

2. **Styling:**
   - CSS classes
   - Tailwind utilities

3. **Types:**
   - TypeScript types (compile-time check)

## Debugging tests

### View the DOM:

```typescript
import { screen } from '@testing-library/react';

screen.debug(); // Output the entire DOM
screen.debug(screen.getByRole('button')); // Output a specific element
```

### Logging:

```typescript
console.log('State:', useAuthStore.getState());
```

### Breakpoints:

You can set breakpoints in tests in VS Code and run them via Debug.

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Test Examples

See:
- `src/shared/lib/utils/__tests__/converters.test.ts`
- `src/shared/lib/utils/__tests__/formatters.test.ts`
- `src/app/stores/__tests__/authStore.test.ts`
- `src/app/stores/__tests__/vehicleStore.test.ts`
- `src/features/auth/__tests__/SignInForm.test.tsx`

## FAQ

### Q: How to test components with React Query?

A: Use `createTestQueryClient()` and wrap in `QueryClientProvider`. See `src/test/utils.tsx`.

### Q: How to mock API calls?

A: Use `vi.mock()` for modules or Mock Service Worker (MSW) for HTTP requests.

### Q: How to test navigation?

A: Wrap in `BrowserRouter` (already in `src/test/utils.tsx`) and use a `useNavigate` mock.

### Q: Why does the test fail with "matchMedia is not defined"?

A: Check `src/test/setup.ts` - there should be a mock for `matchMedia`.

### Q: How to test error boundaries?

A: Use `console.error = vi.fn()` to suppress errors in the console.

## Useful Links

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)