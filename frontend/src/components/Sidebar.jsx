import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  Receipt, 
  History, 
  LogOut, 
  AlertTriangle,
  Menu,
  X,
  Bell
} from 'lucide-react';

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const { user, logout, authFetch } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Poll for low-stock alert count
  useEffect(() => {
    const fetchLowStockCount = async () => {
      try {
        const response = await authFetch('/products/low-stock');
        if (response.ok) {
          const data = await response.json();
          setLowStockCount(data.length);
          setLowStockAlerts(data);
        }
      } catch (err) {
        console.error('Failed to fetch low stock count:', err);
      }
    };

    fetchLowStockCount();
    const interval = setInterval(fetchLowStockCount, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', name: 'Inventory', icon: Package, badge: lowStockCount },
    { id: 'categories', name: 'Categories', icon: FolderOpen },
    { id: 'billing', name: 'Billing POS', icon: Receipt },
    { id: 'history', name: 'Sales History', icon: History }
  ];

  const handleNavClick = (id) => {
    setCurrentPage(id);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="sidebar-inner" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between',
      padding: '2rem 1.5rem',
      background: 'rgba(15, 23, 42, 0.95)',
      borderRight: '1px solid var(--glass-border)'
    }}>
      {/* Brand Logo */}
      <div>
        <div className="brand" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2.5rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}>
              <Receipt size={16} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SmartBill</h2>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Inventory</span>
            </div>
          </div>

          {/* Bell Notifications Trigger */}
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'none',
              border: 'none',
              color: showNotifications || lowStockCount > 0 ? 'var(--accent-amber)' : 'var(--text-secondary)',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              background: showNotifications ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              transition: 'var(--transition-fast)'
            }}
            title="System Alerts"
          >
            <Bell size={18} className={lowStockCount > 0 ? 'pulse-warning' : ''} />
            {lowStockCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-rose)',
                border: '1px solid var(--bg-primary)'
              }}></span>
            )}
          </button>

          {/* Floating Notifications Popover */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              left: '235px',
              top: '0px',
              width: '300px',
              background: 'rgba(30, 41, 59, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              padding: '1.25rem',
              zIndex: 999
            }} className="notifications-dropdown animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#fff' }}>
                  <Bell size={14} style={{ color: 'var(--accent-amber)' }} />
                  <span>Stock Warnings ({lowStockCount})</span>
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(false);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {lowStockAlerts.length > 0 ? (
                  lowStockAlerts.map(item => (
                    <div 
                      key={item.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPage('inventory');
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '0.5rem 0.625rem',
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderLeft: item.stock_quantity === 0 ? '3px solid var(--accent-rose)' : '3px solid var(--accent-amber)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'var(--transition-fast)'
                      }}
                      className="alert-item"
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{item.name}</span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          color: item.stock_quantity === 0 ? 'var(--accent-rose)' : 'var(--accent-amber)' 
                        }}>
                          {item.stock_quantity === 0 ? 'OUT OF STOCK' : `${item.stock_quantity} left`}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>
                        SKU: {item.sku}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    No warnings. All stock levels safe!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'var(--transition-fast)',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent'
                }}
                className="nav-link"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'inherit' }} />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="pulse-warning" style={{
                    fontSize: '0.7rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: 'var(--accent-amber)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '999px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <AlertTriangle size={10} />
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session profile / Logout */}
      <div style={{
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: 'var(--primary)'
          }}>
            {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.625rem',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar wrapper */}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '260px',
        zIndex: 100,
        height: '100vh',
        display: 'block'
      }} className="desktop-sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile Nav Top Bar */}
      <header className="mobile-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        zIndex: 101
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Receipt size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>SmartBill</h2>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setIsMobileOpen(false)}>
          <div style={{
            width: '260px',
            height: '100%',
            background: 'var(--bg-primary)'
          }} onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Inject styling rules for mobile responsiveness directly in JSX style block to avoid adding separate css files */}
      <style>{`
        @media (max-width: 1024px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
        }
        .nav-link:hover {
          background: rgba(255, 255, 255, 0.04) !important;
          color: white !important;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
