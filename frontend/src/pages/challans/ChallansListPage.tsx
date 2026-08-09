import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { challansApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { Challan, ChallanStatus } from '../../types';

const STATUS_BADGE: Record<ChallanStatus, string> = {
  DRAFT: 'badge badge-amber',
  CONFIRMED: 'badge badge-emerald',
  CANCELLED: 'badge badge-red',
};

const ChallansListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await challansApi.list({
        page, limit: 15,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      setChallans(res.data.data);
      setMeta(res.data.meta);
    } catch {
      showToast('Failed to load challans', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout
      title="Sales Challans"
      subtitle="Manage sales orders and delivery challans"
      actions={
        <button id="new-challan-btn" className="btn btn-primary" onClick={() => navigate('/challans/new')}>
          + New Challan
        </button>
      }
    >
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input id="challan-search" type="text" className="form-input"
            placeholder="Search by challan # or customer..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select id="status-filter" className="form-select" style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><div className="loading-container"><div className="spinner" /> Loading...</div></td></tr>
              ) : challans.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="table-empty">
                    <div className="table-empty-icon">📋</div>
                    <p>No challans found</p>
                  </div>
                </td></tr>
              ) : (
                challans.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <code style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-blue-400)' }}>
                        {c.challanNumber}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.customer?.name}</div>
                      <div className="fs-12 text-secondary">{c.customer?.businessName}</div>
                    </td>
                    <td className="text-secondary">{c._count?.challanItems || 0} items</td>
                    <td style={{ fontWeight: 600 }}>{c.totalQuantity}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-emerald-400)' }}>
                      ₹{Number(c.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td><span className={STATUS_BADGE[c.status]}>{c.status}</span></td>
                    <td className="fs-12 text-secondary">
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="fs-13 text-secondary">{c.creator?.name}</td>
                    <td>
                      <button id={`view-challan-${c.id}`} className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/challans/${c.id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 0 && (
          <div className="pagination">
            <div className="pagination-info">Showing {challans.length} of {meta.total} challans</div>
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

export default ChallansListPage;
