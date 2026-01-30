document.addEventListener('DOMContentLoaded', function () {
    initDashboard();
});

// User's mock holdings
const MY_HOLDINGS = {
    'bitcoin': 0.5572,
    'ethereum': 6.7662,
    'avalanche-2': 444.03,
    'litecoin': 111.44
};

// Map CoinGecko IDs to our internal symbols/types
const COIN_MAPPING = {
    'bitcoin': { symbol: 'BTC', name: 'Bitcoin', type: 'btc' },
    'ethereum': { symbol: 'ETH', name: 'Ethereum', type: 'eth' },
    'avalanche-2': { symbol: 'AVAX', name: 'Avalanche', type: 'avax' },
    'litecoin': { symbol: 'LTC', name: 'Litecoin', type: 'ltc' }
};

const FALLBACK_DATA = [
    { name: 'Bitcoin', symbol: 'BTC', price: '68,450.00', holding: '0.5572 BTC', change: '+1.15%', isPositive: true, type: 'btc', sparkline: [67000, 67200, 68000], rawValue: 38140 },
    { name: 'Ethereum', symbol: 'ETH', price: '3,500.00', holding: '6.7662 ETH', change: '-0.23%', isPositive: false, type: 'eth', sparkline: [3500, 3550, 3480], rawValue: 23681 },
    { name: 'Avalanche', symbol: 'AVAX', price: '32.00', holding: '444.03 AVAX', change: '+3.48%', isPositive: true, type: 'avax', sparkline: [30, 31, 32], rawValue: 14208 },
    { name: 'Litecoin', symbol: 'LTC', price: '85.00', holding: '111.44 LTC', change: '+2.09%', isPositive: true, type: 'ltc', sparkline: [82, 84, 85], rawValue: 9472 }
];

let assetsData = []; // To be populated by API

async function initDashboard() {
    try {
        await fetchMarketData();
    } catch (e) {
        console.warn("API fetch failed/limited. Using fallback data.", e);
        assetsData = FALLBACK_DATA;

        // Update header even with fallback
        const total = FALLBACK_DATA.reduce((acc, curr) => acc + curr.rawValue, 0);
        const totalEl = document.querySelector('.total-value');
        if (totalEl) totalEl.textContent = `$${total.toLocaleString()}`;
    }

    renderAssets();
    renderTransactions();
    renderPortfolioChart();
}

async function fetchMarketData() {
    const coinIds = Object.keys(MY_HOLDINGS).join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&sparkline=true`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('API limit or error');

    const data = await response.json();

    let totalValue = 0;

    // Transform API data
    assetsData = data.map(coin => {
        const id = coin.id;
        const holdingAmount = MY_HOLDINGS[id] || 0;
        const currentPrice = coin.current_price;
        const value = holdingAmount * currentPrice;
        totalValue += value;

        return {
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            holding: `${holdingAmount} ${coin.symbol.toUpperCase()}`,
            change: `${coin.price_change_percentage_24h.toFixed(2)}%`,
            isPositive: coin.price_change_percentage_24h >= 0,
            type: COIN_MAPPING[id]?.type || 'btc',
            sparkline: coin.sparkline_in_7d.price, // API returns { price: [...] } or [...] depending on params, check if direct array in simple response or if mapped differently. Actually coingecko sparkline=true returns sparkline_in_7d: { price: [...] }
            rawValue: value
        };
    });

    // Update Portfolio Header Text
    const totalEl = document.querySelector('.total-value');
    if (totalEl) {
        totalEl.textContent = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

/* --- Portfolio Chart --- */
function renderPortfolioChart() {
    const ctx = document.getElementById('mainPortfolioChart');
    if (!ctx) return;

    // Gradient for the chart fill
    // We create it manually on the canvas context if needed, but Chart.js usually handles it better
    // inside the config if we refer to the canvas visual. 
    // Here we need to grab the context to make a gradient.
    const canvas = ctx.getContext('2d');
    const gradient = canvas.createLinearGradient(0, 0, 0, 300);
    // Greenish/Orange blend matching the reference glow
    gradient.addColorStop(0, 'rgba(0, 192, 118, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 192, 118, 0)');

    // Mock Data points to visually match the curve
    const labels = Array.from({ length: 30 }, (_, i) => i); // Just indices for smooth look
    const dataPoints = [
        32000, 34000, 31000, 33000, 38000, 42000, 40000, 39000,
        45000, 47000, 43000, 50000, 55000, 60000, 58000, 56000,
        62000, 65000, 70000, 75000, 72000, 78000, 85000, 82000,
        88000, 92000, 90000, 94726
    ];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio',
                data: dataPoints,
                borderColor: '#F7931A', // Orange line
                borderWidth: 2,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4, // Smooth curve
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            scales: {
                x: {
                    display: false, // Hide x axis grid/labels inside chart
                },
                y: {
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        borderDash: [5, 5]
                    },
                    ticks: {
                        color: '#444',
                        callback: function (value) {
                            return '$' + value / 1000 + 'K';
                        }
                    },
                    border: { display: false }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

/* --- Assets List Rendering --- */
// assetsData is now populated via fetchMarketData

function renderAssets() {
    const container = document.getElementById('assets-list');
    if (!container) return;

    container.innerHTML = '';

    assetsData.forEach(asset => {
        const row = document.createElement('div');
        row.className = 'asset-row';

        // Generate a simple SVG sparkline based on data
        const sparklineSVG = generateSparklineSVG(asset.sparkline, asset.isPositive ? '#00C076' : '#FF4D4D');

        row.innerHTML = `
            <div class="asset-info">
                <div class="asset-icon ${asset.type}">${asset.symbol[0]}</div>
                <div class="asset-name-group">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-symbol">${asset.symbol}</div>
                </div>
            </div>
            <div class="sparkline-container">${sparklineSVG}</div>
            <div class="asset-price">$${asset.price}</div>
            <div class="asset-holding">${asset.holding}</div>
            <div class="asset-change ${asset.isPositive ? 'positive' : 'negative'}">
                ${asset.change} ${asset.isPositive ? '↑' : '↓'}
            </div>
        `;

        container.appendChild(row);
    });
}

function generateSparklineSVG(data, color) {
    const width = 80;
    const height = 30;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    // Create points string
    const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * width;
        const normalizedY = (val - min) / (range || 1);
        const y = height - (normalizedY * height); // Invert Y for SVG
        return `${x},${y}`;
    }).join(' ');

    return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="${points}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
}

/* --- Transactions Rendering --- */
const transactionsData = [
    {
        name: 'Bitcoin',
        symbol: 'BTC',
        amount: '0.0125',
        value: '$850.75',
        date: 'Jun 8',
        status: 'Pending',
        type: 'btc',
        iconType: 'btc'
    },
    {
        name: 'Tether',
        symbol: 'USDT',
        amount: '1000',
        value: '$1,000.00',
        date: 'Jun 7',
        status: 'Completed',
        type: 'usdt',
        iconType: 'usdt'
    },
    {
        name: 'Solana',
        symbol: 'SOL',
        amount: '3.25',
        value: '$482.00',
        date: 'May 30',
        status: 'Completed',
        type: 'sol',
        iconType: 'sol'
    },
    {
        name: 'Ethereum',
        symbol: 'ETH',
        amount: '0.5',
        value: '$1,720.00',
        date: 'May 28',
        status: 'Completed',
        type: 'eth',
        iconType: 'eth'
    }
];

function renderTransactions() {
    const container = document.getElementById('transactions-list');
    if (!container) return;

    container.innerHTML = '';

    transactionsData.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'transaction-item';

        // Icon letter or SVGs can be used
        const iconLetter = tx.symbol === 'USDT' ? 'T' : tx.symbol[0];

        item.innerHTML = `
            <div class="t-coin">
                <div class="t-icon ${tx.type}">${iconLetter}</div>
                <div class="t-info">
                    <div class="t-name">${tx.name}</div>
                    <div class="t-symbol">${tx.symbol}</div>
                </div>
            </div>
            <div class="t-amount-group">
                <div class="t-amount">${tx.amount}</div>
                <div class="t-value">${tx.value}</div>
            </div>
            <div>
                <div class="t-date">${tx.date}</div>
                <div class="t-status ${tx.status.toLowerCase()}">${tx.status}</div>
            </div>
        `;

        container.appendChild(item);
    });
}