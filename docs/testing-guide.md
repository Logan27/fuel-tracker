# Testing Guide

## Обзор

Проект использует **Vitest** + **React Testing Library** для тестирования.

## Структура тестов

```
src/
├── test/
│   ├── setup.ts          # Глобальная конфигурация тестов
│   └── utils.tsx         # Вспомогательные функции для тестов
├── shared/
│   └── lib/
│       └── utils/
│           └── __tests__/  # Unit tests для utils
├── app/
│   └── stores/
│       └── __tests__/      # Unit tests для stores
└── features/
    └── auth/
        └── __tests__/      # Integration tests для features
```

## Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск тестов в watch mode
npm test -- --watch

# Запуск тестов с UI
npm run test:ui

# Запуск тестов с coverage
npm run test:coverage
```

## Написание тестов

### Unit Tests

**Для утилит (converters, formatters):**

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

**Для Zustand stores:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store перед каждым тестом
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

**Для React компонентов:**

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

    // Проверки...
  });
});
```

## Best Practices

### 1. Именование тестов

- Используй `describe` для группировки
- `it` должен описывать что тест делает: "should do something"
- Читабельные названия: `it('should show validation error for invalid email')`

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

### 3. Используй `beforeEach` для setup

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    // Сброс моков, stores, etc.
  });
});
```

### 4. Мокирование

**Мокирование модулей:**

```typescript
vi.mock('../model/useAuth', () => ({
  useAuth: vi.fn(),
}));
```

**Мокирование функций:**

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue('result');
mockFn.mockResolvedValue(Promise.resolve('async result'));
```

### 5. Async тестирование

```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText(/loaded/i)).toBeInTheDocument();
  });
});
```

## Тестирование React Query

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

Цели coverage:
- **Statements**: ≥80%
- **Branches**: ≥75%
- **Functions**: ≥80%
- **Lines**: ≥80%

Проверка coverage:

```bash
npm run test:coverage
```

Report будет в `coverage/index.html`.

## Что тестировать

### ✅ Обязательно тестировать:

1. **Utilities:**
   - Converters (unit conversions)
   - Formatters (date, number, currency)
   - Validators (если есть)

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

### ❌ Не нужно тестировать:

1. **Third-party libraries:**
   - Radix UI components
   - React Router
   - Date-fns

2. **Styling:**
   - CSS classes
   - Tailwind utilities

3. **Types:**
   - TypeScript types (compile-time check)

## Debugging тестов

### Посмотреть DOM:

```typescript
import { screen } from '@testing-library/react';

screen.debug(); // Вывести весь DOM
screen.debug(screen.getByRole('button')); // Вывести конкретный элемент
```

### Логирование:

```typescript
console.log('State:', useAuthStore.getState());
```

### Breakpoints:

В VS Code можно ставить breakpoints в тестах и запускать через Debug.

## CI/CD Integration

Добавь в `.github/workflows/test.yml`:

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

## Примеры тестов

Смотри:
- `src/shared/lib/utils/__tests__/converters.test.ts`
- `src/shared/lib/utils/__tests__/formatters.test.ts`
- `src/app/stores/__tests__/authStore.test.ts`
- `src/app/stores/__tests__/vehicleStore.test.ts`
- `src/features/auth/__tests__/SignInForm.test.tsx`

## FAQ

### Q: Как тестировать компоненты с React Query?

A: Используй `createTestQueryClient()` и оборачивай в `QueryClientProvider`. См. `src/test/utils.tsx`.

### Q: Как мокировать API calls?

A: Используй `vi.mock()` для модулей или Mock Service Worker (MSW) для HTTP requests.

### Q: Как тестировать navigation?

A: Оборачивай в `BrowserRouter` (уже есть в `src/test/utils.tsx`) и используй `useNavigate` мок.

### Q: Почему тест падает с "matchMedia is not defined"?

A: Проверь `src/test/setup.ts` - там должен быть мок для `matchMedia`.

### Q: Как тестировать error boundaries?

A: Используй `console.error = vi.fn()` чтобы подавить ошибки в консоль.

## Полезные ссылки

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

