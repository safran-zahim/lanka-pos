# Lanka POS Frontend

This is the React + Vite frontend for the Lanka POS system.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

## Architecture

- **State Management**: Zustand (`src/store`)
- **Database**: Dexie.js (IndexedDB wrapper) (`src/db`)
- **Styling**: TailwindCSS
- **Icons**: Lucide React

## Project Structure

- `src/layouts`: Layout components (e.g., POSLayout)
- `src/pages`: Page components (e.g., POS)
- `src/db`: Database schema and seeding logic
- `src/store`: Global state management
