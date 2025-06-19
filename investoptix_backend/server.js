require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend (localhost:3000 typical for React)
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET));

// In-memory session (for demo; use Redis/db/session-store for production)
const sessions = {};

// --- Kite API Config ---
const KITE_API_KEY = process.env.KITE_API_KEY;
const KITE_API_SECRET = process.env.KITE_API_SECRET;
const KITE_REDIRECT_URL = process.env.KITE_REDIRECT_URL;
const KITE_BASE_OAUTH = "https://kite.trade/connect/login";
const KITE_BASE_API = "https://api.kite.trade";

// --- Helper: build login URL ---
function getKiteLoginUrl() {
  return `${KITE_BASE_OAUTH}?api_key=${KITE_API_KEY}&v=3&redirect_uri=${encodeURIComponent(KITE_REDIRECT_URL)}`;
}

// PUBLIC_INTERFACE
// Starts login by redirecting to Kite's OAuth2 screen
app.get("/api/auth/zerodha/login", (req, res) => {
  const url = getKiteLoginUrl();
  res.json({ url });
});

// PUBLIC_INTERFACE
// Callback endpoint hit by Zerodha after user login, with request_token
app.get("/api/auth/zerodha/callback", async (req, res) => {
  const { request_token } = req.query;
  if (!request_token) {
    return res.status(400).json({ error: "No request_token query param from Zerodha" });
  }
  try {
    // Exchange request_token for access_token
    const kiteResp = await axios.post(
      `${KITE_BASE_API}/session/token`,
      {
        api_key: KITE_API_KEY,
        request_token,
        api_secret: KITE_API_SECRET
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const { access_token, public_token, user_id } = kiteResp.data.data;

    // Set a secure HTTP-only cookie (for demo, in production use session management/crypto secrets)
    res.cookie("kite_token", access_token, { httpOnly: true, signed: true, sameSite: "lax" });
    // Save in-memory (for demonstration)
    sessions[user_id] = {
      access_token, public_token, time: Date.now()
    };

    // Redirect to frontend (could include status msg)
    res.redirect("http://localhost:3000/?auth=success");
  } catch (err) {
    res.status(500).json({ error: "Failed to exchange request_token", kite_error: err.response?.data || err.message });
  }
});

// Middleware: Authenticate using signed cookie or header token (DEMO! Use proper session mgmt in production)
function kiteAuthMiddleware(req, res, next) {
  let token = req.signedCookies.kite_token;
  if (!token && req.headers["x-kite-token"]) token = req.headers["x-kite-token"];
  if (!token) return res.status(401).json({ error: "Not logged in to Zerodha." });
  req.kite_token = token;
  next();
}

// PUBLIC_INTERFACE
// Gets user profile (whoami) -- also verifies auth status
app.get("/api/portfolio/user", kiteAuthMiddleware, async (req, res) => {
  try {
    const { data } = await axios.get(
      `${KITE_BASE_API}/user/profile`,
      { headers: { "Authorization": `token ${KITE_API_KEY}:${req.kite_token}` } }
    );
    res.json(data.data);
  } catch (err) {
    res.status(401).json({ error: "Could not fetch user profile", details: err.response?.data || err.message });
  }
});

// PUBLIC_INTERFACE
// Fetch user portfolio (full holdings)
app.get("/api/portfolio/holdings", kiteAuthMiddleware, async (req, res) => {
  try {
    const { data } = await axios.get(
      `${KITE_BASE_API}/portfolio/holdings`,
      { headers: { "Authorization": `token ${KITE_API_KEY}:${req.kite_token}` } }
    );
    res.json(data.data);
  } catch (err) {
    res.status(401).json({ error: "Failed to fetch holdings", details: err.response?.data || err.message });
  }
});

// PUBLIC_INTERFACE
// Fetch user trades (live orders, demo: fetches from /orders)
app.get("/api/portfolio/orders", kiteAuthMiddleware, async (req, res) => {
  try {
    const { data } = await axios.get(
      `${KITE_BASE_API}/orders`,
      { headers: { "Authorization": `token ${KITE_API_KEY}:${req.kite_token}` } }
    );
    res.json(data.data);
  } catch (err) {
    res.status(401).json({ error: "Could not fetch orders", details: err.response?.data || err.message });
  }
});

// PUBLIC_INTERFACE
// Place live trade order (BUY/SELL)
app.post("/api/trade/order", kiteAuthMiddleware, async (req, res) => {
  // Expects: tradingsymbol, exchange, transaction_type, quantity, order_type, product, variety, price (optional)
  try {
    const {
      tradingsymbol,
      exchange = "NSE",
      transaction_type, // "BUY" or "SELL"
      quantity,
      order_type = "MARKET", // or "LIMIT"
      product = "CNC", // delivery
      variety = "regular",
      price // optional
    } = req.body;

    if (!tradingsymbol || !transaction_type || !quantity) {
      return res.status(400).json({ error: "Missing required fields: tradingsymbol, transaction_type, quantity" });
    }
    // Construct order payload
    let payload = {
      tradingsymbol, exchange, transaction_type,
      quantity, order_type, product, variety
    };
    if (order_type === "LIMIT" && price) payload.price = price;
    // Place order
    const { data } = await axios.post(
      `${KITE_BASE_API}/orders/${variety}`,
      payload,
      {
        headers: {
          "Authorization": `token ${KITE_API_KEY}:${req.kite_token}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ status: "success", order_id: data.data.order_id });
  } catch (err) {
    res.status(400).json({ error: "Failed to place order", details: err.response?.data || err.message });
  }
});

// PUBLIC_INTERFACE
// Cancel order (given order_id)
app.post("/api/trade/cancel", kiteAuthMiddleware, async (req, res) => {
  try {
    const { order_id, variety = "regular" } = req.body;
    if (!order_id) return res.status(400).json({ error: "order_id required" });

    const { data } = await axios.delete(
      `${KITE_BASE_API}/orders/${variety}/${order_id}`,
      {
        headers: {
          "Authorization": `token ${KITE_API_KEY}:${req.kite_token}`
        }
      }
    );
    res.json({ status: "cancelled", order_id, kite_response: data });
  } catch (err) {
    res.status(400).json({ error: "Failed to cancel order", details: err.response?.data || err.message });
  }
});

// PUBLIC_INTERFACE
// Logout: clear session/cookie
app.post("/api/auth/zerodha/logout", (req, res) => {
  res.clearCookie("kite_token");
  res.json({ status: "logged_out" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ts: Date.now() });
});

// Listen
app.listen(PORT, () => {
  console.log(`InvestOptix backend running on port ${PORT}`);
  console.log(`Kite login URL: ${getKiteLoginUrl()}`);
});
