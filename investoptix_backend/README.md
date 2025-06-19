# InvestOptix Backend: Zerodha (Kite Connect) Integration

This backend provides REST API endpoints to support login, portfolio display, and trading via Zerodha Kite Connect API.

## Setup

1. Copy `.env.example` to `.env` and fill in your Kite API credentials.
2. Install dependencies:  
   `npm install`
3. Start the server:  
   `npm start` (runs on :5000 by default)

## API Reference

### Authentication

- **GET /api/auth/zerodha/login**  
  Returns `url` for user to login to Kite (frontend can open in new tab).

- **GET /api/auth/zerodha/callback**  
  OAuth2 callback for Zerodha (handled internally). On success, sets secure cookie.

- **POST /api/auth/zerodha/logout**  
  Clears session/cookies.

### Portfolio & Trading

- **GET /api/portfolio/user**  
  Get user profile (`Authorization` via signed cookie or header).

- **GET /api/portfolio/holdings**  
  Get user's current holdings.

- **GET /api/portfolio/orders**  
  Get all orders (past & live).

### Trading Actions

- **POST /api/trade/order**  
  Place order (JSON body: `tradingsymbol`, `transaction_type` [BUY/SELL], `quantity`, optionally: `order_type`, `variety`, `price`).

- **POST /api/trade/cancel**  
  Cancel order (JSON body: `order_id`, [`variety`]).

### Notes
- All endpoints (except health/login/callback) require authentication.
- For demonstration, session is in-memory & cookies; production must use a secure session store.
- All endpoints have CORS enabled for `http://localhost:3000` (React frontend).

---

Kite Connect docs: [https://kite.trade/docs/connect/v3/](https://kite.trade/docs/connect/v3/)
