import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Trash2, 
  User, 
  Phone, 
  CreditCard, 
  Receipt, 
  Plus, 
  Minus, 
  ShoppingBag,
  Printer,
  X,
  FileCheck
} from 'lucide-react';
import Toast from '../components/Toast';

const Billing = () => {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  // Customer Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');

  // Checkout Receipt Modal
  const [showReceipt, setShowReceipt] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch all products on mount to allow local filtering
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await authFetch('/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (err) {
        showToast('Failed to load products list', 'error');
      }
    };
    fetchProducts();
  }, []);

  // Filter products when search changes
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const query = search.toLowerCase();
    const filtered = products.filter(
      p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
    );
    setSearchResults(filtered);
  }, [search, products]);

  // Click outside search results to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add Item to Cart
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      showToast(`"${product.name}" is out of stock!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex(item => item.product_id === product.id);

    if (existingIndex > -1) {
      const newQty = cart[existingIndex].quantity + 1;
      if (newQty > product.stock_quantity) {
        showToast(`Cannot add more. Only ${product.stock_quantity} units available.`, 'warning');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity = newQty;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        unit_price: product.selling_price, // selling price excl. GST
        gst_rate: product.gst_rate,
        quantity: 1,
        stock_quantity: product.stock_quantity // keep reference for checks
      }]);
    }

    setSearch('');
    setSearchResults([]);
    showToast(`Added "${product.name}" to cart`, 'success');
  };

  // Adjust Quantity
  const updateQuantity = (id, delta) => {
    const updated = cart.map(item => {
      if (item.product_id === id) {
        const targetQty = item.quantity + delta;
        if (targetQty <= 0) return null;
        if (targetQty > item.stock_quantity) {
          showToast(`Cannot exceed available stock of ${item.stock_quantity} units.`, 'warning');
          return item;
        }
        return { ...item, quantity: targetQty };
      }
      return item;
    }).filter(Boolean);

    setCart(updated);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.product_id !== id));
    showToast('Item removed from cart', 'warning');
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let gstAmount = 0;

    cart.forEach(item => {
      const itemSubtotal = item.unit_price * item.quantity;
      const itemGst = itemSubtotal * (item.gst_rate / 100);
      subtotal += itemSubtotal;
      gstAmount += itemGst;
    });

    return {
      subtotal,
      gstAmount,
      grandTotal: subtotal + gstAmount
    };
  };

  const { subtotal, gstAmount, grandTotal } = calculateTotals();

  // Checkout submission
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!cart.length) {
      showToast('Billing cart is empty!', 'error');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Customer details are required to generate billing invoices.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch('/billing/invoice', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          payment_mode: paymentMode,
          items: cart.map(item => ({
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity
          }))
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Invoice generated successfully!', 'success');
        setActiveInvoice(data); // Stores { invoice, items }
        setShowReceipt(true);
        
        // Reset Cart and customer info
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setPaymentMode('Cash');

        // Refresh products list to reflect new stock levels
        const refreshProducts = await authFetch('/products');
        if (refreshProducts.ok) {
          const freshData = await refreshProducts.json();
          setProducts(freshData);
        }
      } else {
        showToast(data.message || 'Checkout failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Point of Sale (POS) Billing</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Search products, manage customer invoices, and process instant checkout.</p>
      </div>

      {/* POS Double-pane layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '1.5rem',
      }} className="pos-layout">
        
        {/* Left Pane: Product Search & Cart Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Product Search Bar */}
          <div className="glass-panel" ref={searchRef} style={{ position: 'relative', zIndex: 10, overflow: 'visible' }}>
            <span className="form-label">Search Products</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                className="form-control"
                placeholder="Type Product Name or Scan SKU code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', background: 'rgba(15, 23, 42, 0.4)' }}
              />
            </div>

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '1.5rem',
                right: '1.5rem',
                background: '#1e293b',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-lg)',
                maxHeight: '220px',
                overflowY: 'auto',
                zIndex: 99
              }}>
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock_quantity <= 0}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: p.stock_quantity > 0 ? 'pointer' : 'not-allowed',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--glass-border)',
                      opacity: p.stock_quantity <= 0 ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (p.stock_quantity > 0) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>SKU: {p.sku} | GST: {p.gst_rate}%</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>₹{p.selling_price.toFixed(2)}</p>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: p.stock_quantity <= p.reorder_level ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                        fontWeight: 600
                      }}>
                        {p.stock_quantity === 0 ? 'Out of stock' : `${p.stock_quantity} available`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table list */}
          <div className="glass-panel" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
                <span>Selected Items</span>
              </h2>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px' }}>
              {cart.length > 0 ? (
                <div className="table-container">
                  <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '1.5rem' }}>Product</th>
                        <th>Price (Excl.)</th>
                        <th>Qty</th>
                        <th>GST %</th>
                        <th>Total</th>
                        <th style={{ width: '60px', textAlign: 'center', paddingRight: '1.5rem' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => {
                        const itemSubtotal = item.unit_price * item.quantity;
                        const itemGst = itemSubtotal * (item.gst_rate / 100);
                        const itemTotal = itemSubtotal + itemGst;

                        return (
                          <tr key={item.product_id}>
                            <td style={{ paddingLeft: '1.5rem' }}>
                              <div>
                                <p style={{ fontWeight: 600 }}>{item.name}</p>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.sku}</span>
                              </div>
                            </td>
                            <td>₹{item.unit_price.toFixed(2)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                  onClick={() => updateQuantity(item.product_id, -1)}
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--bg-tertiary)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Minus size={10} />
                                </button>
                                <span style={{ width: '20px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product_id, 1)}
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--bg-tertiary)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <span style={{ color: 'var(--accent-cyan)' }}>{item.gst_rate}%</span>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>+₹{itemGst.toFixed(1)}</p>
                            </td>
                            <td style={{ fontWeight: 600 }}>₹{itemTotal.toFixed(2)}</td>
                            <td style={{ textAlign: 'center', paddingRight: '1.5rem' }}>
                              <button
                                onClick={() => removeFromCart(item.product_id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  padding: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '4rem 2rem',
                  color: 'var(--text-secondary)',
                  gap: '0.75rem'
                }}>
                  <ShoppingBag size={36} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.85rem' }}>Billing cart is empty.</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Use the product search bar above to look up stock items and add them.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Customer Form & Totals Calculator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Customer Details Form */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} style={{ color: 'var(--primary)' }} />
              <span>Customer Details</span>
            </h2>

            <form onSubmit={handleCheckout}>
              {/* Customer Name */}
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                    required
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    style={{ paddingLeft: '2.25rem' }}
                    required
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Mode</label>
                <div style={{ position: 'relative' }}>
                  <CreditCard size={14} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <select
                    className="form-control"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Checkout Calculations Panel */}
          <div className="glass-panel" style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Billing Summary</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal (Excl. GST)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>CGST + SGST tax</span>
                <span style={{ color: 'var(--accent-cyan)' }}>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
                <span>Grand Total</span>
                <span style={{ color: '#fff' }}>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              disabled={loading || !cart.length}
            >
              <FileCheck size={18} />
              <span>{loading ? 'Creating Invoice...' : 'Generate Invoice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Printable Receipt Modal Popup */}
      {showReceipt && activeInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '2.5rem 1rem',
          cursor: 'pointer'
        }} className="modal-backdrop" onClick={() => setShowReceipt(false)}>
          <div style={{
            background: '#fff',
            color: '#000',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '82vh',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            cursor: 'default'
          }} className="printable-modal" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Actions (No Print) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              flexShrink: 0
            }} className="no-print">
              <span style={{ fontWeight: 600, color: 'var(--bg-primary)' }}>Receipt Preview</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handlePrint}
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button 
                  onClick={() => setShowReceipt(false)}
                  className="btn btn-secondary" 
                  style={{ 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.8rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.375rem', 
                    color: '#64748b',
                    borderColor: '#cbd5e1'
                  }}
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Pure Invoice layout (Printed Area) */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '2rem 1.5rem',
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '0.85rem',
              lineHeight: 1.4
            }} className="printable-area">
              
              {/* Receipt Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '1px' }}>SMART INVENTORY</h2>
                <p style={{ margin: '0.25rem 0', color: '#475569' }}>Tel: +91 9988776655</p>
                <div style={{ borderBottom: '2px dashed #000', margin: '1rem 0' }}></div>
              </div>

              {/* Bill Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <div><strong>Invoice:</strong> {activeInvoice.invoice.invoice_number}</div>
                <div style={{ textAlign: 'right' }}><strong>Date:</strong> {new Date(activeInvoice.invoice.created_at).toLocaleString('en-IN')}</div>
                <div><strong>Customer:</strong> {activeInvoice.invoice.customer_name}</div>
                <div style={{ textAlign: 'right' }}><strong>Phone:</strong> {activeInvoice.invoice.customer_phone}</div>
                <div><strong>Payment:</strong> {activeInvoice.invoice.payment_mode}</div>
                <div style={{ textAlign: 'right' }}><strong>Cashier:</strong> Admin</div>
              </div>

              <div style={{ borderBottom: '1px dashed #000', margin: '0.5rem 0' }}></div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', margin: '0.75rem 0' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #000' }}>
                    <th style={{ padding: '0.25rem 0' }}>Item SKU & Name</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'center' }}>GST</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activeInvoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #cbd5e1' }}>
                      <td style={{ padding: '0.5rem 0' }}>
                        <div>{item.product_name}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>₹{item.unit_price.toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'center' }}>{item.gst_rate}%</td>
                      <td style={{ textAlign: 'right' }}>₹{item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderBottom: '2px dashed #000', margin: '1rem 0' }}></div>

              {/* Totals split */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '220px', marginLeft: 'auto', textAlign: 'right', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal (Excl. GST):</span>
                  <span>₹{activeInvoice.invoice.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST + SGST tax:</span>
                  <span>₹{activeInvoice.invoice.gst_amount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', borderTop: '1px dashed #000', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                  <span>GRAND TOTAL:</span>
                  <span>₹{activeInvoice.invoice.grand_total.toFixed(2)}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px dashed #000', paddingTop: '1rem' }}>
                <p style={{ fontWeight: 700, margin: 0 }}>*** THANK YOU ***</p>
                <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.25rem 0' }}>Goods once sold cannot be returned.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Global CSS rules for printing invoice */}
      <style>{`
        /* Force high-contrast black text for receipt preview on screen */
        .printable-area,
        .printable-area h1,
        .printable-area h2,
        .printable-area h3,
        .printable-area h4,
        .printable-area p,
        .printable-area span,
        .printable-area td,
        .printable-area th,
        .printable-area div,
        .printable-area strong {
          color: #000000 !important;
        }

        @media print {
          /* Hide everything on page */
          body * {
            visibility: hidden !important;
          }
          /* Except the printable receipt content */
          .printable-area, .printable-area * {
            visibility: visible !important;
          }
          /* Align print receipt to top left corner of page */
          .printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
          }
          /* Hide parent modals/borders/scrollbars */
          .printable-modal {
            box-shadow: none !important;
            border: none !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }
          .modal-backdrop {
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @media (max-width: 1024px) {
          .pos-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Toasts */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default Billing;
