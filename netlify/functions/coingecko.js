const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { ids, vs_currencies, include_24hr_change } = event.queryStringParameters;
    const COINGECKO_API = "https://api.coingecko.com/api/v3";
    // Read API key from environment; do NOT hardcode keys in source
    const API_KEY = process.env.COINGECKO_API_KEY;
    const apiKeyParam = API_KEY ? `&x_cg_pro_api_key=${encodeURIComponent(API_KEY)}` : '';

    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=${vs_currencies}&include_24hr_change=${include_24hr_change}${apiKeyParam}`
        );
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                "Access-Control-Allow-Origin": "*", // Allow all origins for simplicity, refine in production
                "Content-Type": "application/json"
            }
        };
    } catch (error) {
        console.error("Error fetching data from CoinGecko:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from CoinGecko' })
        };
    }
};