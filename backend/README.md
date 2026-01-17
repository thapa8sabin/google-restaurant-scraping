# Restaurant Map Backend

This is the backend API for the Restaurant Map Discovery application. It handles user authentication, restaurant data management, and job scheduling for the scraper.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Queue**: BullMQ (Redis)
- **Authentication**: JWT & Bcrypt

## Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis

## Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file based on the example:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_db"
    JWT_SECRET="your_secret_key"
    REDIS_HOST="localhost"
    REDIS_PORT="6379"
    PORT=3000
    ```

3.  **Database Setup**:
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```

## Scripts

- `npm start`: Run in production mode.
- `npm run dev`: Run in development mode with Nodemon.

## API Endpoints

- `GET /restaurants`: List restaurants (filters: search, minRating, openNow).
- `GET /restaurants/:id`: Get restaurant details.
- `POST /auth/login`: User login.
- `POST /admin/scrape`: Schedule a scraping job (requires auth).
