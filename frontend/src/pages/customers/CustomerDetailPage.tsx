import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { customersApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { Customer, CustomerFollowUp, CustomerStatus, CustomerType } from '../../types';

const STATUS_BADGE: Record<CustomerStatus, string> = {
  LEAD: 'badge badge-amber', ACTIVE: 'badge badge-emerald', INACTIVE: 'badge badge-muted',
};
const TYPE_BADGE: Record<CustomerType, string> = {
  RETAIL: 'badge badge-blue', WHOLESALE: 'badge badge-purple', DISTRIBUTOR: 'badge badge-amber',
};

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await customersApi.get(id);
        setCustomer(res.data.data);
        setFollowUps(res.data.data.followUps || []);
      } catch {
        showToast('Failed to load customer', 'error');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, showToast]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    setAddingNote(true);
    try {
      const res = await customersApi.addFollowUp(id, newNote.trim());
      setFollowUps((prev) => [res.data.data, ...prev]);
      setNewNote('');
      showToast('Follow-up note added!', 'success');
    } catch {
      showToast('Failed to add follow-up', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Customer Detail">
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </Layout>
    );
  }

  if (!customer) return null;

  return (
    <Layout
      title={customer.name}
      subtitle={customer.businessName}
      actions={
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={() => navigate('/customers')}>← Back</button>
          <button id="edit-customer-btn" className="btn btn-primary" onClick={() => navigate(`/customers/${id}/edit`)}>Edit</button>
        </div>
      }
    >
      <div className="detail-grid">
        {/* Main Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Customer Information</div>
              <div className="flex gap-2">
                <span className={TYPE_BADGE[customer.customerType]}>{customer.customerType}</span>
                <span className={STATUS_BADGE[customer.status]}>{customer.status}</span>
              </div>
            </div>
            <div className="detail-fields-grid">
              <div className="detail-field">
                <div className="detail-field-label">Full Name</div>
                <div className="detail-field-value">{customer.name}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Mobile</div>
                <div className="detail-field-value">{customer.mobile}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Email</div>
                <div className="detail-field-value">{customer.email || '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Business Name</div>
                <div className="detail-field-value">{customer.businessName}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">GST Number</div>
                <div className="detail-field-value" style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {customer.gstNumber || '—'}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Follow-up Date</div>
                <div className="detail-field-value">
                  {customer.followUpDate
                    ? new Date(customer.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'}
                </div>
              </div>
              <div className="detail-field" style={{ gridColumn: 'span 2' }}>
                <div className="detail-field-label">Address</div>
                <div className="detail-field-value">{customer.address}</div>
              </div>
              {customer.notes && (
                <div className="detail-field" style={{ gridColumn: 'span 2' }}>
                  <div className="detail-field-label">Notes</div>
                  <div className="detail-field-value" style={{ color: 'var(--color-text-secondary)' }}>{customer.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Follow-up Notes */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Follow-up Notes</div>
              <span className="badge badge-blue">{followUps.length}</span>
            </div>

            {/* Add note form */}
            <form onSubmit={handleAddNote} style={{ marginBottom: 'var(--space-5)' }}>
              <div className="form-group">
                <textarea
                  id="new-followup-note"
                  className="form-textarea"
                  placeholder="Add a follow-up note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <button id="add-followup-btn" type="submit" className="btn btn-primary btn-sm" disabled={addingNote || !newNote.trim()}>
                  {addingNote ? 'Adding...' : '+ Add Note'}
                </button>
              </div>
            </form>

            <div className="divider" />

            {followUps.length === 0 ? (
              <div className="table-empty" style={{ padding: 'var(--space-8)' }}>
                <div className="table-empty-icon">📝</div>
                <p>No follow-up notes yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {followUps.map((fu) => (
                  <div key={fu.id} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    borderLeft: '3px solid var(--color-blue-500)',
                  }}>
                    <p style={{ fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                      {fu.note}
                    </p>
                    <div className="flex items-center gap-3" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      <span>👤 {fu.creator?.name}</span>
                      <span>•</span>
                      <span>{new Date(fu.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Quick Stats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary fs-13">Total Challans</span>
                <span className="fw-700">{customer._count?.challans || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary fs-13">Follow-ups</span>
                <span className="fw-700">{followUps.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary fs-13">Created by</span>
                <span className="fw-600 fs-13">{customer.creator?.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary fs-13">Member since</span>
                <span className="fw-600 fs-13">{new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button className="btn btn-primary w-full" onClick={() => navigate('/challans/new')}>
                📋 Create Challan
              </button>
              <button className="btn btn-outline w-full" onClick={() => navigate('/challans')}>
                View Challans
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomerDetailPage;
