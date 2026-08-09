import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { customersApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { Customer, CustomerStatus, CustomerType } from '../../types';

const STATUS_BADGE: Record<CustomerStatus, string> = {
  LEAD: 'badge badge-amber',
  ACTIVE: 'badge badge-emerald',
  INACTIVE: 'badge badge-muted',
};

const TYPE_BADGE: Record<CustomerType, string> = {
  RETAIL: 'badge badge-blue',
  WHOLESALE: 'badge badge-purple',
  DISTRIBUTOR: 'badge badge-amber',
};

const CustomersListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.list({
        page,
        limit: 15,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });
      setCustomers(res.data.data);
      setMeta(res.data.meta);
    } catch {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <Layout
      title="Customers"
      subtitle="Manage your customer relationships"
      actions={
        <button id="add-customer-btn" className="btn btn-primary" onClick={() => navigate('/customers/new')}>
          + New Customer
        </button>
      }
    >
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="customer-search"
            type="text"
            className="form-input"
            placeholder="Search by name, mobile, business..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <select
          id="status-filter"
          className="form-select"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select
          id="type-filter"
          className="form-select"
          style={{ width: 'auto', minWidth: 140 }}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Business</th>
                <th>Mobile</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="loading-container">
                      <div className="spinner" /> Loading...
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty">
                      <div className="table-empty-icon">👥</div>
                      <p>No customers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {c.email && <div className="fs-12 text-secondary truncate" style={{ maxWidth: 180 }}>{c.email}</div>}
                    </td>
                    <td>{c.businessName}</td>
                    <td>{c.mobile}</td>
                    <td><span className={TYPE_BADGE[c.customerType]}>{c.customerType}</span></td>
                    <td><span className={STATUS_BADGE[c.status]}>{c.status}</span></td>
                    <td>
                      {c.followUpDate
                        ? <span className="fs-13">{new Date(c.followUpDate).toLocaleDateString('en-IN')}</span>
                        : <span className="text-muted fs-13">—</span>
                      }
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          id={`view-customer-${c.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/customers/${c.id}`)}
                        >
                          View
                        </button>
                        <button
                          id={`edit-customer-${c.id}`}
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/customers/${c.id}/edit`)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {customers.length} of {meta.total} customers
            </div>
            <div className="pagination-controls">
              <button id="prev-page" className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>←</button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: 'var(--color-text-muted)' }}>…</span>}
                    <button className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  </React.Fragment>
                ))
              }
              <button id="next-page" className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages}>→</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CustomersListPage;
