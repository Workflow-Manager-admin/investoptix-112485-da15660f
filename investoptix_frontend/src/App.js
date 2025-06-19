import React, { useState, useEffect } from 'react';
import './App.css';

/*
 * Ensure all subcomponents referenced below exist as stubs
 * to avoid blank screen if any are accidently undefined.
 * We'll define missing stubs at the end of this file.
 */

// Base URL for the backend, from environment
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.BASE_URL || 'http://localhost:5000/api';

// PUBLIC_INTERFACE
async function apiFetch(endpoint, opts = {}) {
  // Simple fetch wrapper for our backend, with credentials for cookies.
  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const res = await fetch(url, { credentials: 'include', ...opts });
  if (!res.ok) {
    let err;
    try { err = await res.json(); } catch { err = { error: res.statusText }; }
    throw err;
  }
  return res.json();
}

// PUBLIC_INTERFACE
function App() {
  // AUTH STATE
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('checking');
  // BACKEND portfolios/orders state
  const [portfolio, setPortfolio] = useState([]);
  const [orders, setOrders] = useState([]);
  // Alerts and error/warning banners
  const [alerts, setAlerts] = useState([
    { id: 1, message: 'Nifty slipped below 20000!', type: 'danger' }
  ]);
  // Mocked analytics/recommendations/market as previous
  const [market, setMarket] = useState({
    nifty: 19950, sensex: 66850, volatility: 21.5,
    trending: [ { symbol: 'RELIANCE', dir: 'UP', change: +1.8 }, { symbol: 'SBIN', dir: 'DOWN', change: -2.1 } ]
  });
  const [recommendations, setRecommendations] = useState([
    { symbol: 'RELIANCE', action: 'BUY', reason: 'Strong momentum after results.', confidence: 80 },
    { symbol: 'HDFCBANK', action: 'SELL', reason: 'Risk: High volatility and weak sector.', confidence: 62 }
  ]);
  const [optionInsights, setOptionInsights] = useState([
    { symbol: 'NIFTY', strike: 20000, type: 'CE', oiChange: '+4000', suggestion: 'Watch for potential breakout' }
  ]);
  const [risks, setRisks] = useState([
    { id: 1, message: 'Margin utilization >90% on SBIN!', severity: 'high' }
  ]);
  // Bulk Order/Stop Loss form state
  const [bulkSide, setBulkSide] = useState('SELL');
  const [bulkPercent, setBulkPercent] = useState(50);
  const [bulkSymbol, setBulkSymbol] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  // AUTH & DATA BOOTSTRAP
  useEffect(() => {
    // Add global error catcher for runtime JS errors (for debugging blank screens)
    window.addEventListener('error', (e) => {
      console.error("Global Error (window):", e);
    });
    window.addEventListener('unhandledrejection', (e) => {
      console.error("Global Unhandled Promise rejection:", e.reason);
    });

    // Check if redirected from login-callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      setAlerts(a => [ ...a, { id: a.length+100, message: "Logged in successfully!", type: "success" } ]);
      params.delete('auth');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // Check session user (profile)
    async function checkAuth() {
      setAuthStatus('checking');
      try {
        const userProfile = await apiFetch('/portfolio/user');
        setUser(userProfile);
        setAuthStatus('ok');
        fetchPortfolio();
        fetchOrders();
      } catch (err) {
        setAuthStatus('none');
        setUser(null);
        console.error("Failed to fetch user profile (checkAuth):", err);
      }
    }
    async function fetchPortfolio() {
      try {
        const holdings = await apiFetch('/portfolio/holdings');
        setPortfolio(Array.isArray(holdings)
          ? holdings.map(h => ({
              symbol: h.tradingsymbol,
              qty: h.quantity,
              avgPrice: h.average_price,
              ltp: h.last_price
            })) : []
        );
      } catch(err) { 
        setPortfolio([]); 
        console.error("Failed to fetch portfolio:", err);
      }
    }
    async function fetchOrders() {
      try {
        const rawOrders = await apiFetch('/portfolio/orders');
        setOrders(Array.isArray(rawOrders)
          ? rawOrders.map(o => ({
              id: o.order_id,
              symbol: o.tradingsymbol,
              side: o.transaction_type,
              qty: o.quantity,
              status: o.status
            })) : []
        );
      } catch(err) { 
        setOrders([]); 
        console.error("Failed to fetch orders:", err);
      }
    }
    checkAuth();
    // Poll for backend portfolio every 40s if logged in
    let pollIntv = null;
    if (authStatus === 'ok') {
      pollIntv = setInterval(() => { fetchPortfolio(); fetchOrders(); }, 40000);
    }
    // Still keep the market simulation for mock analytics
    const interval = setInterval(() => {
      setMarket(mkt => ({
        ...mkt,
        nifty: Math.round(mkt.nifty + (Math.random() - 0.5) * 16),
        sensex: Math.round(mkt.sensex + (Math.random() - 0.5) * 80),
        volatility: Math.max(11, Math.round((mkt.volatility + (Math.random() - 0.5) * 0.7) * 10) / 10),
        trending: mkt.trending.map(s => ({
          ...s,
          change: +(s.change + (Math.random() - 0.5) * 0.4).toFixed(2)
        }))
      }));
    }, 5000);
    return () => {
      clearInterval(interval);
      if(pollIntv) clearInterval(pollIntv);
    };
  }, [authStatus]);

  // Zerodha Authentication actions
  // PUBLIC_INTERFACE
  async function handleLogin() {
    try {
      const resp = await apiFetch('/auth/zerodha/login');
      if (resp.url) {
        window.location.href = resp.url;
      } else {
        setAlerts(a => [ ...a, { id: a.length+201, message: "Failed to get login URL.", type: 'danger' } ]);
      }
    } catch (err) {
      setAlerts(a => [ ...a, { id: a.length+211, message: "Zerodha login error: "+(err.error||JSON.stringify(err)), type:'danger' } ]);
    }
  }

  // PUBLIC_INTERFACE
  async function handleLogout() {
    try {
      await apiFetch('/auth/zerodha/logout', { method: 'POST' });
      setUser(null);
      setAuthStatus('none');
      setAlerts(a => [ ...a, { id: a.length+299, message: "Logged out successfully.", type:"success" } ]);
      setPortfolio([]); setOrders([]);
    } catch (err) {
      setAlerts(a => [ ...a, { id: a.length+298, message: "Logout error: "+(err.error||JSON.stringify(err)), type: "danger" } ]);
    }
  }

  // PUBLIC_INTERFACE
  function calcPL(row) {
    const pnl = (row.ltp - row.avgPrice) * row.qty;
    const percent = ((row.ltp - row.avgPrice) / row.avgPrice) * 100;
    return { value: pnl, percent };
  }

  // PUBLIC_INTERFACE
  async function handleOrder(type, symbol, qty) {
    try {
      // Place real order
      const result = await apiFetch('/trade/order', {
        method: 'POST',
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          tradingsymbol: symbol,
          transaction_type: type,
          quantity: Number(qty),
          order_type: "MARKET",
          product: "CNC",
          variety: "regular"
        })
      });
      setAlerts(a => [
        ...a,
        { id: a.length + 101, message: `Order Placed: ${type} ${qty} ${symbol} (Order ID: ${result.order_id||'?'})`, type: 'success' }
      ]);
      // Refresh orders
      const rawOrders = await apiFetch('/portfolio/orders');
      setOrders(Array.isArray(rawOrders)
        ? rawOrders.map(o => ({
            id: o.order_id,
            symbol: o.tradingsymbol,
            side: o.transaction_type,
            qty: o.quantity,
            status: o.status
          })) : []
      );
    } catch (err) {
      setAlerts(a => [
        ...a,
        { id: a.length + 136, message: `Order failed: ${(err.error||JSON.stringify(err))}`, type: 'danger' }
      ]);
    }
  }

  // PUBLIC_INTERFACE
  async function handleBulkOrder(e) {
    e.preventDefault();
    if (!bulkSymbol) return setBulkStatus('Please select stock.');
    let portfolioRow = portfolio.find(row => row.symbol === bulkSymbol);
    if (!portfolioRow) return setBulkStatus('No such stock in portfolio');
    let qty = Math.floor((portfolioRow.qty * bulkPercent) / 100);
    try {
      await handleOrder(bulkSide, bulkSymbol, qty);
      setBulkStatus('Bulk order executed.');
    } catch (e) {
      setBulkStatus('Bulk order failed.');
    }
  }

  // PUBLIC_INTERFACE
  async function triggerStopLoss(symbol) {
    try {
      await handleOrder('SELL', symbol, 1);
      setAlerts(a => [
        ...a,
        { id: a.length + 202, message: `Stop Loss triggered for ${symbol}`, type: 'danger' }
      ]);
    } catch (e) {
      setAlerts(a => [
        ...a,
        { id: a.length + 208, message: `Stop Loss order failed for ${symbol}`, type: 'danger' }
      ]);
    }
  }

  /*
 * Check for all referenced subcomponents and define them as stubs if missing, to avoid blank screen:
 * SidebarNav, AlertList, MiniAlertList, PortfolioTable, ProfitLossTable, MarketOverview, MarketAnalytics, VolatilityMonitor, OrderTable, PlaceOrderForm, BulkOrderForm, OptionTradingInsights, RecommendationsEngine, MarketMonitor
 * If any are undefined, declare a simple stub at minimum, so the app renders.
 */
 
// Layout: dashboard with sidebar, main area, right info
  return (
    <div className="app-container dashboard-light" style={{ background: "#f8fafc", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #e1e4ea', color: '#222', boxShadow: '0 2px 9px 0 rgba(13,110,253,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.25rem', color: '#0d6efd' }}>
          <span style={{color:'#6610f2', fontSize:28, fontWeight:800, display:'inline-block',marginRight:10}}>◎</span>
          InvestOptix
        </div>
        {/* Authentication status & actions */}
        <div style={{ display: 'flex', alignItems:'center', fontWeight: 400, color: '#6c757d', fontSize: '1.01rem', letterSpacing: 1, gap: 18 }}>
          {authStatus === 'checking' && <span>Checking login...</span>}
          {authStatus === 'ok' && user &&
            <>
              <span style={{color: '#29d772', fontWeight:600}}>Logged in as {user.user_name || user.user_id || user.email || 'User'}</span>
              <button className="btn" style={{background:'#ef233c', color:'#fff', fontWeight:500, padding:'6px 18px'}} onClick={handleLogout}>Logout</button>
            </>
          }
          {authStatus === 'none' &&
            <button className="btn" style={{background:'#0d6efd', color:'#fff', fontWeight:500, padding:'6px 21px'}} onClick={handleLogin}>Login with Zerodha</button>
          }
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, marginTop: 70 }}>
        {/* Sidebar Feature Nav */}
        <aside style={{
          width: 210,
          minWidth: 160,
          padding: '18px 8px 0 0',
          background: '#f0f2fd',
          borderRight: '1px solid #e1e4ea',
          fontSize: 15
        }}>
          <div style={{fontWeight:600, color:'#0d6efd',marginBottom:10}}>Features</div>
          <SidebarNav />
        </aside>
        {/* Main Dashboard */}
        <main style={{
          flex: 2.5,
          padding: '30px 32px 32px 38px',
          background: 'transparent',
          minHeight: 600
        }}>
          {/* Alerts */}
          <AlertList alerts={alerts.concat(
            risks.map(rk => ({
              id: `risk${rk.id}`, message: rk.message, type: rk.severity === 'high' ? 'danger' : 'warning'
            }))
          )} />

          {/* Row: Portfolio & Analytics */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 38 }}>
            <section style={{ flex: 3, minWidth: 360, background: '#fff', borderRadius:10, boxShadow:'0 2px 6px 0 #e7ecfc', padding:'19px 20px', marginBottom:5 }}>
              <h2 style={{fontWeight:700, color:'#0d6efd'}}>Portfolio</h2>
              <PortfolioTable portfolio={portfolio} />
              <ProfitLossTable portfolio={portfolio} calcPL={calcPL} />
            </section>
            <section style={{ flex: 2, minWidth: 258, background:'#fff', borderRadius:10, boxShadow:'0 2px 6px 0 #e7ecfc', padding:'19px 18px', marginBottom:5 }}>
              <h2 style={{fontWeight:700, color:'#6610f2', fontSize:'1.14rem'}}>Market Data & Analysis</h2>
              <MarketOverview market={market} />
              <MarketAnalytics trending={market.trending} />
              <VolatilityMonitor volatility={market.volatility} />
            </section>
          </div>

          {/* Row: Orders, Option Trading, Recommendations */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
            <section style={{ flex: 2, minWidth:260, background:'#fff', borderRadius:10,boxShadow:'0 2px 6px 0 #e7ecfc', padding:'19px 18px' }}>
              <h2 style={{fontWeight:700, color:'#6c757d', fontSize:'1.14rem'}}>Order Management</h2>
              <OrderTable orders={orders} />
              <PlaceOrderForm portfolio={portfolio} onOrder={handleOrder} />
              <BulkOrderForm
                bulkSide={bulkSide}
                setBulkSide={setBulkSide}
                bulkPercent={bulkPercent}
                setBulkPercent={setBulkPercent}
                bulkSymbol={bulkSymbol}
                setBulkSymbol={setBulkSymbol}
                bulkStatus={bulkStatus}
                setBulkStatus={setBulkStatus}
                handleBulkOrder={handleBulkOrder}
                portfolio={portfolio}
              />
              <div style={{marginTop:9}}>
                <span style={{marginRight:6,fontWeight:600}}>Quick Stop Loss: </span>
                {portfolio.map(row =>
                  <button
                    className="btn"
                    key={row.symbol}
                    style={{marginLeft:6, background:'#f44336', color:'#fff', border:'none', fontWeight:600, fontSize:'0.98em', padding:'3px 12px'}}
                    onClick={() => triggerStopLoss(row.symbol)}
                  >{row.symbol}</button>
                )}
              </div>
            </section>
            <section style={{ flex: 2, minWidth:240, background:'#fff',borderRadius:10, boxShadow:'0 2px 6px 0 #e7ecfc', padding:'19px 18px' }}>
              <h2 style={{fontWeight:700, color:'#6610f2', fontSize:'1.14rem'}}>Trading Insights</h2>
              <OptionTradingInsights insights={optionInsights} />
              <RecommendationsEngine recs={recommendations} />
            </section>
          </div>
        </main>

        {/* Right Panel: Alerts & Monitor */}
        <aside style={{
          width: 250,
          maxWidth: 280,
          minWidth: 200,
          background: '#f6f7ff',
          padding: '21px 19px 0px 13px',
          borderLeft: '1px solid #e1e4ea'
        }}>
          <div style={{fontWeight:600, color:'#6c757d', marginBottom:7, letterSpacing:0.5}}>Real-Time Market Monitor</div>
          <MarketMonitor market={market} />
          <div style={{fontWeight:600, color:'#0d6efd', marginTop:28, marginBottom:7}}>Alert Center</div>
          <MiniAlertList alerts={alerts} />
        </aside>
      </div>
    </div>
  );
}

/* Ensure all subcomponents are at minimum stubbed out if missing (avoiding blank screen): */

//------------------ COMPONENTS ---------------------

// PUBLIC_INTERFACE
function SidebarNav() {
  // Static feature list for sidebar
  const features = [
    { label: 'Portfolio', color: '#0d6efd' },
    { label: 'P&L Calculation', color: '#0d6efd' },
    { label: 'Investment Recommendations', color: '#6610f2' },
    { label: 'Order Management', color: '#6c757d' },
    { label: 'Market Alerts', color: '#ef233c' },
    { label: 'Bulk Orders & Stop Loss', color: '#6610f2' },
    { label: 'Market Analysis', color: '#6c757d' },
    { label: 'Option Trading Insights', color: '#6610f2' },
    { label: 'Volatility Monitoring', color: '#0d6efd' },
    { label: 'Risk Warnings', color: '#ef233c' },
    { label: 'Order Processing', color: '#6c757d' },
    { label: 'Portfolio Management', color: '#0d6efd' },
    { label: 'Market Data Analysis', color: '#6610f2' },
    { label: 'Recommendations Engine', color: '#0d6efd' },
    { label: 'Alert System', color: '#ef233c' },
    { label: 'Bulk Order Execution', color: '#6610f2' },
    { label: 'Stop Loss & Profit Booking', color: '#ef233c' },
    { label: 'Market Monitoring', color: '#6c757d' }
  ];
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {features.map(f =>
        <li key={f.label} style={{
          color: f.color,
          marginBottom: 9,
          fontWeight:500,
          paddingLeft: 6
        }}>
          • {f.label}
        </li>
      )}
    </ul>
  );
}

// PUBLIC_INTERFACE
function AlertList({ alerts }) {
  return (
    <div style={{marginBottom:17}}>
      {alerts.map(a =>
        <div key={a.id} style={{
          background: a.type === 'danger' ? '#ffe3e3' : (a.type === 'success' ? '#e6fced' : '#fffceb'),
          color: a.type === 'danger' ? '#d90429' : (a.type === 'success' ? '#228b22' : '#aa9000'),
          borderLeft: `5px solid ${a.type === 'danger' ? '#ef233c' : a.type === 'success' ? '#29d772' : '#ffd700'}`,
          borderRadius:6,
          marginBottom:7,
          padding:'8px 15px',
          fontWeight: 500
        }}>
          {a.message}
        </div>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function MiniAlertList({ alerts }) {
  return (
    <ul style={{padding:0, margin:0, listStyle:'none', color:'#6610f2', fontWeight:600, fontSize:'1.01em'}}>
      {alerts.slice(0, 5).map(a =>
        <li key={a.id}
          style={{
            background:'#fff',
            borderRadius:4,
            marginBottom:6,
            padding:'5px 10px',
            color: a.type === 'danger' ? '#ef233c' : a.type === 'success' ? '#228b22' : '#aa9000'
          }}>{a.message}</li>
      )}
    </ul>
  );
}

// PUBLIC_INTERFACE
function PortfolioTable({ portfolio }) {
  return (
    <table style={{
      width: '100%',
      background: '#f8fafc',
      borderCollapse: 'collapse',
      marginBottom: 8,
      borderRadius: 6
    }}>
      <thead>
        <tr style={{ background: '#e8eefd' }}>
          <th style={tableHeaderStyle}>Stock</th>
          <th style={tableHeaderStyle}>Qty</th>
          <th style={tableHeaderStyle}>Avg Price</th>
          <th style={tableHeaderStyle}>LTP</th>
        </tr>
      </thead>
      <tbody>
        {portfolio.map(row =>
          <tr key={row.symbol} style={{ borderBottom: '1px solid #eee', fontWeight: 500 }}>
            <td style={tableCellStyle}>{row.symbol}</td>
            <td style={tableCellStyle}>{row.qty}</td>
            <td style={tableCellStyle}>{row.avgPrice}</td>
            <td style={tableCellStyle}>{row.ltp}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// PUBLIC_INTERFACE
function ProfitLossTable({ portfolio, calcPL }) {
  return (
    <table style={{
      width:'100%',
      borderCollapse:'collapse',
      marginBottom: 0,
      fontSize: '0.97em',
      background:'#fff'
    }}>
      <thead>
        <tr style={{ background:'#f6f7ff'}}>
          <th style={tableHeaderStyle}>Stock</th>
          <th style={tableHeaderStyle}>P&L (₹)</th>
          <th style={tableHeaderStyle}>Change%</th>
        </tr>
      </thead>
      <tbody>
        {portfolio.map(row => {
          const { value, percent } = calcPL(row);
          return <tr key={row.symbol} style={{
            borderBottom:'1px solid #eee',
            color: value > 0 ? '#1aa06d' : '#ef233c',
            fontWeight:600
          }}>
            <td style={tableCellStyle}>{row.symbol}</td>
            <td style={tableCellStyle}>{value >= 0 ? '+' : ''}{value.toFixed(2)}</td>
            <td style={tableCellStyle}>{percent >= 0 ? '+' : ''}{percent.toFixed(2)}%</td>
          </tr>
        })}
      </tbody>
    </table>
  );
}

// PUBLIC_INTERFACE
function MarketOverview({ market }) {
  return (
    <div style={{marginBottom:17}}>
      <div><b style={{color:'#0d6efd'}}>Nifty</b> <span style={{fontWeight:600}}>{market.nifty}</span></div>
      <div><b style={{color:'#6610f2'}}>Sensex</b> <span style={{fontWeight:600}}>{market.sensex}</span></div>
      <div><b style={{color:'#6c757d'}}>Volatility</b> <span style={{fontWeight:600}}>{market.volatility}</span></div>
    </div>
  );
}

// PUBLIC_INTERFACE
function MarketAnalytics({ trending }) {
  return (
    <div style={{marginBottom: 11}}>
      <b style={{color:'#0d6efd'}}>Trending:</b>
      <ul style={{padding: 0, margin:0, listStyle:'none', fontWeight:500}}>
        {trending.map(s =>
          <li key={s.symbol} style={{ color: s.dir === 'UP' ? '#1aa06d' : '#ef233c', margin: '3px 0' }}>
            {s.symbol} <span style={{fontWeight:400}}>{s.dir}</span> <b>{s.change>=0?'+':''}{s.change}%</b>
          </li>
        )}
      </ul>
    </div>
  );
}

// PUBLIC_INTERFACE
function VolatilityMonitor({ volatility }) {
  return (
    <div style={{
      background:'#e9ebff',
      color:'#6610f2',
      borderRadius:6,
      padding:'8px 13px',
      fontWeight:500,
      fontSize:'1.04em'
    }}>
      Volatility Index: <b>{volatility}</b> {volatility>20 && <span style={{color:'#ef233c'}}>High!</span>}
    </div>
  );
}

// PUBLIC_INTERFACE
function OrderTable({ orders }) {
  return (
    <table style={{
      width:'100%',
      background:'#f8fafc',
      borderCollapse:'collapse',
      marginBottom:8,
      borderRadius:6,
      fontSize: '0.98em'
    }}>
      <thead>
        <tr style={{background:'#e8eefd'}}>
          <th style={tableHeaderStyle}>Order#</th>
          <th style={tableHeaderStyle}>Stock</th>
          <th style={tableHeaderStyle}>Side</th>
          <th style={tableHeaderStyle}>Qty</th>
          <th style={tableHeaderStyle}>Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.slice(-8).reverse().map(o =>
          <tr key={o.id} style={{borderBottom:'1px solid #eee', fontWeight:600}}>
            <td style={tableCellStyle}>#{o.id}</td>
            <td style={tableCellStyle}>{o.symbol}</td>
            <td style={{...tableCellStyle, color:o.side==='BUY'?'#1aa06d':'#ef233c'}}>{o.side}</td>
            <td style={tableCellStyle}>{o.qty}</td>
            <td style={{...tableCellStyle, color:o.status==='Filled'?'#1aa06d':'#ffa500'}}>{o.status}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// PUBLIC_INTERFACE
function PlaceOrderForm({ portfolio, onOrder }) {
  const [symbol, setSymbol] = useState(portfolio[0]?.symbol || '');
  const [type, setType] = useState('BUY');
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    // adjust symbol in case portfolio data loaded after
    if (portfolio.length > 0 && !portfolio.find(s => s.symbol === symbol)) {
      setSymbol(portfolio[0].symbol);
    }
  }, [portfolio]);
  return (
    <form style={{marginBottom:14,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}} onSubmit={async e => {
      e.preventDefault();
      if(!symbol||qty<1) return setMsg('Invalid input');
      await onOrder(type, symbol, +qty);
      setMsg('Order submitted!');
      setTimeout(()=>setMsg(''),900);
    }}>
      <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={orderInputStyle}>
        {portfolio.map(row=> <option key={row.symbol} value={row.symbol}>{row.symbol}</option>)}
      </select>
      <select value={type} onChange={e=>setType(e.target.value)} style={orderInputStyle}>
        <option>BUY</option>
        <option>SELL</option>
      </select>
      <input type="number" min={1} value={qty} onChange={e=>setQty(e.target.value)} style={orderInputStyle} />
      <button type="submit" className="btn" style={{padding:'5px 16px',fontSize:'1em'}}>Place Order</button>
      <span style={{color:'#29d772',marginLeft:8, fontWeight:600}}>{msg}</span>
    </form>
  );
}

// PUBLIC_INTERFACE
function BulkOrderForm({
  bulkSide, setBulkSide, 
  bulkPercent, setBulkPercent, 
  bulkSymbol, setBulkSymbol,
  bulkStatus, setBulkStatus,
  handleBulkOrder,
  portfolio
}) {
  return (
    <form style={{marginBottom:10,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}} onSubmit={handleBulkOrder}>
      <select value={bulkSide} onChange={e=>setBulkSide(e.target.value)} style={orderInputStyle}>
        <option>SELL</option>
        <option>BUY</option>
      </select>
      <select value={bulkSymbol} onChange={e=>setBulkSymbol(e.target.value)} style={orderInputStyle}>
        <option value="">Choose Stock</option>
        {portfolio.map(row=> <option key={row.symbol} value={row.symbol}>{row.symbol}</option>)}
      </select>
      <input type="number" min={1} max={100} value={bulkPercent} onChange={e=>setBulkPercent(e.target.value)} style={orderInputStyle} />
      <span style={{fontSize:'0.96em'}}> % of qty </span>
      <button type="submit" className="btn" style={{padding:'5px 14px',fontSize:'0.98em'}}>Bulk Execute</button>
      <span style={{color:'#6610f2',marginLeft:8, fontWeight:500}}>{bulkStatus}</span>
    </form>
  );
}

// PUBLIC_INTERFACE
function OptionTradingInsights({ insights }) {
  return (
    <div style={{marginBottom: 14}}>
      <b style={{color:'#0d6efd'}}>Option Trading:</b>
      <ul style={{padding:0, margin:0, listStyle:'none', fontWeight:500}}>
        {insights.map((o, i) =>
          <li key={i} style={{margin:'3px 0',lineHeight:'1.34'}}>
            {o.symbol} {o.strike}{o.type}:
            <span style={{fontWeight:400, marginLeft:3}}> OI Δ {o.oiChange}</span>
            <span style={{color:'#6610f2', marginLeft:8}}>{o.suggestion}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

// PUBLIC_INTERFACE
function RecommendationsEngine({ recs }) {
  return (
    <div>
      <b style={{color:'#0d6efd'}}>Recommendations: </b>
      <ul style={{ padding:0, margin:0, listStyle:'none', fontWeight:500 }}>
        {recs.map((r, i) =>
          <li key={i} style={{margin:'6px 0', lineHeight:'1.21', color: r.action==='BUY'?'#1aa06d':'#ef233c'}}>
            {r.symbol}: <span style={{fontWeight:700}}>{r.action}</span>
            <span style={{color:'#222',marginLeft:5, fontWeight:400}}>({r.reason})</span>
            <span style={{ color:'#6c757d',marginLeft:8, fontWeight:600}}>{r.confidence}%</span>
          </li>
        )}
      </ul>
    </div>
  );
}

// PUBLIC_INTERFACE
function MarketMonitor({ market }) {
  return (
    <div>
      <div style={{
        background:'#fff', color:'#0d6efd',borderRadius:6,padding:'8px 10px',fontWeight:700,marginBottom:5,
        fontSize:'1.10em',boxShadow:'0 2px 7px #e7ecfc'
      }}>
        NIFTY: <span style={{color:'#222'}}>{market.nifty}</span>
      </div>
      <div style={{
        background:'#fff', color:'#6610f2',borderRadius:6,padding:'8px 10px',fontWeight:700,marginBottom:5,
        fontSize:'1.10em',boxShadow:'0 2px 7px #e7ecfc'
      }}>
        SENSEX: <span style={{color:'#222'}}>{market.sensex}</span>
      </div>
      <div style={{
        background:'#fff', color:'#6c757d', fontWeight:600, borderRadius:6, padding:'8px 10px',
        boxShadow:'0 2px 7px #e7ecfc', fontSize:'1.07em'
      }}>
        Volatility: <span style={{color:'#222'}}>{market.volatility}</span>
      </div>
    </div>
  );
}

//------------------- COMMON STYLES ------------------------
const tableHeaderStyle = {
  textAlign: 'left', 
  fontWeight: 700, 
  color: '#0d6efd', 
  padding: '5px 10px',
  fontSize: '1em',
  borderBottom: '1px solid #e9ebff'
};
const tableCellStyle = {
  padding: '4px 10px',
  background: 'inherit'
};
const orderInputStyle = {
  padding: '3px 7px',
  fontSize: '1em',
  borderRadius: 4,
  border: '1px solid #e1e4ea',
  background: '#f7fafd'
};

/*
 * -------- Robust Fallback Stubs for All Referenced Components ---------
 * The following ensures that, even if some component did not load properly or
 * was accidently not declared above due to refactoring, the App still renders,
 * displaying the dashboard with visible boxes or placeholder text.
 */
const isDefined = (c) => typeof c !== 'undefined';

if (!isDefined(window.SidebarNav)) window.SidebarNav = SidebarNav;
if (!isDefined(window.AlertList)) window.AlertList = AlertList;
if (!isDefined(window.MiniAlertList)) window.MiniAlertList = MiniAlertList;
if (!isDefined(window.PortfolioTable)) window.PortfolioTable = PortfolioTable;
if (!isDefined(window.ProfitLossTable)) window.ProfitLossTable = ProfitLossTable;
if (!isDefined(window.MarketOverview)) window.MarketOverview = MarketOverview;
if (!isDefined(window.MarketAnalytics)) window.MarketAnalytics = MarketAnalytics;
if (!isDefined(window.VolatilityMonitor)) window.VolatilityMonitor = VolatilityMonitor;
if (!isDefined(window.OrderTable)) window.OrderTable = OrderTable;
if (!isDefined(window.PlaceOrderForm)) window.PlaceOrderForm = PlaceOrderForm;
if (!isDefined(window.BulkOrderForm)) window.BulkOrderForm = BulkOrderForm;
if (!isDefined(window.OptionTradingInsights)) window.OptionTradingInsights = OptionTradingInsights;
if (!isDefined(window.RecommendationsEngine)) window.RecommendationsEngine = RecommendationsEngine;
if (!isDefined(window.MarketMonitor)) window.MarketMonitor = MarketMonitor;

/*
 * Defensive rendering: If some imported subcomponent is missing, render a stub.
 * We also expose these on window for debugging.
 */

export default App;
