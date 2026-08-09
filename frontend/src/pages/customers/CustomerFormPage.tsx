import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { customersApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const CustomerFormPage: React.FC<{ mode?: 'create' | 'edit' }> = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(mode === 'edit');

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', businessName: '',
    gstNumber: '', customerType: 'RETAIL', address: '',
    status: 'LEAD', followUpDate: '', notes: '',
  });

  // Load existing data for edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      customersApi.get(id).then((res) => {
        const c = res.data.data;
        setForm({
          name: c.name || '',
          mobile: c.mobile || '',
          email: c.email || '',
          businessName: c.businessName || '',
          gstNumber: c.gstNumber || '',
          customerType: c.customerType || 'RETAIL',
          address: c.address || '',
          status: c.status || 'LEAD',
          followUpDate: c.followUpDate ? c.followUpDate.split('T')[0] : '',
          notes: c.notes || '',
        });
      }).catch(() => {
        showToast('Failed to load customer data', 'error');
        navigate('/customers');
      }).finally(() => setDataLoading(false));
    }
  }, [mode, id, navigate, showToast]);



  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    if (!form.businessName.trim()) e.businessName = 'Business name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        followUpDate: form.followUpDate || undefined,
        email: form.email || undefined,
        gstNumber: form.gstNumber || undefined,
        notes: form.notes || undefined,
      };

      if (mode === 'edit' && id) {
        await customersApi.update(id, payload);
        showToast('Customer updated successfully!', 'success');
        navigate(`/customers/${id}`);
      } else {
        await customersApi.create(payload);
        showToast('Customer created successfully!', 'success');
        navigate('/customers');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} customer`, 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Layout
      title={mode === 'create' ? 'New Customer' : 'Edit Customer'}
      subtitle="Fill in the customer details below"
      actions={
        <button className="btn btn-outline" onClick={() => navigate('/customers')}>← Back</button>
      }
    >
      <div className="card" style={{ maxWidth: 800 }}>
        <form onSubmit={handleSubmit} id="customer-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label required">Full Name</label>
              <input id="name" name="name" className="form-input" placeholder="e.g. Amit Sharma"
                value={form.name} onChange={handleChange} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="mobile" className="form-label required">Mobile Number</label>
              <input id="mobile" name="mobile" className="form-input" placeholder="e.g. 9876543210"
                value={form.mobile} onChange={handleChange} />
              {errors.mobile && <span className="form-error">{errors.mobile}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input id="email" name="email" type="email" className="form-input" placeholder="email@company.com"
                value={form.email} onChange={handleChange} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="businessName" className="form-label required">Business Name</label>
              <input id="businessName" name="businessName" className="form-input" placeholder="Company / Business name"
                value={form.businessName} onChange={handleChange} />
              {errors.businessName && <span className="form-error">{errors.businessName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gstNumber" className="form-label">GST Number</label>
              <input id="gstNumber" name="gstNumber" className="form-input" placeholder="e.g. 27AAPFU0939F1ZV"
                value={form.gstNumber} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
            </div>

            <div className="form-group">
              <label htmlFor="customerType" className="form-label required">Customer Type</label>
              <select id="customerType" name="customerType" className="form-select"
                value={form.customerType} onChange={handleChange}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label required">Status</label>
              <select id="status" name="status" className="form-select"
                value={form.status} onChange={handleChange}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="followUpDate" className="form-label">Follow-up Date</label>
              <input id="followUpDate" name="followUpDate" type="date" className="form-input"
                value={form.followUpDate} onChange={handleChange} />
            </div>

            <div className="form-group form-col-span-2">
              <label htmlFor="address" className="form-label required">Address</label>
              <input id="address" name="address" className="form-input" placeholder="Full address including city and pincode"
                value={form.address} onChange={handleChange} />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </div>

            <div className="form-group form-col-span-2">
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea id="notes" name="notes" className="form-textarea" placeholder="Any notes about this customer..."
                value={form.notes} onChange={handleChange} rows={3} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/customers')}>Cancel</button>
            <button id="submit-customer" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : '✓ Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CustomerFormPage;
