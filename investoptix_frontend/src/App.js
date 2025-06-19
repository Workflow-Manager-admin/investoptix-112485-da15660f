import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Color theme config for InvestOptix (light theme)
 * Primary: #0d6efd, Secondary: #6c757d, Accent: #6610f2
 */

// PUBLIC_INTERFACE
function App() {
  // Portfolio & Order state (mocked for now)
  const [portfolio, setPortfolio] = useState([
    { symbol: 'TCS', qty: 12, avgPrice: 3400, ltp: 3520 },
    { symbol: 'INFY', qty: 20, avgPrice: 1430, ltp: 1425 },
    { symbol: 'HDFCBANK', qty: 10, avgPrice: 1520, ltp: 1515 }
  ]);

  const [orders, setOrders] = useState([
    { id: 1, symbol: 'TCS', side: 'BUY', qty: 4, status: 'Filled' },
    { id: 2, symbol: 'INFY', side: 'SELL', qty: 5, status: 'Open' }
  ]);

  // Alerts
  const [alerts, setAlerts] = useState([
    { id: 1, message: 'Nifty slipped below 20000!', type: 'danger' }
  ]);

  // Market data & analytics (mocked)
  const [market, setMarket] = useState({
    nifty: 19950,
    sensex: 66850,
    volatility: 21.5,
    trending: [
      { symbol: 'RELIANCE', dir: 'UP', change: +1.8 },
      { symbol: 'SBIN', dir: 'DOWN', change: -2.1 }
    ]
  });

  // Recommendations & analysis (mock)
  const [recommendations, setRecommendations] = useState([
    {
      symbol: 'RELIANCE', 
      action: 'BUY', 
      reason: 'Strong momentum after results.',
      confidence: 80
    },
    {
      symbol: 'HDFCBANK', 
      action: 'SELL', 
      reason: 'Risk: High volatility and weak sector.',
      confidence: 62
    }
  ]);

  // Options insights (mock)
  const [optionInsights, setOptionInsights] = useState([
    {
      symbol: 'NIFTY',
      strike: 20000,
      type: 'CE',
      oiChange: '+4000',
      suggestion: 'Watch for potential breakout'
    }
  ]);

  // Risk warnings (mock)
  const [risks, setRisks] = useState([
    { id: 1, message: 'Margin utilization >90% on SBIN!', severity: 'high' }
  ]);

  // Simulate real time data refresh intervals (for market/index only here)
  useEffect(() => {
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
    return () => clearInterval(interval);
  }, []);

  // Bulk Order/Stop Loss form state
  const [bulkSide, setBulkSide] = useState('SELL');
  const [bulkPercent, setBulkPercent] = useState(50);
  const [bulkSymbol, setBulkSymbol] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  // PUBLIC_INTERFACE
  function calcPL(row) {
    // Calculate P&L for single portfolio row
    const pnl = (row.ltp - row.avgPrice) * row.qty;
    const percent = ((row.ltp - row.avgPrice) / row.avgPrice) * 100;
    return {
      value: pnl,
      percent
    };
  }

  // PUBLIC_INTERFACE
  function handleOrder(type, symbol, qty) {
    // Place mock order and append
    setOrders(lst => [
      ...lst,
      { id: lst.length + 1, symbol, side: type, qty, status: 'Open' }
    ]);
    setAlerts(a => [
      ...a,
      { id: a.length + 101, message: `Order Placed: ${type} ${qty} ${symbol}`, type: 'success' }
    ]);
  }

  // PUBLIC_INTERFACE
  function handleBulkOrder(e) {
    e.preventDefault();
    if (!bulkSymbol) return setBulkStatus('Please select stock for bulk action.');
    setBulkStatus('Bulk order sent!');
    // Mock: add order and trigger an alert
    let portfolioRow = portfolio.find(row => row.symbol === bulkSymbol);
    if (!portfolioRow) return setBulkStatus('No such stock in portfolio');
    let qty = Math.floor((portfolioRow.qty * bulkPercent) / 100);
    handleOrder(bulkSide, bulkSymbol, qty);
  }

  // PUBLIC_INTERFACE
  function triggerStopLoss(symbol) {
    // Place stop loss order for stock
    setAlerts(a => [
      ...a,
      { id: a.length + 202, message: `Stop Loss triggered for ${symbol}`, type: 'danger' }
    ]);
    handleOrder('SELL', symbol, 1);
  }

  // Layout: dashboard with sidebar, main area, right info
  return (
    <div className="app-container dashboard-light" style={{ background: "#f8fafc", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #e1e4ea', color: '#222', boxShadow: '0 2px 9px 0 rgba(13,110,253,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.25rem', color: '#0d6efd' }}>
          <span style={{color:'#6610f2', fontSize:28, fontWeight:800, display:'inline-block',marginRight:10}}>◎</span>
          InvestOptix
        </div>
        <div style={{ fontWeight: 400, color: '#6c757d', fontSize: '1.05rem', letterSpacing: 1 }}>
          Markets, Alerts & Trading Controls
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
  // List of prominent alerts
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
  return (
    <form style={{marginBottom:14,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}} onSubmit={e => {
      e.preventDefault();
      if(!symbol||qty<1) return setMsg('Invalid input');
      onOrder(type, symbol, +qty);
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
  // Prominent boxes for indices
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

export default App;
