# Restaurant Map Scraper Service

A microservice dedicated to scraping Google Maps for restaurant data. It operates using a Producer-Consumer pattern with BullMQ and supports distributed scraping (Discovery vs. Visiting).

## Tech Stack

- **Runtime**: Node.js
- **Browser Automation**: Puppeteer
- **Queue**: BullMQ (Redis)
- **Database Access**: Prisma Client

## Architecture

1.  **Discovery Worker** (`scrape-queue`):
    - Receives a location (lat, lng, radius).
    - Scrapes the list of restaurants in that area.
    - Saves basic info to DB.
    - Enqueues jobs for the Visit Worker.

2.  **Visit Worker** (`visit-queue`):
    - Receives a specific restaurant URL.
    - Visits the page to extract details (Images, Address, Price, Opening Status).
    - Updates the DB record.

## Installation

1.  **Install Dependencies**:
    ```bash
    npm install --legacy-peer-deps
    ```
    *Note: `--legacy-peer-deps` may be required due to Puppeteer version conflicts in some environments.*

2.  **Environment Variables**:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_db"
    REDIS_HOST="localhost"
    REDIS_PORT="6379"
    ```

## Running Locally

To run locally, you need a Redis instance running.

```bash
npm start
```
