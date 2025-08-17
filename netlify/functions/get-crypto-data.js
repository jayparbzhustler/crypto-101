const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { ids, vs_currencies, include_24hr_change } = event.queryStringParameters;
    const COINGECKO_API = "https://api.coingecko.com/api/v3";

    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=${vs_currencies}&include_24hr_change=${include_24hr_change}`
        );
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Error fetching data from CoinGecko:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from CoinGecko' })
        };
    }
};