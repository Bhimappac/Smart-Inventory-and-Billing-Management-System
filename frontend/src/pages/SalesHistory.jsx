import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Eye, 
  Calendar, 
  Printer, 
  X,
  History,
  AlertCircle
} from 'lucide-react';
import Toast from '../components/Toast';

const SalesHistory = () => {
  const { authFetch } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Invoice Detail Viewer State
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      const response = await authFetch(`/billing/invoices?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (err) {
      showToast('Failed to load transaction history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleOpenDetail = async (invoiceId) => {
    setDetailLoading(true);
    setShowDetail(true);
    setDetailData(null);
    try {
      const response = await authFetch(`/billing/invoices/${invoiceId}`);
      if (response.ok) {
        const data = await response.json();
        setDetailData(data); // Stores { invoice, items }
      } else {
        showToast('Failed to load invoice details', 'error');
        setShowDetail(false);
      }
    } catch (err) {
      showToast('Server error while loading details', 'error');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Sales History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>View past transactions, search customer records, and reprint billing receipts.</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
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
            placeholder="Search by Invoice #, Customer Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem', background: 'rgba(15, 23, 42, 0.4)' }}
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history...</div>
        ) : invoices.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.5rem' }}>Invoice Number</th>
                  <th>Date & Time</th>
                  <th>Customer Details</th>
                  <th>Excl. GST Subtotal</th>
                  <th>GST Tax Collected</th>
                  <th>Grand Total</th>
                  <th>Method</th>
                  <th style={{ width: '80px', textAlign: 'center', paddingRight: '1.5rem' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td style={{ paddingLeft: '1.5rem', fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                      {invoice.invoice_number}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={12} />
                        <span>{new Date(invoice.created_at).toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{invoice.customer_name}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ph: {invoice.customer_phone}</span>
                      </div>
                    </td>
                    <td>₹{invoice.subtotal.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-cyan)' }}>₹{invoice.gst_amount.toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>₹{invoice.grand_total.toFixed(2)}</td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.375rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>{invoice.payment_mode}</span>
                    </td>
                    <td style={{ textAlign: 'center', paddingRight: '1.5rem' }}>
                      <button
                        onClick={() => handleOpenDetail(invoice.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '4px',
                          transition: 'var(--transition-fast)'
                        }}
                        title="View Detailed Receipt"
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            color: 'var(--text-secondary)',
            gap: '1rem'
          }}>
            <History size={48} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>No Transactions Found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '350px' }}>
              We couldn't find any invoice matches. Clear your search or generate a bill to populate the log.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Receipt Detail Modal popup */}
      {showDetail && (
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
        }} className="modal-backdrop" onClick={() => setShowDetail(false)}>
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
              <span style={{ fontWeight: 600, color: 'var(--bg-primary)' }}>Receipt Copy</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handlePrint}
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  disabled={detailLoading || !detailData}
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button 
                  onClick={() => setShowDetail(false)}
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

            {/* Modal Loading State */}
            {detailLoading && (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontFamily: 'monospace' }}>
                Retrieving detailed transaction log...
              </div>
            )}

            {/* Pure Invoice layout (Printed Area) */}
            {!detailLoading && detailData && (
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
                  <div><strong>Invoice:</strong> {detailData.invoice.invoice_number}</div>
                  <div style={{ textAlign: 'right' }}><strong>Date:</strong> {new Date(detailData.invoice.created_at).toLocaleString('en-IN')}</div>
                  <div><strong>Customer:</strong> {detailData.invoice.customer_name}</div>
                  <div style={{ textAlign: 'right' }}><strong>Phone:</strong> {detailData.invoice.customer_phone}</div>
                  <div><strong>Payment:</strong> {detailData.invoice.payment_mode}</div>
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
                    {detailData.items.map((item, idx) => (
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
                    <span>₹{detailData.invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CGST + SGST tax:</span>
                    <span>₹{detailData.invoice.gst_amount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', borderTop: '1px dashed #000', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                    <span>GRAND TOTAL:</span>
                    <span>₹{detailData.invoice.grand_total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Receipt Footer */}
                <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px dashed #000', paddingTop: '1rem' }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>*** DUPLICATE COPY ***</p>
                  <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.25rem 0' }}>Goods once sold cannot be returned.</p>
                </div>

              </div>
            )}
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

export default SalesHistory;
