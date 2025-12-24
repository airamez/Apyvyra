# Frontend (React + TypeScript + Vite)

The frontend is a React application built with TypeScript and Vite, using Material-UI for components.

## Prerequisites

- Node.js 18 or later
- Backend API running (for development)

## Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment configuration**
   - Create `.env` file:
     ```
     VITE_API_URL=http://localhost:5000
     ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:80` (may require sudo for port 80).

## Project Structure

- **src/components/**: React components (Products, Login, etc.)
- **src/services/**: API service functions
- **src/config/**: API configuration
- **src/utils/**: Utility functions (error handling)
- **public/**: Static assets

## Key Features

- Material-UI components throughout
- Centralized API configuration
- Standardized error handling with dialogs
- Authentication flow (login/register)
- Data grids with filtering and pagination
- Responsive design

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Building for Production

```bash
npm run build
```

The build output in `dist/` can be served by the backend or deployed separately.
