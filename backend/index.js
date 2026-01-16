const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { scrapeGoogleMaps } = require('./scraper');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// Middleware to verify Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Map Backend is running!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth Route
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(400).json({ error: 'User not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid password' });

  const token = jwt.sign({ username: user.username }, JWT_SECRET);
  res.json({ token });
});

// Restaurants Route with Filters
app.get('/restaurants', async (req, res) => {
  const { search, minRating, price, openNow } = req.query;
  const where = {};

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (minRating) {
    where.rating = { gte: parseFloat(minRating) };
  }

  if (openNow === 'true') {
    where.isOpen = true;
  }

  try {
    const restaurants = await prisma.restaurant.findMany({ where });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Restaurant
app.get('/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) }
    });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Scrape Route (Admin only)
app.post('/admin/scrape', authenticateToken, async (req, res) => {
  const { lat, lng, radius } = req.body;
  if (!lat || !lng || !radius) return res.status(400).json({ error: 'Missing parameters' });

  // Trigger scrape
  // In a real app, this should be a background job.
  // We'll await it for simplicity or fire and forget.
  try {
    // Save area
    const area = await prisma.scrapeArea.create({
      data: { lat, lng, radius }
    });

    // Call scraper (async in background usually, but here await to see result or minimal await)
    // For demo, we might want to wait a bit or just return "Started".
    // Let's fire and forget for the response, but log it.
    scrapeGoogleMaps(lat, lng, radius).then(async (restaurants) => {
      console.log(`Scrape finished. Found ${restaurants.length} restaurants.`);

      for (const r of restaurants) {
        try {
          await prisma.restaurant.upsert({
            where: { placeId: r.placeId },
            update: {
              name: r.name,
              rating: r.rating,
              isOpen: r.isOpen,
              images: r.images,
              updatedAt: new Date(),
            },
            create: {
              placeId: r.placeId,
              name: r.name,
              lat: r.lat,
              lng: r.lng,
              rating: r.rating,
              isOpen: r.isOpen,
              images: r.images,
            }
          });
        } catch (e) {
          console.error(`Failed to save restaurant ${r.name}`, e);
        }
      }
      console.log("Database update complete.");
    }).catch(console.error);

    res.json({ message: 'Scrape started', areaId: area.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/admin/areas', authenticateToken, async (req, res) => {
  const areas = await prisma.scrapeArea.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(areas);
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
