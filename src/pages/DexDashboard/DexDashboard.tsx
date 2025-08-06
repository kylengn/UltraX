import React from "react";
import { Trans } from "@lingui/macro";
import Button from "components/Button/Button";
import Footer from "components/Footer/Footer";
import SEO from "components/Common/SEO";
import { getPageTitle } from "lib/legacy";
import { useDexDashboard } from "lib/hooks/useDexDashboard";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "./DexDashboard.scss";

const DexDashboard: React.FC = () => {
  const {
    walletInfo,
    searchTerm,
    error,
    tradingPairs,
    marketStats,
    active,
    isLoadingMarketData,
    disconnectWallet,
    setSearchTerm,
    handleTrade,
    formatNumber,
    formatPrice
  } = useDexDashboard();

  return (
    <SEO title={getPageTitle("DEX Dashboard")}>
      <div className="default-container DexDashboard page-layout">
        <div className="section-title-block">
          <div className="section-title-icon"></div>
          <div className="section-title-content">
            <div className="Page-title">
              <Trans>DEX Dashboard</Trans>
            </div>
            <div className="Page-description">
              <Trans>Trade tokens with minimal slippage and maximum efficiency</Trans>
            </div>
          </div>
        </div>

        <div className="DexDashboard-content">
          {/* Wallet Connection Section */}
          <div className="App-card wallet-section">
            <div className="App-card-title">
              <div className="dashboard-card-title-left">
                <div className="dashboard-card-title-mark-left"></div>
                <span>Wallet Connection</span>
              </div>
              {active && <div className="wallet-actions">
                <Button
                  variant="secondary"
                  onClick={disconnectWallet}
                >
                  Disconnect
                </Button>
              </div>
              }
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              {!active ? (
                <div className="wallet-connect-container">
                  <div className="wallet-info">
                    <p>Connect your wallet to start trading</p>
                    {error && <p className="error-message">{error}</p>}
                    <ConnectButton />
                  </div>
                </div>
              ) : (
                <div className="wallet-info-container">
                  <div className="wallet-details">
                    <div className="wallet-info-item">
                      <span className="label">Connected Address:</span>
                      <span className="value">{walletInfo?.formattedAddress || "Unknown"}</span>
                    </div>
                    <div className="wallet-info-item">
                      <span className="label">Balance:</span>
                      <span className="value">{walletInfo?.balance || "0"} ETH</span>
                    </div>
                    <div className="wallet-info-item">
                      <span className="label">Network:</span>
                      <span className="value">{walletInfo?.network || "Unknown"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trading Pairs Section */}
          <div className="App-card">
            <div className="App-card-title">
              <div className="dashboard-card-title-left">
                <div className="dashboard-card-title-mark-left"></div>
                <span>Trading Pairs</span>
              </div>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              {isLoadingMarketData ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading real-time market data...</p>
                </div>
              ) : (
                <div className="trading-pairs-table">
                  <div className="table-header">
                    <div className="header-cell">Token Pair</div>
                    <div className="header-cell">Price</div>
                    <div className="header-cell">24h Change</div>
                    <div className="header-cell">24h Volume</div>
                    <div className="header-cell">Liquidity</div>
                    <div className="header-cell">Action</div>
                  </div>
                  <div className="table-body">
                    {tradingPairs.map((pair) => (
                      <div key={pair.id} className="table-row">
                        <div className="cell token-pair">
                          <div className="token-icons">
                            <img
                              src={pair.baseTokenLogo}
                              alt={pair.baseTokenSymbol}
                              className="token-icon"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <img
                              src={pair.quoteTokenLogo}
                              alt={pair.quoteTokenSymbol}
                              className="token-icon"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="token-names">
                            <span className="base-token">{pair.baseTokenSymbol}</span>
                            <span className="separator">/</span>
                            <span className="quote-token">{pair.quoteTokenSymbol}</span>
                          </div>
                        </div>
                        <div className="cell price">
                          {formatPrice(pair.price)}
                        </div>
                        <div className={`cell change ${pair.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                          {pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h.toFixed(2)}%
                        </div>
                        <div className="cell volume">
                          ${formatNumber(pair.volume24h)}
                        </div>
                        <div className="cell liquidity">
                          ${formatNumber(pair.liquidity)}
                        </div>
                        <div className="cell action">
                          <Button
                            variant="primary-action"
                            onClick={() => handleTrade(pair)}
                          >
                            Trade
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trading Summary Section - Only show when connected */}
            {active && (
              <div className="App-card">
                <div className="App-card-title">
                  <div className="dashboard-card-title-left">
                    <div className="dashboard-card-title-mark-left"></div>
                    <span>Trading Summary</span>
                  </div>
                </div>
                <div className="App-card-divider"></div>
                <div className="App-card-content">
                  <div className="trading-summary">
                    <div className="summary-item">
                      <div className="summary-label">Available for Trading</div>
                      <div className="summary-value">{walletInfo?.balance || "0"} ETH</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Network</div>
                      <div className="summary-value">{walletInfo?.network || "Unknown"}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Trading Pairs Available</div>
                      <div className="summary-value">{marketStats.totalPairs}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Total Market Volume</div>
                      <div className="summary-value">${formatNumber(marketStats.totalVolume)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Market Stats Section */}
            <div className="App-card">
              <div className="App-card-title">
                <div className="dashboard-card-title-left">
                  <div className="dashboard-card-title-mark-left"></div>
                  <span>Market Statistics</span>
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Total Trading Pairs</div>
                    <div className="stat-value">{marketStats.totalPairs}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Total Volume (24h)</div>
                    <div className="stat-value">
                      ${formatNumber(marketStats.totalVolume)}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Total Liquidity</div>
                    <div className="stat-value">
                      ${formatNumber(marketStats.totalLiquidity)}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Active Wallets</div>
                    <div className="stat-value">{marketStats.activeWallets}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </SEO>
  );
};

export default DexDashboard; 