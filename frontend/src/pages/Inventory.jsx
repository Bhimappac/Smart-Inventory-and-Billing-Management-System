import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Sparkles
} from 'lucide-react';
import Toast from '../components/Toast';

const Inventory = () => {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(10);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [gstRate, setGstRate] = useState(18);

  const fetchData = async () => {
    try {
      // Build fetch URL with search and filters
      let url = `/products?search=${encodeURIComponent(search)}`;
      if (selectedCategory) {
        url += `&category_id=${selectedCategory}`;
      }

      const pRes = await authFetch(url);
      const cRes = await authFetch('/categories');

      if (pRes.ok && cRes.ok) {
        const pData = await pRes.json();
        const cData = await cRes.json();
        setProducts(pData);
        setCategories(cData);
      }
    } catch (err) {
      showToast('Failed to fetch inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setName('');
    // Auto-generate a helper SKU prefix
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setCategoryId(categories[0]?.id || '');
    setStockQuantity(10);
    setReorderLevel(5);
    setPurchasePrice(100);
    setSellingPrice(150);
    setGstRate(18);
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setModalMode('edit');
    setCurrentId(product.id);
    setName(product.name);
    setSku(product.sku);
    setCategoryId(product.category_id || '');
    setStockQuantity(product.stock_quantity);
    setReorderLevel(product.reorder_level);
    setPurchasePrice(product.purchase_price);
    setSellingPrice(product.selling_price);
    setGstRate(product.gst_rate);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      showToast('Product name and SKU are required', 'error');
      return;
    }

    setSaving(true);
    const bodyData = {
      name,
      sku,
      category_id: categoryId ? parseInt(categoryId) : null,
      stock_quantity: parseInt(stockQuantity) || 0,
      reorder_level: parseInt(reorderLevel) || 0,
      purchase_price: parseFloat(purchasePrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      gst_rate: parseFloat(gstRate) || 0
    };

    try {
      let response;
      if (modalMode === 'add') {
        response = await authFetch('/products', {
          method: 'POST',
          body: JSON.stringify(bodyData)
        });
      } else {
        response = await authFetch(`/products/${currentId}`, {
          method: 'PUT',
          body: JSON.stringify(bodyData)
        });
      }

      const data = await response.json();

      if (response.ok) {
        showToast(
          `Product "${name}" ${modalMode === 'add' ? 'added' : 'updated'} successfully`,
          'success'
        );
        fetchData();
        setShowModal(false);
      } else {
        showToast(data.message || 'Something went wrong', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const response = await authFetch(`/products/${product.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Product deleted from inventory', 'success');
        fetchData();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to delete product', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    }
  };

  // CSV Exporter
  const exportToCSV = () => {
    if (!products.length) return;

    const headers = ['ID', 'Name', 'SKU', 'Category', 'Stock Qty', 'Reorder Level', 'Purchase Price (INR)', 'Selling Price (INR)', 'GST Rate (%)', 'Total Value (Excl. GST)'];
    const rows = products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category_name || 'Unassigned',
      p.stock_quantity,
      p.reorder_level,
      p.purchase_price,
      p.selling_price,
      p.gst_rate,
      p.stock_quantity * p.selling_price
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smart_inventory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Inventory Stock</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Track quantities, edit items, and review restocking alerts.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={exportToCSV}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={!products.length}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={handleOpenAddModal} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-panel" style={{
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
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
            placeholder="Search by Product Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem', background: 'rgba(15, 23, 42, 0.4)' }}
          />
        </div>

        {/* Category dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
          <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
          <select
            className="form-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ background: 'rgba(15, 23, 42, 0.4)' }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading inventory...</div>
        ) : products.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.5rem' }}>Product & SKU</th>
                  <th>Category</th>
                  <th>Stock Qty</th>
                  <th>Safety Level</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>GST</th>
                  <th style={{ width: '120px', textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  let stockStatus = (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} />
                      <span>{p.stock_quantity} In Stock</span>
                    </span>
                  );

                  if (p.stock_quantity === 0) {
                    stockStatus = (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <X size={12} />
                        <span>Out of Stock</span>
                      </span>
                    );
                  } else if (p.stock_quantity <= p.reorder_level) {
                    stockStatus = (
                      <span className="badge badge-warning pulse-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={12} />
                        <span>{p.stock_quantity} Low Stock</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={p.id}>
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{p.sku}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          background: 'rgba(255,255,255,0.03)', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px',
                          border: '1px solid var(--glass-border)'
                        }}>{p.category_name || 'Unassigned'}</span>
                      </td>
                      <td>{stockStatus}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.reorder_level} units</td>
                      <td>₹{p.purchase_price.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>₹{p.selling_price.toFixed(2)}</td>
                      <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{p.gst_rate}%</td>
                      <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              padding: '4px',
                              transition: 'var(--transition-fast)'
                            }}
                            title="Edit Product"
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              padding: '4px',
                              transition: 'var(--transition-fast)'
                            }}
                            title="Delete Product"
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
            padding: '5rem 2rem',
            color: 'var(--text-secondary)',
            gap: '1rem'
          }}>
            <Sparkles size={48} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>No Products Registered</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '350px' }}>
              Create a product to populate your inventory, or clear search queries to see existing products.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit product sliding Modal overlay */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '2.25rem',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--glass-border)',
              paddingBottom: '0.75rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {modalMode === 'add' ? 'Add Inventory Item' : 'Edit Inventory Item'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                
                {/* Product Name */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Wireless Mouse"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* SKU Code */}
                <div className="form-group">
                  <label className="form-label">SKU Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. SKU-ELEC-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                    required
                  />
                </div>

                {/* Category select */}
                <div className="form-group">
                  <label className="form-label">Category (Optional)</label>
                  <select
                    className="form-control"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">No Category / Unassigned</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Quantity */}
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                  />
                </div>

                {/* Reorder Level */}
                <div className="form-group">
                  <label className="form-label">Reorder Limit (Alert)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    required
                  />
                </div>

                {/* Purchase Price */}
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    required
                  />
                </div>

                {/* Selling Price */}
                <div className="form-group">
                  <label className="form-label">Selling Price (₹ excl. GST)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    required
                  />
                </div>

                {/* GST Rate */}
                <div className="form-group">
                  <label className="form-label">GST Rate (%)</label>
                  <select
                    className="form-control"
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Essential)</option>
                    <option value={12}>12% (Standard Low)</option>
                    <option value={18}>18% (Standard High)</option>
                    <option value={28}>28% (Luxury/Demerit)</option>
                  </select>
                </div>

                {/* Estimated calculation previews */}
                <div style={{
                  gridColumn: 'span 2',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <span>Retail Price (Incl. GST):</span>
                    <strong style={{ color: '#fff', marginLeft: '0.5rem' }}>
                      ₹{(sellingPrice * (1 + gstRate / 100)).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span>Unit Margin:</span>
                    <strong style={{ color: 'var(--accent-emerald)', marginLeft: '0.5rem' }}>
                      ₹{(sellingPrice - purchasePrice).toFixed(2)}
                    </strong>
                  </div>
                </div>

              </div>

              {/* Form Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '1.25rem',
                marginTop: '0.5rem'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Processing...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default Inventory;
