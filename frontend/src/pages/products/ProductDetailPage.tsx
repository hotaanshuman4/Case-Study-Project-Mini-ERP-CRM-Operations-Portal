import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { productsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { Product, StockMovement } from '../../types';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockQty, setStockQty] = useState('');
  const [stockReason, setStockReason] = useState('');
  const [addingStock, setAddingStock] = useState(false);

  const loadProduct = async () => {
    if (!id) return;
    try {
      const [pRes, mRes] = await Promise.all([
        productsApi.get(id),
        productsApi.getStockMovements(id, { limit: 20 }),
      ]);
      setProduct(pRes.data.data);
      setMovements(mRes.data.data);
    } catch {
      showToast('Failed to load product', 'error');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProduct(); }, [id]);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(stockQty);
    if (!qty || qty <= 0 || !id) return;
    setAddingStock(true);
    try {
      await productsApi.addStockIn(id, qty, stockReason || undefined);
      showToast(`Added ${qty} units to stock`, 'success');
      setStockQty('');
      setStockReason('');
      loadProduct(); // Refresh
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to add stock', 'error');
    } finally {
      setAddingStock(false);
    }
  };

  if (loading) {
    return <Layout title="Product Detail"><div className="loading-container"><div className="spinner" /> Loading...</div></Layout>;
  }
  if (!product) return null;

  return (
    <Layout
      title={product.name}
      subtitle={`SKU: ${product.sku}`}
      actions={
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={() => navigate('/products')}>← Back</button>
          <button id="edit-product-btn" className="btn btn-primary" onClick={() => navigate(`/products/${id}/edit`)}>Edit</button>
        </div>
      }
    >
      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Product Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Product Information</div>
              {product.isLowStock && <span className="badge badge-red">⚠️ LOW STOCK</span>}
            </div>
            <div className="detail-fields-grid">
              <div className="detail-field">
                <div className="detail-field-label">Name</div>
                <div className="detail-field-value">{product.name}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">SKU</div>
                <div className="detail-field-value" style={{ fontFamily: 'monospace' }}>{product.sku}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Category</div>
                <div className="detail-field-value">{product.category}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Unit Price</div>
                <div className="detail-field-value" style={{ color: 'var(--color-emerald-400)', fontWeight: 700 }}>
                  ₹{Number(product.unitPrice).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Current Stock</div>
                <div className="detail-field-value" style={{
                  fontSize: 24, fontWeight: 800,
                  color: product.isLowStock ? 'var(--color-red-400)' : 'var(--color-emerald-400)',
                }}>
                  {product.currentStock}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Min Stock Alert</div>
                <div className="detail-field-value">{product.minStockAlert}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Location</div>
                <div className="detail-field-value">{product.location || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Status</div>
                <div className="detail-field-value">
                  <span className={`badge ${product.isActive ? 'badge-emerald' : 'badge-red'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Movements */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Stock Movement Log</div>
              <span className="badge badge-blue">{movements.length} entries</span>
            </div>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Reason</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr><td colSpan={5}><div className="table-empty" style={{ padding: 'var(--space-6)' }}>No movements yet</div></td></tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id}>
                        <td className="fs-12 text-secondary">{new Date(m.createdAt).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`badge ${m.movementType === 'IN' ? 'badge-emerald' : 'badge-red'}`}>
                            {m.movementType === 'IN' ? '↑ IN' : '↓ OUT'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: m.movementType === 'IN' ? 'var(--color-emerald-400)' : 'var(--color-red-400)' }}>
                          {m.movementType === 'IN' ? '+' : '-'}{m.quantityChanged}
                        </td>
                        <td className="fs-13">{m.reason}</td>
                        <td className="fs-13 text-secondary">{m.creator?.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Add Stock */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add Stock (IN)</div>
            <form onSubmit={handleAddStock}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label htmlFor="stock-qty" className="form-label required">Quantity</label>
                  <input id="stock-qty" type="number" min="1" className="form-input"
                    placeholder="e.g. 50" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="stock-reason" className="form-label">Reason</label>
                  <input id="stock-reason" type="text" className="form-input"
                    placeholder="e.g. Purchase order received" value={stockReason}
                    onChange={(e) => setStockReason(e.target.value)} />
                </div>
                <button id="add-stock-btn" type="submit" className="btn btn-success w-full" disabled={addingStock || !stockQty}>
                  {addingStock ? 'Adding...' : '↑ Add Stock'}
                </button>
              </div>
            </form>
          </div>

          {/* Value Card */}
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>INVENTORY VALUE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-emerald-400)' }}>
              ₹{(product.currentStock * Number(product.unitPrice)).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {product.currentStock} units × ₹{Number(product.unitPrice).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
