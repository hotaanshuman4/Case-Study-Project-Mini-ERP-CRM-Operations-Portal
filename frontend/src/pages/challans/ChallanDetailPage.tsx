import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { challansApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Challan, ChallanStatus } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_BADGE: Record<ChallanStatus, string> = {
  DRAFT: 'badge badge-amber', CONFIRMED: 'badge badge-emerald', CANCELLED: 'badge badge-red',
};

const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadChallan = async () => {
    if (!id) return;
    try {
      const res = await challansApi.get(id);
      setChallan(res.data.data);
    } catch {
      showToast('Failed to load challan', 'error');
      navigate('/challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadChallan(); }, [id]);

  const handleConfirm = async () => {
    if (!id || !challan) return;
    setActionLoading(true);
    try {
      await challansApi.confirm(id);
      showToast('Challan confirmed! Stock has been deducted.', 'success');
      loadChallan();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to confirm challan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !window.confirm('Are you sure you want to cancel this challan?')) return;
    setActionLoading(true);
    try {
      await challansApi.cancel(id);
      showToast('Challan cancelled.', 'info');
      loadChallan();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to cancel challan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const exportPDF = () => {
    if (!challan) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('SALES CHALLAN', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Challan No: ${challan.challanNumber}`, 14, 32);
    doc.text(`Date: ${new Date(challan.createdAt).toLocaleDateString('en-IN')}`, 14, 39);
    doc.text(`Status: ${challan.status}`, 14, 46);

    // Customer info
    const snap = challan.customerSnapshot;
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text('Bill To:', 14, 58);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(snap.name, 14, 65);
    doc.text(snap.businessName, 14, 71);
    doc.text(snap.address, 14, 77);
    if (snap.gstNumber) doc.text(`GST: ${snap.gstNumber}`, 14, 83);

    // Items table
    autoTable(doc, {
      startY: 95,
      head: [['#', 'Product', 'SKU', 'Category', 'Qty', 'Unit Price', 'Total']],
      body: (challan.challanItems || []).map((item, idx) => [
        idx + 1,
        item.productSnapshot.name,
        item.productSnapshot.sku,
        item.productSnapshot.category,
        item.quantity,
        `Rs. ${Number(item.unitPrice).toLocaleString('en-IN')}`,
        `Rs. ${Number(item.totalPrice).toLocaleString('en-IN')}`,
      ]),
      foot: [['', '', '', '', challan.totalQuantity, 'TOTAL', `Rs. ${Number(challan.totalAmount).toLocaleString('en-IN')}`]],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: [20, 20, 20], fontStyle: 'bold' },
    });

    doc.save(`${challan.challanNumber}.pdf`);
    showToast('PDF exported!', 'success');
  };

  if (loading) {
    return <Layout title="Challan Detail"><div className="loading-container"><div className="spinner" /> Loading...</div></Layout>;
  }
  if (!challan) return null;

  const canConfirm = challan.status === 'DRAFT' && (user?.role === 'ADMIN' || user?.role === 'SALES');
  const canCancel = challan.status !== 'CANCELLED' && (user?.role === 'ADMIN' || user?.role === 'SALES');

  return (
    <Layout
      title={challan.challanNumber}
      subtitle={`Sales Challan — ${challan.status}`}
      actions={
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={() => navigate('/challans')}>← Back</button>
          <button id="export-pdf-btn" className="btn btn-outline" onClick={exportPDF}>📄 Export PDF</button>
          {canConfirm && (
            <button id="confirm-challan-btn" className="btn btn-success" onClick={handleConfirm} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : '✓ Confirm Challan'}
            </button>
          )}
          {canCancel && challan.status !== 'CANCELLED' && (
            <button id="cancel-challan-btn" className="btn btn-danger" onClick={handleCancel} disabled={actionLoading}>
              Cancel
            </button>
          )}
        </div>
      }
    >
      <div className="detail-grid">
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Customer Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Customer Details</div>
              <span className={STATUS_BADGE[challan.status]}>{challan.status}</span>
            </div>
            <div className="detail-fields-grid">
              <div className="detail-field">
                <div className="detail-field-label">Name</div>
                <div className="detail-field-value">{challan.customerSnapshot.name}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Business</div>
                <div className="detail-field-value">{challan.customerSnapshot.businessName}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Mobile</div>
                <div className="detail-field-value">{challan.customerSnapshot.mobile}</div>
              </div>
              {challan.customerSnapshot.gstNumber && (
                <div className="detail-field">
                  <div className="detail-field-label">GST Number</div>
                  <div className="detail-field-value" style={{ fontFamily: 'monospace' }}>{challan.customerSnapshot.gstNumber}</div>
                </div>
              )}
              <div className="detail-field" style={{ gridColumn: 'span 2' }}>
                <div className="detail-field-label">Address</div>
                <div className="detail-field-value">{challan.customerSnapshot.address}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: 'var(--space-5) var(--space-6)' }}>
              <div className="card-title">Line Items</div>
              <span className="badge badge-blue">{challan.challanItems?.length} items</span>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {challan.challanItems?.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.productSnapshot.name}</td>
                      <td><code style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>{item.productSnapshot.sku}</code></td>
                      <td><span className="badge badge-muted">{item.productSnapshot.category}</span></td>
                      <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                      <td>₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-emerald-400)' }}>₹{Number(item.totalPrice).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(13,21,38,0.6)' }}>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: 'var(--color-text-secondary)' }}>TOTAL</td>
                    <td style={{ fontWeight: 800 }}>{challan.totalQuantity}</td>
                    <td></td>
                    <td style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-emerald-400)' }}>
                      ₹{Number(challan.totalAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {challan.notes && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-3)' }}>Notes</div>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{challan.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Total Amount</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-emerald-400)' }}>
              ₹{Number(challan.totalAmount).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {challan.totalQuantity} units across {challan.challanItems?.length} items
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Challan Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { label: 'Challan #', value: challan.challanNumber },
                { label: 'Created by', value: challan.creator?.name || '—' },
                { label: 'Created', value: new Date(challan.createdAt).toLocaleString('en-IN') },
                { label: 'Last updated', value: new Date(challan.updatedAt).toLocaleString('en-IN') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-secondary fs-13">{label}</span>
                  <span className="fw-600 fs-13" style={{ fontFamily: label === 'Challan #' ? 'monospace' : 'inherit' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChallanDetailPage;
