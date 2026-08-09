import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { productsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { Product } from '../../types';

const ProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.list({
        page, limit: 15,
        ...(search && { search }),
        ...(lowStockOnly && { lowStock: true }),
      });
      setProducts(res.data.data);
      setMeta(res.data.meta);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, lowStockOnly, showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout
      title="Products & Inventory"
      subtitle="Manage your product catalog and stock levels"
      actions={
        <div className="flex gap-3">
          <button id="add-product-btn" className="btn btn-primary" onClick={() => navigate('/products/new')}>
            + Add Product
          </button>
        </div>
      }
    >
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input id="product-search" type="text" className="form-input"
            placeholder="Search by name, SKU, category..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: 14, color: 'var(--color-text-secondary)' }}>
          <input
            id="low-stock-filter"
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
            style={{ width: 16, height: 16, accentColor: 'var(--color-red-500)' }}
          />
          Low Stock Only
        </label>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Stock</th>
                <th>Min Alert</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-container"><div className="spinner" /> Loading...</div></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="table-empty">
                    <div className="table-empty-icon">📦</div>
                    <p>No products found</p>
                  </div>
                </td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td><div style={{ fontWeight: 600 }}>{p.name}</div></td>
                    <td><code style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>{p.sku}</code></td>
                    <td><span className="badge badge-muted">{p.category}</span></td>
                    <td style={{ fontWeight: 600 }}>₹{Number(p.unitPrice).toLocaleString('en-IN')}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{
                          fontWeight: 700,
                          color: p.isLowStock ? 'var(--color-red-400)' : 'var(--color-emerald-400)',
                        }}>
                          {p.currentStock}
                        </span>
                        {p.isLowStock && <span className="badge badge-red">LOW</span>}
                      </div>
                    </td>
                    <td className="text-secondary">{p.minStockAlert}</td>
                    <td className="text-secondary fs-13">{p.location || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button id={`view-product-${p.id}`} className="btn btn-ghost btn-sm" onClick={() => navigate(`/products/${p.id}`)}>View</button>
                        <button id={`edit-product-${p.id}`} className="btn btn-outline btn-sm" onClick={() => navigate(`/products/${p.id}/edit`)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 0 && (
          <div className="pagination">
            <div className="pagination-info">Showing {products.length} of {meta.total} products</div>
            <div className="pagination-controls">
              <button id="prev-page" className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>←</button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                .map((p) => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
              <button id="next-page" className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages}>→</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductsListPage;
