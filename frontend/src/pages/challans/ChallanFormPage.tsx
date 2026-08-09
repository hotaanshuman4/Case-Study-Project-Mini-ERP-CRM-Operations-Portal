import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { challansApi, customersApi, productsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { Customer, Product, ChallanFormItem } from '../../types';

const ChallanFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState<ChallanFormItem[]>([{ productId: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          customersApi.list({ limit: 200 }),
          productsApi.list({ limit: 200 }),
        ]);
        setCustomers(custRes.data.data);
        setProducts(prodRes.data.data);
      } catch {
        showToast('Failed to load data', 'error');
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ChallanFormItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === 'productId') {
        const product = products.find((p) => p.id === value);
        next[idx] = { ...next[idx], productId: value as string, product };
      } else {
        next[idx] = { ...next[idx], [field]: value };
      }
      return next;
    });
  };

  const getTotalQty = () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const getTotalAmount = () => items.reduce((sum, i) => {
    const product = products.find((p) => p.id === i.productId);
    return sum + (Number(i.quantity) || 0) * Number(product?.unitPrice || 0);
  }, 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedCustomer) e.customer = 'Please select a customer';
    if (items.some((i) => !i.productId)) e.items = 'Please select a product for each row';
    if (items.some((i) => !i.quantity || Number(i.quantity) < 1)) e.items = 'Quantity must be at least 1';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await challansApi.create({
        customerId: selectedCustomer,
        items: items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
        notes: notes || undefined,
        status,
      });
      showToast(`Challan ${res.data.data.challanNumber} created!`, 'success');
      navigate(`/challans/${res.data.data.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to create challan', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return <Layout title="New Challan"><div className="loading-container"><div className="spinner" /> Loading...</div></Layout>;
  }

  return (
    <Layout
      title="New Sales Challan"
      subtitle="Create a sales delivery challan"
      actions={<button className="btn btn-outline" onClick={() => navigate('/challans')}>← Back</button>}
    >
      <form onSubmit={handleSubmit} id="challan-form">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Main Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Customer Selection */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Customer</div>
              <div className="form-group">
                <label htmlFor="challan-customer" className="form-label required">Select Customer</label>
                <select
                  id="challan-customer"
                  className="form-select"
                  value={selectedCustomer}
                  onChange={(e) => { setSelectedCustomer(e.target.value); setErrors((p) => ({ ...p, customer: '' })); }}
                >
                  <option value="">— Choose a customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.businessName}</option>
                  ))}
                </select>
                {errors.customer && <span className="form-error">{errors.customer}</span>}
              </div>

              {/* Show selected customer details */}
              {selectedCustomer && (() => {
                const c = customers.find((x) => x.id === selectedCustomer);
                if (!c) return null;
                return (
                  <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 13 }}>
                    <div className="flex gap-4">
                      <div><span className="text-muted">Mobile: </span><span>{c.mobile}</span></div>
                      {c.gstNumber && <div><span className="text-muted">GST: </span><span style={{ fontFamily: 'monospace' }}>{c.gstNumber}</span></div>}
                    </div>
                    <div className="mt-2"><span className="text-muted">Address: </span><span>{c.address}</span></div>
                  </div>
                );
              })()}
            </div>

            {/* Products */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Products</div>
              </div>

              {errors.items && <div className="form-error" style={{ marginBottom: 'var(--space-3)' }}>{errors.items}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 36px', gap: 'var(--space-3)', padding: '0 var(--space-2)' }}>
                  <span className="fs-12 text-muted fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</span>
                  <span className="fs-12 text-muted fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</span>
                  <span className="fs-12 text-muted fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</span>
                  <span></span>
                </div>

                {items.map((item, idx) => {
                  const product = products.find((p) => p.id === item.productId);
                  const lineTotal = Number(item.quantity) * Number(product?.unitPrice || 0);
                  return (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 36px', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div>
                        <select
                          id={`item-product-${idx}`}
                          className="form-select"
                          value={item.productId}
                          onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                          style={{ marginBottom: product ? 4 : 0 }}
                        >
                          <option value="">Select product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id} disabled={items.some((i, i2) => i.productId === p.id && i2 !== idx)}>
                              {p.name} (Stock: {p.currentStock})
                            </option>
                          ))}
                        </select>
                        {product && (
                          <div className="fs-12 text-secondary">
                            SKU: {product.sku} · ₹{Number(product.unitPrice).toLocaleString('en-IN')}/unit
                            {product.isLowStock && <span className="badge badge-red" style={{ marginLeft: 6 }}>LOW</span>}
                          </div>
                        )}
                      </div>
                      <input
                        id={`item-qty-${idx}`}
                        type="number"
                        min="1"
                        max={product?.currentStock}
                        className="form-input"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />
                      <div style={{ fontWeight: 700, color: 'var(--color-emerald-400)', fontSize: 14 }}>
                        {lineTotal > 0 ? `₹${lineTotal.toLocaleString('en-IN')}` : '—'}
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        style={{ color: 'var(--color-red-400)' }}
                        aria-label="Remove item"
                        id={`remove-item-${idx}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                <button type="button" className="add-product-btn" onClick={addItem} id="add-product-row">
                  + Add Another Product
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Notes (Optional)</div>
              <textarea
                id="challan-notes"
                className="form-textarea"
                placeholder="Any delivery instructions or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Summary Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'sticky', top: 'calc(var(--topbar-height) + var(--space-4))' }}>
            <div className="card" style={{ borderColor: 'rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.05)' }}>
              <div className="card-title" style={{ marginBottom: 'var(--space-5)' }}>Order Summary</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="flex justify-between">
                  <span className="text-secondary">Items</span>
                  <span className="fw-600">{items.filter((i) => i.productId).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Total Qty</span>
                  <span className="fw-700">{getTotalQty()}</span>
                </div>
                <div className="divider" />
                <div className="flex justify-between">
                  <span className="text-secondary">Total Amount</span>
                  <span className="fw-800" style={{ fontSize: 20, color: 'var(--color-emerald-400)' }}>
                    ₹{getTotalAmount().toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Save As</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: `2px solid ${status === 'DRAFT' ? 'var(--color-amber-500)' : 'var(--color-border)'}`, transition: 'all var(--transition-fast)', background: status === 'DRAFT' ? 'var(--color-amber-glow)' : 'transparent' }}>
                  <input type="radio" name="status" value="DRAFT" checked={status === 'DRAFT'} onChange={() => setStatus('DRAFT')} style={{ accentColor: 'var(--color-amber-500)' }} id="status-draft" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Draft</div>
                    <div className="fs-12 text-secondary">Save for later, no stock deducted</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: `2px solid ${status === 'CONFIRMED' ? 'var(--color-emerald-500)' : 'var(--color-border)'}`, transition: 'all var(--transition-fast)', background: status === 'CONFIRMED' ? 'var(--color-emerald-glow)' : 'transparent' }}>
                  <input type="radio" name="status" value="CONFIRMED" checked={status === 'CONFIRMED'} onChange={() => setStatus('CONFIRMED')} style={{ accentColor: 'var(--color-emerald-500)' }} id="status-confirmed" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Confirmed</div>
                    <div className="fs-12 text-secondary">Stock will be deducted immediately</div>
                  </div>
                </label>
              </div>
            </div>

            <button id="submit-challan" type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18 }} /> Creating...</>
              ) : (
                `Create ${status === 'CONFIRMED' ? 'Confirmed' : 'Draft'} Challan`
              )}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
};

export default ChallanFormPage;
