import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// In-memory cache
let cachedActiveCoins: Set<string> | null = null;
let cacheTimestamp: number = 0;

const CACHE_DURATION = parseInt(process.env.CMC_ACTIVE_COINS_CACHE_DURATION || '604800000'); // 7 days default
const BATCH_SIZE = 100; // Check 100 symbols per API call

interface ActiveCoinsData {
  activeSymbols: string[];
  timestamp: number;
  totalChecked: number;
  apiCallsMade: number;
}

type ResponseData =
  | { success: true; data: ActiveCoinsData; cached: boolean }
  | { success: false; error: string };

// Helper function to get all icon symbols
function getAllIconSymbols(): string[] {
  const iconsDirectory = path.join(process.cwd(), 'public', 'icons');
  const files = fs.readdirSync(iconsDirectory);
  const svgFiles = files.filter(file => file.endsWith('.svg'));

  const symbols = new Set<string>();

  svgFiles.forEach(fileName => {
    const nameWithoutExtension = fileName.replace('.svg', '');

    // Extract symbol from "Name (SYMBOL).svg" format
    const match = nameWithoutExtension.match(/\(([^)]+)\)$/);
    if (match) {
      symbols.add(match[1].trim().toUpperCase());
    } else {
      // For files without parentheses, use the filename as symbol
      symbols.add(nameWithoutExtension.toUpperCase());
    }
  });

  return Array.from(symbols);
}

// Helper function to chunk array into batches
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    const now = Date.now();

    // Check if cache is still valid
    if (cachedActiveCoins && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached active coins data');
      return res.status(200).json({
        success: true,
        data: {
          activeSymbols: Array.from(cachedActiveCoins),
          timestamp: cacheTimestamp,
          totalChecked: cachedActiveCoins.size,
          apiCallsMade: 0,
        },
        cached: true
      });
    }

    // Check API key
    const apiKey = process.env.COINMARKETCAP_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.status(200).json({
        success: false,
        error: 'API_KEY_NOT_CONFIGURED'
      });
    }

    console.log('Fetching active coins status from CoinMarketCap API...');

    // Get all symbols from our icons
    const allSymbols = getAllIconSymbols();
    console.log(`Total symbols to check: ${allSymbols.length}`);

    // Batch symbols to minimize API calls
    const symbolBatches = chunkArray(allSymbols, BATCH_SIZE);
    console.log(`Batched into ${symbolBatches.length} API calls`);

    const activeSymbols = new Set<string>();
    let apiCallsMade = 0;

    // Make batched requests
    for (const batch of symbolBatches) {
      const symbolsParam = batch.join(',');

      const response = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=${symbolsParam}&listing_status=active`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': apiKey,
            'Accept': 'application/json',
          },
        }
      );

      apiCallsMade++;

      if (!response.ok) {
        console.error(`CoinMarketCap API error for batch: ${response.status}`);
        continue; // Skip failed batches
      }

      const data = await response.json();

      // Add active symbols from this batch
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((coin: any) => {
          if (coin.symbol) {
            activeSymbols.add(coin.symbol.toUpperCase());
          }
        });
      }

      // Small delay between requests to avoid rate limiting
      if (apiCallsMade < symbolBatches.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Found ${activeSymbols.size} active coins out of ${allSymbols.length} (${apiCallsMade} API calls)`);

    // Update cache
    cachedActiveCoins = activeSymbols;
    cacheTimestamp = now;

    return res.status(200).json({
      success: true,
      data: {
        activeSymbols: Array.from(activeSymbols),
        timestamp: now,
        totalChecked: allSymbols.length,
        apiCallsMade,
      },
      cached: false
    });

  } catch (error) {
    console.error('Active coins API error:', error);

    // If we have cached data, return it even if expired
    if (cachedActiveCoins) {
      console.log('Returning stale cache due to API error');
      return res.status(200).json({
        success: true,
        data: {
          activeSymbols: Array.from(cachedActiveCoins),
          timestamp: cacheTimestamp,
          totalChecked: cachedActiveCoins.size,
          apiCallsMade: 0,
        },
        cached: true
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active coins data'
    });
  }
}
