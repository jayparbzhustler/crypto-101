const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    try {
        const { ids, vs_currencies, include_24hr_change } = event.queryStringParameters;
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}&include_24hr_change=${include_24hr_change}`;
        
        const response = await fetch(url);
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from CoinGecko' })
        };
    }
};