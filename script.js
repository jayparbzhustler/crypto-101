// Global variables to store data
let portfolioData = {
    totalBalance: 25430.75,
    holdings: [],
    marketData: [],
    portfolioHistory: [
        { date: "2025-07-18", value: 24850.20 },
        { date: "2025-07-19", value: 25100.75 },
        { date: "2025-07-20", value: 24950.30 },
        { date: "2025-07-21", value: 25200.80 },
        { date: "2025-07-22", value: 25350.45 },
        { date: "2025-07-23", value: 25120.60 },
        { date: "2025-07-24", value: 25430.75 }
    ]
};

// Portfolio holdings configuration
const portfolioHoldings = [
    { asset: "Bitcoin", symbol: "BTC", holdings: 0.5 },
    { asset: "Ethereum", symbol: "ETH", holdings: 5 },
    { asset: "Cardano", symbol: "ADA", holdings: 1000 }
];

// Top cryptocurrencies to display in market overview
const topCryptos = ["BTC", "ETH", "ADA", "SOL", "XRP", "DOT", "DOGE", "SHIB", "LUNA", "AVAX"];

// CoinGecko API configuration (free, no API key required)
const COINGECKO_API = "/.netlify/functions/proxy";

// Function to initialize the dashboard
async function initDashboard() {
    try {
        // Show loading state
        showLoadingState();
        
        // Fetch initial data
        await fetchAllData();
        
        // Populate UI with initial data
        populateHoldingsTable();
        createPortfolioChart();
        createAllocationChart();
        populateMarketOverview();
        
        // Set up periodic updates (every 60 seconds)
        setInterval(async () => {
            try {
                await fetchAllData();
            } catch (error) {
                console.error("Error updating dashboard:", error);
            }
        }, 15000);
        
        // Hide loading state
        hideLoadingState();
    } catch (error) {
        console.error("Error initializing dashboard:", error);
        // Show error message to user
        showError("Failed to load cryptocurrency data. Showing sample data instead.");
        
        // Fallback to sample data if API fails
        loadSampleData();
        populateHoldingsTable();
        createPortfolioChart();
        createAllocationChart();
        populateMarketOverview();
        hideLoadingState();
    }
}

// Function to show loading state
function showLoadingState() {
    const holdingsBody = document.getElementById('holdings-body');
    const cryptoList = document.getElementById('crypto-list');
    
    if (holdingsBody) {
        holdingsBody.innerHTML = '<tr><td colspan="6"><div class="loading"><div class="spinner"></div>Loading prices...</div></td></tr>';
    }
    
    if (cryptoList) {
        cryptoList.innerHTML = '<div class="loading"><div class="spinner"></div>Loading market data...</div>';
    }
}

// Function to show error message
function showError(message) {
    // Create error element if it doesn't exist
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        document.querySelector('.dashboard-container').prepend(errorElement);
    }
    
    errorElement.textContent = message;
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
        }
    }, 5000);
}

// Function to hide loading state
function hideLoadingState() {
    // Remove any loading indicators
}

// Function to fetch all required data from CoinMarketCap API
async function fetchAllData() {
    try {
        // Fetch portfolio holdings data
        await fetchHoldingsData();
        
        // Fetch market overview data
        await fetchMarketData();
        
        // Update UI with new data
        updateDashboard();
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Function to fetch holdings data from CoinGecko
async function fetchHoldingsData() {
    try {
        // Map symbols to CoinGecko IDs
        const coinIds = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'ADA': 'cardano',
            'SOL': 'solana',
            'XRP': 'ripple',
            'DOT': 'polkadot'
        };
        
        // Get coin IDs from holdings
        const ids = portfolioHoldings.map(holding => coinIds[holding.symbol]).filter(id => id).join(',');
        
        if (!ids) {
            throw new Error("No valid coin IDs found");
        }
        
        // Fetch prices from CoinGecko
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update portfolio holdings with live data
        portfolioData.holdings = portfolioHoldings.map(holding => {
            const coinId = coinIds[holding.symbol];
            const coinData = data[coinId];
            
            if (coinData && coinData.usd !== undefined) {
                const price = coinData.usd;
                const change24h = coinData.usd_24h_change || 0;
                const value = price * holding.holdings;
                
                return {
                    asset: holding.asset,
                    symbol: holding.symbol,
                    price: price,
                    change24h: change24h,
                    holdings: holding.holdings,
                    value: value,
                    allocation: (value / portfolioData.totalBalance) * 100
                };
            } else {
                // Fallback to previous data if API doesn't return data for this coin
                const previousData = portfolioData.holdings.find(item => item.symbol === holding.symbol);
                return previousData || {
                    asset: holding.asset,
                    symbol: holding.symbol,
                    price: 0,
                    change24h: 0,
                    holdings: holding.holdings,
                    value: 0,
                    allocation: 0
                };
            }
        });
    } catch (error) {
        console.error("Error fetching holdings data:", error);
        throw error;
    }
}

// Function to fetch market overview data from CoinGecko
async function fetchMarketData() {
    try {
        // Map symbols to CoinGecko IDs
        const coinIds = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'ADA': 'cardano',
            'SOL': 'solana',
            'XRP': 'ripple',
            'DOT': 'polkadot'
        };
        
        // Get coin IDs for top cryptos
        const ids = topCryptos.map(symbol => coinIds[symbol]).filter(id => id).join(',');
        
        if (!ids) {
            throw new Error("No valid coin IDs found for market data");
        }
        
        // Fetch market data from CoinGecko
        const response = await fetch(
            `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false`
        );
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update market data
        portfolioData.marketData = data.map(coin => {
            return {
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                price: coin.current_price,
                change24h: coin.price_change_percentage_24h,
                marketCap: coin.market_cap,
                volume: coin.total_volume
            };
        });
    } catch (error) {
        console.error("Error fetching market data:", error);
        throw error;
    }
}

// Function to update the dashboard with new data
function updateDashboard() {
    populateHoldingsTable();
    updateMarketOverview();
    
    // Update portfolio value display
    updatePortfolioValue();
    
    // Update charts if they exist
    if (window.portfolioChart) {
        updatePortfolioChart();
    }
    
    if (window.allocationChart) {
        updateAllocationChart();
    }
}

// Function to update portfolio value display
function updatePortfolioValue() {
    // Recalculate total balance based on current holdings
    const newTotalBalance = portfolioData.holdings.reduce((total, asset) => total + asset.value, 0);
    portfolioData.totalBalance = newTotalBalance;
    
    // Update summary cards
    const totalBalanceElement = document.querySelector('.summary-cards .card:nth-child(1) .amount');
    const portfolioValueElement = document.querySelector('.summary-cards .card:nth-child(4) .amount');
    
    if (totalBalanceElement && portfolioValueElement) {
        totalBalanceElement.textContent = `$${newTotalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        portfolioValueElement.textContent = `$${newTotalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Update 24h change
    const change24hElement = document.querySelector('.summary-cards .card:nth-child(2) .amount');
    const change24hTextElement = document.querySelector('.summary-cards .card:nth-child(2) .change');
    
    if (change24hElement && change24hTextElement && portfolioData.holdings.length > 0) {
        // Calculate overall 24h change
        const totalChange = portfolioData.holdings.reduce((total, asset) => {
            return total + (asset.value * (asset.change24h / 100));
        }, 0);
        
        const changePercent = (totalChange / (newTotalBalance - totalChange)) * 100;
        
        change24hElement.textContent = `$${Math.abs(totalChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        change24hTextElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
        change24hTextElement.className = `change ${changePercent >= 0 ? 'positive' : 'negative'}`;
    }
}

// Function to populate the holdings table
function populateHoldingsTable() {
    const tbody = document.getElementById('holdings-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (portfolioData.holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }
    
    portfolioData.holdings.forEach(asset => {
        const row = document.createElement('tr');
        
        // Determine change class
        const changeClass = asset.change24h >= 0 ? 'positive' : 'negative';
        const changeSymbol = asset.change24h >= 0 ? '+' : '';
        
        row.innerHTML = `
            <td>
                <div class="asset-cell">
                    <div class="asset-icon">${asset.symbol.charAt(0)}</div>
                    <div>
                        <div class="asset-name">${asset.asset}</div>
                        <div>${asset.symbol}</div>
                    </div>
                </div>
            </td>
            <td>$${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="price-change ${changeClass}">${changeSymbol}${asset.change24h.toFixed(2)}%</td>
            <td>${asset.holdings}</td>
            <td>$${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${asset.allocation.toFixed(1)}%</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Function to create the portfolio performance chart
function createPortfolioChart() {
    const canvas = document.getElementById('portfolioChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Extract data for the chart
    const dates = portfolioData.portfolioHistory.map(item => item.date);
    const values = portfolioData.portfolioHistory.map(item => item.value);
    
    // Create gradient for the chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
    gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
    
    // Create or update chart
    if (window.portfolioChart instanceof Chart) {
        window.portfolioChart.data.labels = dates;
        window.portfolioChart.data.datasets[0].data = values;
        window.portfolioChart.update();
    } else {
        window.portfolioChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Portfolio Value',
                    data: values,
                    borderColor: '#0ea5e9',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#0ea5e9',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
}

// Function to update the portfolio performance chart
function updatePortfolioChart() {
    if (window.portfolioChart) {
        // For now, we'll keep the historical data static
        // In a real implementation, you would update this with real historical data
        window.portfolioChart.update();
    }
}

// Function to create the asset allocation chart
function createAllocationChart() {
    const canvas = document.getElementById('allocationChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Extract data for the chart
    const labels = portfolioData.holdings.map(asset => asset.symbol);
    const data = portfolioData.holdings.map(asset => asset.allocation);
    
    // Define colors for each asset
    const backgroundColors = [
        '#0ea5e9',
        '#8b5cf6',
        '#ec4899',
        '#f59e0b',
        '#10b981',
        '#ef4444'
    ];
    
    // Create or update chart
    if (window.allocationChart instanceof Chart) {
        window.allocationChart.data.labels = labels;
        window.allocationChart.data.datasets[0].data = data;
        window.allocationChart.update();
    } else {
        window.allocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#e2e8f0',
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
}

// Function to update the asset allocation chart
function updateAllocationChart() {
    if (window.allocationChart) {
        const labels = portfolioData.holdings.map(asset => asset.symbol);
        const data = portfolioData.holdings.map(asset => asset.allocation);
        
        window.allocationChart.data.labels = labels;
        window.allocationChart.data.datasets[0].data = data;
        window.allocationChart.update();
    }
}

// Function to populate the market overview
function populateMarketOverview() {
    const container = document.getElementById('crypto-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (portfolioData.marketData.length === 0) {
        container.innerHTML = '<div class="no-data">No market data available</div>';
        return;
    }
    
    portfolioData.marketData.forEach(crypto => {
        const card = document.createElement('div');
        card.className = 'crypto-card';
        
        // Determine change class
        const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
        const changeSymbol = crypto.change24h >= 0 ? '+' : '';
        
        card.innerHTML = `
            <div class="crypto-header">
                <div>
                    <div class="crypto-symbol">${crypto.symbol}</div>
                    <div class="crypto-name">${crypto.name}</div>
                </div>
                <div class="crypto-price">$${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="crypto-change ${changeClass}">${changeSymbol}${crypto.change24h.toFixed(2)}%</div>
            <div class="crypto-stats">
                <div class="stat">
                    <div class="stat-value">$${(crypto.marketCap / 1000000000).toFixed(2)}B</div>
                    <div class="stat-label">Market Cap</div>
                </div>
                <div class="stat">
                    <div class="stat-value">$${(crypto.volume / 1000000000).toFixed(2)}B</div>
                    <div class="stat-label">Volume (24h)</div>
                </div>
                <div class="stat">
                    <div class="stat-value">$${crypto.price.toFixed(2)}</div>
                    <div class="stat-label">Price</div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Function to update the market overview with new data
function updateMarketOverview() {
    const container = document.getElementById('crypto-list');
    if (!container) return;
    
    // Update each card with new data
    const cards = container.querySelectorAll('.crypto-card');
    cards.forEach((card, index) => {
        if (portfolioData.marketData[index]) {
            const crypto = portfolioData.marketData[index];
            const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
            const changeSymbol = crypto.change24h >= 0 ? '+' : '';
            
            const priceElement = card.querySelector('.crypto-price');
            const changeElement = card.querySelector('.crypto-change');
            const marketCapElement = card.querySelector('.stat-value:nth-child(1)');
            const volumeElement = card.querySelector('.stat-value:nth-child(2)');
            const priceStatElement = card.querySelector('.stat-value:nth-child(3)');
            
            if (priceElement) {
                priceElement.textContent = `$${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            
            if (changeElement) {
                changeElement.textContent = `${changeSymbol}${crypto.change24h.toFixed(2)}%`;
                changeElement.className = `crypto-change ${changeClass}`;
            }
            
            if (marketCapElement) {
                marketCapElement.textContent = `$${(crypto.marketCap / 1000000000).toFixed(2)}B`;
            }
            
            if (volumeElement) {
                volumeElement.textContent = `$${(crypto.volume / 1000000000).toFixed(2)}B`;
            }
            
            if (priceStatElement) {
                priceStatElement.textContent = `$${crypto.price.toFixed(2)}`;
            }
        }
    });
}

// Function to load sample data as fallback
function loadSampleData() {
    portfolioData.holdings = [
        {
            asset: "Bitcoin",
            symbol: "BTC",
            price: 45230.50,
            change24h: 2.5,
            holdings: 0.25,
            value: 11307.63,
            allocation: 44.5
        },
        {
            asset: "Ethereum",
            symbol: "ETH",
            price: 2310.75,
            change24h: 5.2,
            holdings: 5.8,
            value: 13402.35,
            allocation: 52.7
        },
        {
            asset: "Cardano",
            symbol: "ADA",
            price: 0.52,
            change24h: -1.3,
            holdings: 1000,
            value: 520.00,
            allocation: 2.0
        },
        {
            asset: "Solana",
            symbol: "SOL",
            price: 102.40,
            change24h: 3.8,
            holdings: 12,
            value: 1228.80,
            allocation: 4.8
        }
    ];
    
    portfolioData.marketData = [
        {
            name: "Bitcoin",
            symbol: "BTC",
            price: 45230.50,
            change24h: 2.5,
            marketCap: 880000000000,
            volume: 25000000000
        },
        {
            name: "Ethereum",
            symbol: "ETH",
            price: 2310.75,
            change24h: 5.2,
            marketCap: 280000000000,
            volume: 15000000000
        },
        {
            name: "Cardano",
            symbol: "ADA",
            price: 0.52,
            change24h: -1.3,
            marketCap: 18000000000,
            volume: 800000000
        },
        {
            name: "Solana",
            symbol: "SOL",
            price: 102.40,
            change24h: 3.8,
            marketCap: 42000000000,
            volume: 2200000000
        },
        {
            name: "XRP",
            symbol: "XRP",
            price: 0.58,
            change24h: 1.2,
            marketCap: 31000000000,
            volume: 1800000000
        },
        {
            name: "Polkadot",
            symbol: "DOT",
            price: 7.25,
            change24h: -0.8,
            marketCap: 9000000000,
            volume: 400000000
        }
    ];
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Add event listener for refresh button
document.addEventListener('DOMContentLoaded', function() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            try {
                // Show loading state
                showLoadingState();
                
                // Fetch all data
                await fetchAllData();
                
                // Update UI
                updateDashboard();
                
                // Hide loading state
                hideLoadingState();
                
                // Show success message
                showError("Data refreshed successfully!");
            } catch (error) {
                console.error("Error refreshing data:", error);
                showError("Failed to refresh data. Please try again.");
                hideLoadingState();
            }
        });
    }
    
    // Add event listener for search input
    const searchInput = document.getElementById('crypto-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterCryptoList(this.value);
        });
    }
});

// Function to filter crypto list based on search term
function filterCryptoList(searchTerm) {
    const cryptoList = document.getElementById('crypto-list');
    if (!cryptoList) return;
    
    const cards = cryptoList.querySelectorAll('.crypto-card');
    const term = searchTerm.toLowerCase().trim();
    
    cards.forEach(card => {
        const symbolElement = card.querySelector('.crypto-symbol');
        const nameElement = card.querySelector('.crypto-name');
        
        if (symbolElement && nameElement) {
            const symbol = symbolElement.textContent.toLowerCase();
            const name = nameElement.textContent.toLowerCase();
            
            if (term === '' || symbol.includes(term) || name.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Profile picture handler
document.addEventListener('DOMContentLoaded', function() {
    const uploadBtn = document.getElementById('upload-btn');
    const profilePicUpload = document.getElementById('profile-pic-upload');
    const profilePic = document.getElementById('profile-pic');

    if (uploadBtn && profilePicUpload && profilePic) {
        // Set a default profile picture
        profilePic.src = 'https://via.placeholder.com/50';

        uploadBtn.addEventListener('click', function() {
            profilePicUpload.click();
        });

        profilePicUpload.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profilePic.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }
});