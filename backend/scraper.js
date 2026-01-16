const puppeteer = require('puppeteer');

async function scrapeGoogleMaps(lat, lng, radius) {
    console.log(`Starting scrape for ${lat}, ${lng} within ${radius}m`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=en-US']
        });
        const page = await browser.newPage();

        // Search query
        const query = `restaurants near ${lat}, ${lng} within ${radius}m with price included`;
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/?hl=en`;


        console.log(`Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Try to handle cookie consent if it appears (common in EU, but maybe not in container)
        try {
            const consentButton = await page.$('button[aria-label="Accept all"]');
            if (consentButton) await consentButton.click();
        } catch (e) { /* ignore */ }

        // Scroll to load more results.
        // The selector for the scrollable list is tricky and changes.
        // We'll try to find a listbox or generic scroll.
        // Basic approach: just wait a bit and extract what's visible for demo.
        await new Promise(r => setTimeout(r, 2000));

        // Extract data
        const restaurants = await page.evaluate(() => {
            const items = [];
            // Selectors are fragile. Using aria-labels is sometimes better.
            // This is a BEST GUESS implementation for Google Maps structure.
            // Note: Google Maps structure is very complex. 
            // We often look for 'div[role="article"]' or similar.
            const elements = document.querySelectorAll('div[role="feed"] > div > div[jsaction]'); // Very generic

            // Fallback: look for generic links that contain "Review" or rating stars
            const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));

            links.forEach(link => {
                const parent = link.closest('div[role="article"]') || link.parentElement;
                if (!parent) return;

                const text = parent.innerText;
                const name = link.getAttribute('aria-label') || text.split('\n')[0];
                const href = link.href;

                // ID extraction
                // href: https://www.google.com/maps/place/Name/@lat,lng,z/data=!4m...
                // We can use the href as a unique ID equivalent or hash it.
                const placeId = href.split('/')[5] || name;


                // Rating
                const ratingMatch = text.match(/([0-9]\.[0-9])\s*/); // 4.5
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

                // Open status
                const isOpen = text.toLowerCase().includes('open') && !text.toLowerCase().includes('closed');

                // Image (if present)
                const img = parent.querySelector('img');
                const image = img ? img.src : null;

                // coordinates for location
                const coordsMatch = href.match(/!3d([-\d.]+)!4d([-\d.]+)/);
                const lat = coordsMatch ? parseFloat(coordsMatch[1]) : 0;
                const lng = coordsMatch ? parseFloat(coordsMatch[2]) : 0;

                // must contain atleast one image
                if (image) {
                    items.push({
                        name,
                        lat,
                        lng,
                        rating,
                        placeId,
                        isOpen,
                        images: [image],
                        address: "Address not extracted",
                    });
                }

            });
            return items;
        });

        // Post-process: Deduplicate
        const uniqueHelper = new Set();
        const uniqueRestaurants = [];

        for (const r of restaurants) {
            if (!uniqueHelper.has(r.placeId) && r.name) {
                uniqueHelper.add(r.placeId);
                uniqueRestaurants.push(r);
            }
        }
        console.log(`Found ${uniqueRestaurants.length} restaurants`);
        return uniqueRestaurants;

    } catch (error) {
        console.error("Scrape failed", error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeGoogleMaps };
