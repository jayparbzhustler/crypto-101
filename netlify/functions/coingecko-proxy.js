exports.handler = async function(event, context) {
    const { path, queryStringParameters } = event;
    const coinGeckoPath = path.replace("/api", ""); // Remove /api prefix
    const url = `https://api.coingecko.com${coinGeckoPath}?${new URLSearchParams(queryStringParameters).toString()}`;

    try {
        const response = await fetch(url);
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
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch data from CoinGecko" }),
        };
    }
};