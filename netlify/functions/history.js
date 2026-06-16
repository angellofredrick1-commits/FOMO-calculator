// Netlify serverless function — proxies Mansa Markets API
// Called by the browser as: GET /.netlify/functions/history?symbol=CRDB&from=2020-01-01
// Runs server-side so CORS and key exposure are not an issue

const MANSA_KEY  = "mansa_live_sk_q965e9cwd6wme25m";
const MANSA_BASE = "https://www.mansaapi.com";

exports.handler = async function(event) {
  const symbol = (event.queryStringParameters && event.queryStringParameters.symbol || "CRDB").toUpperCase();
  const from   =  event.queryStringParameters && event.queryStringParameters.from   || "2020-01-01";

  const url = MANSA_BASE + "/api/v1/markets/exchanges/DSE/stocks/" + symbol + "/history?from=" + from;

  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": "Bearer " + MANSA_KEY,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "Mansa API error: " + res.status }),
      };
    }

    const data = await res.json();

    // Normalise to [{ date, price }]
    const prices = (data.history || []).map(function(h) {
      return { date: h.date, price: h.close };
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=21600", // cache 6 hours
      },
      body: JSON.stringify(prices),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
