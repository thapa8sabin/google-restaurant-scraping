# Restaurant Map Discovery

A full-stack application for scraping, discovering, and viewing restaurant data on a map.

## Project Structure

- **backend/**: Express API for data and scheduling.
- **frontend/**: React + Vite application.
- **scraper-service/**: Background workers for scraping Google Maps.

## Getting Started (Docker)

The easiest way to run the entire stack is with Docker Compose.

### Prerequisites
- Docker & Docker Compose

### Run the Stack

```bash
docker-compose up --build
```

This will start:
1.  **Postgres DB**: `localhost:5432`
2.  **Redis**: `localhost:6379`
3.  **Backend**: `localhost:3000` (mapped to port 90 externally in default compose)
4.  **Frontend**: `localhost:5173`
5.  **Scraper**: Background service

## Accessing the App

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Admin**: [http://localhost:5173/login](http://localhost:5173/login) (Default credentials depend on your seed data)

## Manual Setup

See the README files in each subdirectory for individual service setup:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Scraper Service README](./scraper-service/README.md)

## Known Issues & Notes

> [!NOTE]
> The following are known bugs and areas for improvement:
> 1. **Puppeteer Stability**: Puppeteer sometimes fails to fetch detail pages successfully. This may require better error handling or retry logic.
> 2. **Search Parameters**: The Google Maps search parameter logic needs improvement to yield better results during scraping.
