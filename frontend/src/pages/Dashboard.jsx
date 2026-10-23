import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  IndianRupee, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const Dashboard = ({ setCurrentPage }) => {
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [lowStockList, setLowStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      // Fetch analytics
      const analyticsRes = await authFetch('/analytics/dashboard');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setData(analyticsData);
      }

      // Fetch low stock items list
      const lowStockRes = await authFetch('/products/low-stock');
      if (lowStockRes.ok) {
        const lowStockData = await lowStockRes.json();
        setLowStockList(lowStockData);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pulse-warning" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Loading Dashboard Analytics...</div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalSales: 0,
    totalInvoices: 0,
    totalGst: 0,
    totalProfit: 0,
    lowStockCount: 0,
    totalProducts: 0
  };

  // Custom SVG Line Chart helper for 7-day trend
  const trend = data?.salesTrend || [];
  const maxSales = Math.max(...trend.map(t => t.sales), 100);
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Calculate coordinates for points
  const points = trend.map((t, idx) => {
    const x = paddingX + (idx * (svgWidth - paddingX * 2)) / (trend.length - 1);
    const y = svgHeight - paddingY - (t.sales * (svgHeight - paddingY * 2)) / maxSales;
    return { x, y, val: t.sales, date: t.date };
  });

  const linePath = points.map((p, idx) => {
    return `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }).join(' ');

  // Create area path under the line for the gradient fill
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z` : '';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Real-time inventory statistics and revenue monitoring.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'pulse-warning' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
        </button>
      </div>

      {/* KPI Stats widgets grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* KPI 1: Sales Revenue */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gross Sales</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.125rem' }}>₹{summary.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Total Revenue generated</span>
          </div>
        </div>

        {/* KPI 2: Total Net Profit */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-emerald)',
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Profit</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.125rem' }}>₹{summary.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Excluding GST & Purchase Costs</span>
          </div>
        </div>

        {/* KPI 3: Stock Products */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--accent-cyan)',
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Items</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.125rem' }}>{summary.totalProducts}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Products</span>
          </div>
        </div>

        {/* KPI 4: Low stock alerts */}
        <div 
          className="glass-panel" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            cursor: 'pointer',
            border: summary.lowStockCount > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--glass-border)' 
          }}
          onClick={() => setCurrentPage('inventory')}
        >
          <div style={{
            background: summary.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)',
            color: summary.lowStockCount > 0 ? 'var(--accent-amber)' : 'var(--text-muted)',
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} className={summary.lowStockCount > 0 ? 'pulse-warning' : ''}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Low Stock Alert</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.125rem', color: summary.lowStockCount > 0 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>{summary.lowStockCount}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{summary.lowStockCount > 0 ? 'Needs reordering' : 'All stocks healthy'}</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Alert panels split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem',
      }} className="dashboard-grid">
        
        {/* Sales Chart Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Sales Revenue Trend</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Billing invoices graph for the past 7 days.</p>
          </div>

          <div style={{ flex: 1, minHeight: '240px', position: 'relative' }}>
            {trend.length > 0 ? (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', minWidth: '500px', height: 'auto', display: 'block' }}>
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = paddingY + ratio * (svgHeight - paddingY * 2);
                    const val = Math.round(maxSales - ratio * maxSales);
                    return (
                      <g key={index}>
                        <line 
                          x1={paddingX} 
                          y1={y} 
                          x2={svgWidth - paddingX} 
                          y2={y} 
                          stroke="rgba(255,255,255,0.05)" 
                          strokeWidth="1" 
                          strokeDasharray="4 4"
                        />
                        <text 
                          x={paddingX - 10} 
                          y={y + 4} 
                          fill="var(--text-muted)" 
                          fontSize="10" 
                          textAnchor="end"
                        >
                          ₹{val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Area Fill */}
                  {areaPath && <path d={areaPath} fill="url(#chartGlow)" />}

                  {/* Main Trend Line */}
                  <path 
                    d={linePath} 
                    fill="none" 
                    stroke="var(--primary)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive points & tooltip anchors */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="6" 
                        fill="var(--bg-primary)" 
                        stroke="var(--primary)" 
                        strokeWidth="3" 
                        style={{ cursor: 'pointer', transition: 'r 0.1s ease' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.setAttribute('r', '8');
                          const tooltip = document.getElementById(`tooltip-${idx}`);
                          if (tooltip) tooltip.setAttribute('visibility', 'visible');
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.setAttribute('r', '6');
                          const tooltip = document.getElementById(`tooltip-${idx}`);
                          if (tooltip) tooltip.setAttribute('visibility', 'hidden');
                        }}
                      />
                      {/* X Axis labels */}
                      <text 
                        x={p.x} 
                        y={svgHeight - 8} 
                        fill="var(--text-secondary)" 
                        fontSize="9.5" 
                        textAnchor="middle"
                        fontWeight="500"
                      >
                        {p.date}
                      </text>

                      {/* Tooltip Popup */}
                      <g id={`tooltip-${idx}`} visibility="hidden">
                        <rect 
                          x={p.x - 45} 
                          y={p.y - 34} 
                          width="90" 
                          height="22" 
                          rx="4" 
                          fill="rgba(15, 23, 42, 0.95)" 
                          stroke="var(--glass-border)"
                        />
                        <text 
                          x={p.x} 
                          y={p.y - 20} 
                          fill="#fff" 
                          fontSize="9.5" 
                          textAnchor="middle" 
                          fontWeight="600"
                        >
                          ₹{Math.round(p.val)}
                        </text>
                      </g>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No invoice transactions recorded in the past 7 days.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert Sidebar Table */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Low Stock Alerts</h2>
            <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', borderRadius: '4px', fontWeight: 600 }}>
              {lowStockList.length} items
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lowStockList.length > 0 ? (
              lowStockList.map((item) => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {item.sku}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                      {item.stock_quantity} Left
                    </span>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Min: {item.reorder_level}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                gap: '0.5rem'
              }}>
                <ShieldCheck size={32} style={{ color: 'var(--accent-emerald)' }} />
                <span style={{ fontSize: '0.8rem', textAlign: 'center' }}>All inventory items are above safety margins.</span>
              </div>
            )}
          </div>

          {lowStockList.length > 0 && (
            <button 
              onClick={() => setCurrentPage('inventory')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                border: 'none',
                background: 'none',
                color: 'var(--primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--glass-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary)'}
            >
              <span>Manage stock levels</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
