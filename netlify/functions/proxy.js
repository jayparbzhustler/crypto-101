exports.handler = async function(event, context) {
    const { path } = event;
    const coinGeckoUrl = `https://api.coingecko.com/api/v3${path.replace("/api", "")}`;

    try {
        const response = await fetch(coinGeckoUrl);
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                "Access-Control-Allow-Origin": "*", // Allow all origins for now
                "Content-Type": "application/json"
            }
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};