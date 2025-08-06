/* eslint-disable no-console */
// Market data service for fetching real-time cryptocurrency data
interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  image: string;
}

interface MarketData {
  total_market_cap: number;
  total_volume: number;
  market_cap_percentage: { [key: string]: number };
  market_cap_change_percentage_24h_usd: number;
}

class MarketDataService {
  private static instance: MarketDataService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  // Fetch token prices from CoinGecko API
  async getTokenPrices(tokens: string[]): Promise<TokenPrice[]> {
    const cacheKey = `token_prices_${tokens.join(',')}`;
    
    if (this.isCacheValid(cacheKey)) {
      const cached = this.getCache(cacheKey);
      // Validate cached data
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${tokens.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate the data before caching
      if (Array.isArray(data) && data.length > 0) {
        this.setCache(cacheKey, data);
        return data;
      } else {
        throw new Error('Invalid data received from API');
      }
    } catch (error) {
      console.error('Error fetching token prices:', error);
      // Return mock data as fallback
      return this.getMockTokenPrices(tokens);
    }
  }

  // Fetch global market data
  async getGlobalMarketData(): Promise<MarketData> {
    const cacheKey = 'global_market_data';
    
    if (this.isCacheValid(cacheKey)) {
      const cached = this.getCache(cacheKey);
      // Validate cached data
      if (cached && typeof cached.total_volume === 'number' && !isNaN(cached.total_volume)) {
        return cached;
      }
    }

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/global'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate the data before caching
      if (data.data && typeof data.data.total_volume === 'number' && !isNaN(data.data.total_volume)) {
        this.setCache(cacheKey, data.data);
        return data.data;
      } else {
        throw new Error('Invalid data received from API');
      }
    } catch (error) {
      console.error('Error fetching global market data:', error);
      // Return mock data as fallback
      return this.getMockGlobalMarketData();
    }
  }

  // Fetch trading pairs data (simulated for now)
  async getTradingPairsData(): Promise<any[]> {
    const cacheKey = 'trading_pairs_data';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      // For now, we'll simulate trading pairs data
      // In a real implementation, you might use DEX APIs like Uniswap, SushiSwap, etc.
      const mockData = this.getMockTradingPairsData();
      this.setCache(cacheKey, mockData);
      return mockData;
    } catch (error) {
      console.error('Error fetching trading pairs data:', error);
      return this.getMockTradingPairsData();
    }
  }

  // Mock data fallbacks
  private getMockTokenPrices(tokens: string[]): TokenPrice[] {
    return tokens.map((token, index) => {
      // Generate more realistic values based on token
      let volume, marketCap;
      
      if (token.toLowerCase() === 'bitcoin' || token.toLowerCase() === 'btc') {
        volume = Math.random() * 50000000000 + 20000000000; 
        marketCap = Math.random() * 2000000000000 + 1000000000000;
      } else if (token.toLowerCase() === 'ethereum' || token.toLowerCase() === 'eth') {
        volume = Math.random() * 40000000000 + 15000000000;
        marketCap = Math.random() * 800000000000 + 400000000000;
      } else if (token.toLowerCase() === 'binancecoin' || token.toLowerCase() === 'bnb') {
        volume = Math.random() * 2000000000 + 500000000;
        marketCap = Math.random() * 100000000000 + 50000000000;
      } else {
        volume = Math.random() * 10000000000 + 1000000000;
        marketCap = Math.random() * 500000000000 + 100000000000;
      }
      
      return {
        id: token,
        symbol: token.toUpperCase(),
        name: token.charAt(0).toUpperCase() + token.slice(1),
        current_price: Math.max(0, Math.random() * 5000 + 100),
        price_change_percentage_24h: (Math.random() - 0.5) * 10,
        total_volume: volume,
        market_cap: marketCap,
        image: `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`
      };
    });
  }

  private getMockGlobalMarketData(): MarketData {
    return {
      total_market_cap: 1234567890123,
      total_volume: 987654321098,
      market_cap_percentage: { btc: 50.1, eth: 18.2 },
      market_cap_change_percentage_24h_usd: 2.5
    };
  }

  private getMockTradingPairsData(): any[] {
    return [
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        price: 2000 + Math.random() * 500,
        price_change_24h: (Math.random() - 0.5) * 10,
        volume_24h: 1000000 + Math.random() * 2000000,
        liquidity: 5000000 + Math.random() * 10000000,
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
      },
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 40000 + Math.random() * 10000,
        price_change_24h: (Math.random() - 0.5) * 10,
        volume_24h: 2000000 + Math.random() * 3000000,
        liquidity: 8000000 + Math.random() * 15000000,
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
      },
      {
        id: 'binancecoin',
        symbol: 'BNB',
        name: 'BNB',
        price: 300 + Math.random() * 100,
        price_change_24h: (Math.random() - 0.5) * 10,
        volume_24h: 800000 + Math.random() * 1200000,
        liquidity: 3000000 + Math.random() * 8000000,
        image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
      }
    ];
  }
}

export const marketDataService = MarketDataService.getInstance();
export type { TokenPrice, MarketData }; 