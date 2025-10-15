# Fuel Tracker Frontend

> **🏆 Built during a 1-day DataArt hackathon** - This frontend application was developed as part of a 24-hour coding challenge, demonstrating rapid prototyping and modern React development capabilities.

React frontend for the Fuel Tracker application - an MVP for tracking vehicle fuel consumption.

## 🚀 Features

- ⛽ **Fuel Entry Management** - Create, edit, and delete fuel entries
- 🚗 **Vehicle Management** - Manage multiple vehicles
- 📊 **Dashboard Analytics** - Real-time consumption and cost metrics
- 📈 **Statistics & Charts** - Brand and grade comparison tables
- 🔒 **Authentication** - Secure login/logout with session management
- 🌍 **Unit Conversion** - Support for metric and imperial systems

## 🛠️ Technology Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **TanStack Query** - Server state management
- **React Hook Form** + **Zod** - Form handling and validation
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing

## 📦 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage

# Linting
npm run lint         # Run ESLint
```

## 🏗️ Architecture

This project follows **Feature-Sliced Design (FSD)** architecture:

```
src/
├── app/              # Application layer
│   ├── providers/    # Global providers
│   ├── router/       # Routing configuration
│   └── stores/       # Global state stores
├── pages/            # Page components
├── features/         # Feature modules
│   ├── auth/         # Authentication
│   ├── vehicles/     # Vehicle management
│   └── fuel-entries/ # Fuel entry management
├── entities/         # Business entities
├── shared/           # Shared utilities
│   ├── ui/           # UI components
│   ├── api/          # API client
│   └── lib/          # Utilities
└── widgets/          # Composite components
```

## 🔧 Development

### State Management

- **Zustand** for global state (auth, vehicles, settings)
- **TanStack Query** for server state and caching
- **React Hook Form** for form state

### API Integration

All API calls are handled through TanStack Query with automatic caching, background updates, and error handling.

### Styling

- **Tailwind CSS** for utility-first styling
- **shadcn/ui** components for consistent design
- **CSS Modules** for component-specific styles

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 License

This project was created for demonstration purposes during a DataArt hackathon.

## 👤 Author

Anton Utorov
- Email: anton.utorov@gmail.com
- GitHub: [@Logan27](https://github.com/Logan27)
