const { Worker, Queue } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const { scrapeRestaurantList, scrapeRestaurantDetails } = require('./scraper');
require('dotenv').config();

const prisma = new PrismaClient();

const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
};

// Queue for scheduling visit jobs
const visitQueue = new Queue('visit-queue', { connection: redisConnection });

console.log("Starting Scraper Workers...", redisConnection);

/**
 * WORKER 1: Discovery
 * Scrapes the list of restaurants in an area
 */
const discoveryWorker = new Worker('scrape-queue', async job => {
    console.log(`[Discovery] Job ${job.id}: Starting area scrape`);
    const { lat, lng, radius } = job.data;

    try {
        const restaurants = await scrapeRestaurantList(lat, lng, radius);
        console.log(`[Discovery] Found ${restaurants.length} items. Upserting & queuing visits...`);

        // Batch upsert or loop
        for (const r of restaurants) {

            // Queue for detailed visit
            await visitQueue.add('visit-restaurant', {
                placeId: r.placeId,
                url: r.href,
                name: r.name
            }, {
                attempts: 1,
                backoff: { type: 'exponential', delay: 1000 }
            });
        }

        return { count: restaurants.length };

    } catch (error) {
        console.error(`[Discovery] Job ${job.id} failed:`, error);
        throw error;
    }

}, { connection: redisConnection, concurrency: 1 }); // limit discovery concurrency


/**
 * WORKER 2: Visitor
 * Visits individual restaurant pages
 */
const visitWorker = new Worker('visit-queue', async job => {
    console.log(`[Visit] Job ${job.id}: Visiting ${job.data.name}`);
    const { placeId, url } = job.data;

    try {
        const coordsMatch = url.match(/!3d([-\d.]+)!4d([-\d.]+)/);
        const lat = coordsMatch ? parseFloat(coordsMatch[1]) : 0;
        const lng = coordsMatch ? parseFloat(coordsMatch[2]) : 0;

        const details = await scrapeRestaurantDetails(url);
        await prisma.restaurant.upsert({
            where: { placeId },
            update: {
                name: job.data.name,
                rating: details.rating,
                priceLevel: details.priceLevel,
                isOpen: details.isOpen,
                images: details.images,
                updatedAt: new Date(),
            },
            create: {
                placeId,
                name: job.data.name,
                lat,
                lng,
                rating: details.rating,
                priceLevel: details.priceLevel,
                address: details.address,
                isOpen: details.isOpen,
                images: details.images
            }
        });

        // console.log(`[Visit] Updated ${job.data.name}`);
        return { success: true };

    } catch (error) {
        console.error(`[Visit] Failed ${job.data.name}: ${error.message}`);
        throw error;
    }

}, { connection: redisConnection, concurrency: 5 }); // Higher concurrency for visits

/* Listeners */
discoveryWorker.on('completed', job => console.log(`[Discovery] Job ${job.id} done.`));
discoveryWorker.on('failed', (job, err) => console.log(`[Discovery] Job ${job.id} failed: ${err.message}`));

visitWorker.on('completed', job => console.log(`[Visit] Job ${job.id} done.`));
visitWorker.on('failed', (job, err) => console.log(`[Visit] Job ${job.id} failed: ${err.message}`));
