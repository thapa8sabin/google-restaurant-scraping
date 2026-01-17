const puppeteer = require('puppeteer');

const commonArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--lang=en-US',
    '--disable-dev-shm-usage'
];

async function scrapeRestaurantList(lat, lng, radius) {
    console.log(`Starting discovery for ${lat}, ${lng} within ${radius}m`);

    let browser;
    try {
        browser = await puppeteer.launch({ headless: "new", args: commonArgs });
        const page = await browser.newPage();

        const query = `restaurants near ${lat}, ${lng} within ${radius}m with price included`;
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/?hl=en`;

        console.log(`Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Initial scroll
        await new Promise(r => setTimeout(r, 2000));
        await page.evaluate(async () => {
            const wrapper = document.querySelector('div[role="feed"]');
            if (wrapper) {
                wrapper.scrollTop = wrapper.scrollHeight;
            }
        });
        await new Promise(r => setTimeout(r, 2000));

        // Extract list 
        const mainList = await page.evaluate(() => {
            const items = [];
            const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));

            links.forEach(link => {
                const parent = link.closest('div[role="article"]') || link.parentElement;
                if (!parent) return;

                const text = parent.innerText;
                const name = link.getAttribute('aria-label') || text.split('\n')[0];
                const href = link.href;
                const placeId = href.split('/')[5] || name;

                items.push({ name, href, placeId });
            });
            return items;
        });

        // Deduplicate
        const uniqueItems = [];
        const seen = new Set();
        for (const item of mainList) {
            if (!seen.has(item.placeId)) {
                seen.add(item.placeId);
                uniqueItems.push(item);
            }
        }

        console.log(`Found ${uniqueItems.length} restaurants.`);
        return uniqueItems;

    } catch (error) {
        console.error("Discovery failed", error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

async function scrapeRestaurantDetails(url) {
    console.log(`Visiting details: ${url}`);
    let browser;
    try {
        browser = await puppeteer.launch({ headless: "new", args: commonArgs });
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        const details = await page.evaluate(() => {

            const parent = document.querySelector('div[role="main"]');
            if (!parent) return;

            // Rating: Target the button with overall stars aria-label
            const ratingButton = parent.querySelector('span[role="img"]');
            let rating = null;
            if (ratingButton !== undefined) {
                const ariaLabel = ratingButton.getAttribute('aria-label');
                const match = ariaLabel ? ariaLabel.match(/(\d+(?:\.\d+)?)/) : null;
                rating = match ? parseFloat(match[1]) : null;
            }

            // Price: Target the price button or fallback to $ symbols in spans
            let priceLevel = null;
            const priceButton = parent.querySelector('div[role=button][aria-controls="c2"]');
            if (priceButton) {
                const ariaLabel = priceButton.innerText;
                priceLevel = ariaLabel ? ariaLabel.split("\n")[0]?.trim() : null;
                // If aria-label lacks details, grab inner text
                if (!priceLevel) {
                    const innerSpans = priceButton.querySelectorAll('span');
                    for (const span of innerSpans) {
                        const text = span.innerText.trim();
                        if (text.includes('·') || text.match(/^\$+|^€+|^£+/)) {
                            priceLevel = text.replace("·", "").trim();
                            break;
                        }
                    }
                }
            } else {
                // Fallback: Look for $ symbols directly
                const priceSpans = Array.from(parent.querySelectorAll('span')).filter(s =>
                    s.textContent.match(/^\$+|^€+|^£+/) || s.textContent.includes('Price level:')
                );
                if (priceSpans.length > 0) {
                    priceLevel = priceSpans[0].textContent.replace("·", "").trim();
                }
            }

            const images = Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => src.startsWith('https://lh3.googleusercontent.com'));

            const addressButton = document.querySelector('button[data-item-id="address"]');
            const address = addressButton ? addressButton.getAttribute('aria-label').replace('Address: ', '') : null;

            const oHButton = document.querySelector('button[data-item-id="oh"]');
            const isOpen = oHButton ?
                oHButton.getAttribute('aria-label').toLowerCase().includes('open')
                : parent.querySelector('[aria-label="Hours"]')?.parentElement?.innerText.toLowerCase().includes('open')
                ?? false;

            return {
                images,
                rating,
                address,
                priceLevel,
                isOpen
            };
        });
        return details;

    } catch (error) {
        console.error(`Detail visit failed for ${url}`, error.message);
        // Return null or partial error object?
        // Returning null allows worker to handle failure count
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeRestaurantList, scrapeRestaurantDetails };
