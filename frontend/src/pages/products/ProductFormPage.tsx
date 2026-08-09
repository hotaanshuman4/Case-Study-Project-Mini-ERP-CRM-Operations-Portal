import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { productsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', sku: '', category: '', unitPrice: '',
    currentStock: '0', minStockAlert: '10', location: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.category.trim()) e.category = 'Category is required';
    if (!form.unitPrice || isNaN(Number(form.unitPrice)) || Number(form.unitPrice) < 0) e.unitPrice = 'Valid unit price is required';
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
      await productsApi.create({
        ...form,
        unitPrice: Number(form.unitPrice),
        currentStock: Number(form.currentStock),
        minStockAlert: Number(form.minStockAlert),
        sku: form.sku || undefined,
        location: form.location || undefined,
      });
      showToast('Product created successfully!', 'success');
      navigate('/products');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to create product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      title="Add Product"
      subtitle="Add a new product to the inventory"
      actions={<button className="btn btn-outline" onClick={() => navigate('/products')}>← Back</button>}
    >
      <div className="card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit} id="product-form">
          <div className="form-grid">
            <div className="form-group form-col-span-2">
              <label htmlFor="p-name" className="form-label required">Product Name</label>
              <input id="p-name" name="name" className="form-input" placeholder="e.g. Industrial Water Filter 10L"
                value={form.name} onChange={handleChange} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="p-sku" className="form-label">SKU / Code</label>
              <input id="p-sku" name="sku" className="form-input" placeholder="Auto-generated if empty"
                value={form.sku} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Leave blank to auto-generate</span>
            </div>

            <div className="form-group">
              <label htmlFor="p-category" className="form-label required">Category</label>
              <input id="p-category" name="category" className="form-input" placeholder="e.g. Pumps, Pipes, Valves"
                value={form.category} onChange={handleChange} />
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="p-price" className="form-label required">Unit Price (₹)</label>
              <input id="p-price" name="unitPrice" type="number" min="0" step="0.01" className="form-input"
                placeholder="0.00" value={form.unitPrice} onChange={handleChange} />
              {errors.unitPrice && <span className="form-error">{errors.unitPrice}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="p-stock" className="form-label">Opening Stock</label>
              <input id="p-stock" name="currentStock" type="number" min="0" className="form-input"
                placeholder="0" value={form.currentStock} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="p-min-stock" className="form-label">Min Stock Alert</label>
              <input id="p-min-stock" name="minStockAlert" type="number" min="0" className="form-input"
                placeholder="10" value={form.minStockAlert} onChange={handleChange} />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Alert when stock drops below this</span>
            </div>

            <div className="form-group">
              <label htmlFor="p-location" className="form-label">Location / Warehouse</label>
              <input id="p-location" name="location" className="form-input" placeholder="e.g. Warehouse A - Shelf 3"
                value={form.location} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/products')}>Cancel</button>
            <button id="submit-product" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : '✓ Add Product'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ProductFormPage;
