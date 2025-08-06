/* eslint-disable no-console */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { getWhitelistedTokens } from "config/tokens";
import { useChainId } from "lib/chains";
import { marketDataService, TokenPrice, MarketData } from "../services/marketDataService";

// Utility functions
const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatBalance = (balance: string, decimals: number = 4): string => {
  const num = parseFloat(balance);
  if (isNaN(num)) return "0";
  return num.toFixed(decimals);
};

interface TradingPair {
  id: number;
  baseToken: string;
  quoteToken: string;
  baseTokenSymbol: string;
  quoteTokenSymbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  baseTokenDecimals: number;
  quoteTokenDecimals: number;
  baseTokenLogo: string;
  quoteTokenLogo: string;
}

interface WalletInfo {
  address: string;
  formattedAddress: string;
  balance: string;
  network: string;
}

export const useDexDashboard = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { chainId } = useChainId();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Get actual tokens from config
  const tokens = getWhitelistedTokens(chainId || 42161); // Default to Arbitrum if chainId is undefined
  const usdcToken = tokens.find(token => token.symbol === "USDC") || 
                    tokens.find(token => token.symbol === "USDT") || 
                    tokens.find(token => token.isStable);
  
  // State for real market data
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [isLoadingMarketData, setIsLoadingMarketData] = useState(false);
  
  // Fetch real market data
  const fetchMarketData = useCallback(async () => {
    setIsLoadingMarketData(true);
    try {
      const [globalData, pricesData] = await Promise.all([
        marketDataService.getGlobalMarketData(),
        marketDataService.getTokenPrices(['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana'])
      ]);
      
      // Ensure valid data
      if (globalData && typeof globalData.total_volume === 'number' && !isNaN(globalData.total_volume)) {
        setMarketData(globalData);
      } else {
        console.warn('Invalid global market data received, using fallback');
        setMarketData(null);
      }
      
      if (pricesData && Array.isArray(pricesData) && pricesData.length > 0) {
        setTokenPrices(pricesData);
      } else {
        console.warn('Invalid token prices data received, using fallback');
        setTokenPrices([]);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      setMarketData(null);
      setTokenPrices([]);
    } finally {
      setIsLoadingMarketData(false);
    }
  }, []);
  
  // Fetch market data on mount
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);
  
  // Create trading pairs using real market data
  const tradingPairs = useMemo(() => {
    if (!tokens.length || !usdcToken || !tokenPrices.length) {
      return [];
    }
    
    const pairs: TradingPair[] = [];
    let id = 1;
    
    // Create pairs with the quote token using real market data
    const baseTokens = tokens.filter(token => 
      token.symbol !== usdcToken.symbol && 
      !token.isWrapped && 
      !token.isTempHidden
    ).slice(0, 4); // Limit to 4 pairs
    
    baseTokens.forEach((baseToken) => {
      // Find corresponding market data for this token
      const marketToken = tokenPrices.find(t => 
        t.symbol.toLowerCase() === baseToken.symbol.toLowerCase() ||
        t.name.toLowerCase().includes(baseToken.symbol.toLowerCase())
      );
      
      if (marketToken) {
        pairs.push({
          id: id++,
          baseToken: baseToken.name,
          quoteToken: usdcToken.name,
          baseTokenSymbol: baseToken.symbol,
          quoteTokenSymbol: usdcToken.symbol,
          price: marketToken.current_price || 0,
          priceChange24h: marketToken.price_change_percentage_24h || 0,
          volume24h: marketToken.total_volume || 0,
          liquidity: (marketToken.market_cap || 0) * 0.1, // Estimate liquidity as 10% of market cap
          baseTokenAddress: baseToken.address,
          quoteTokenAddress: usdcToken.address,
          baseTokenDecimals: baseToken.decimals,
          quoteTokenDecimals: usdcToken.decimals,
          baseTokenLogo: marketToken.image || baseToken.imageUrl || "",
          quoteTokenLogo: usdcToken.imageUrl || ""
        });
      }
    });
    
    return pairs;
  }, [tokens, usdcToken, tokenPrices]);



  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    disconnect();
    setWalletInfo(null);
    setError(null);
  }, [disconnect]);

  // Update wallet info when account changes
  const updateWalletInfo = useCallback(async () => {
    if (!isConnected || !address) {
      setWalletInfo(null);
      return;
    }

    try {
      const balanceValue = balance?.formatted || "0";
      const networkName = "Ethereum"; // Default network name
      
      setWalletInfo({
        address: address,
        formattedAddress: formatAddress(address),
        balance: formatBalance(balanceValue),
        network: networkName
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating wallet info:", error);
      setError("Failed to get wallet information");
    }
  }, [isConnected, address, balance]);

  // Filter trading pairs based on search term
  const filteredTradingPairs = tradingPairs.filter(pair =>
    pair.baseTokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pair.quoteTokenSymbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate market statistics using real data
  const calculateTotalVolume = () => {
    // Use the sum of individual trading pairs instead of global market data
    const calculatedVolume = tradingPairs.reduce((sum, pair) => sum + (pair.volume24h || 0), 0);
    return isNaN(calculatedVolume) ? 0 : calculatedVolume;
  };

  const calculateTotalLiquidity = () => {
    // Use the sum of individual trading pairs instead of global market data
    const calculatedLiquidity = tradingPairs.reduce((sum, pair) => sum + (pair.liquidity || 0), 0);
    return isNaN(calculatedLiquidity) ? 0 : calculatedLiquidity;
  };

  const marketStats = {
    totalPairs: tradingPairs.length,
    totalVolume: calculateTotalVolume(),
    totalLiquidity: calculateTotalLiquidity(),
    activeWallets: isConnected ? 1 : 0,
    marketCapChange: marketData?.market_cap_change_percentage_24h_usd || 0
  };

  // Format number utility
  const formatNumber = useCallback((num: number): string => {
    // Handle invalid numbers
    if (!num || isNaN(num) || !isFinite(num)) {
      return "0.00";
    }
    
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + "B";
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + "M";
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + "K";
    }
    return num.toFixed(2);
  }, []);

  // Format price utility
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(price);
  }, []);

  // Handle trade action
  const handleTrade = useCallback((pair: TradingPair) => {
    if (!isConnected) {
      setError("Please connect your wallet to trade");
      return;
    }
    
    // Mock trade action
    alert(`Trade ${pair.baseTokenSymbol}/${pair.quoteTokenSymbol} - This is a mock action`);
  }, [isConnected]);

  // Update wallet info when connection status changes
  useEffect(() => {
    updateWalletInfo();
  }, [updateWalletInfo]);

  return {
    walletInfo,
    searchTerm,
    error,
    tradingPairs: filteredTradingPairs,
    marketStats,
    active: isConnected,
    isLoadingMarketData,
    disconnectWallet,
    setSearchTerm,
    setError,
    handleTrade,
    formatNumber,
    formatPrice
  };
}; 