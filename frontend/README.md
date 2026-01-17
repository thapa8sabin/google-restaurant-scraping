# Restaurant Map Frontend

The user interface for discovering and viewing restaurants on an interactive map.

## Tech Stack

- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Map**: Leaflet (React Leaflet)
- **State Management**: Zustand
- **Routing**: React Router DOM (v6)

## Prerequisites

- Node.js (v18+)

## Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file:
    ```env
    VITE_API_URL="http://localhost:3000"
    ```

## Scripts

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.

## Features

- Interactive Map with Restaurant Markers.
- Restaurant Detail Pages.
- Admin Dashboard for Scheduling Scrapes.
- Filter Bar (Rating, Open Now, Search).
