import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { usersApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { User, Role } from '../../types';

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: 'badge badge-red',
  SALES: 'badge badge-blue',
  WAREHOUSE: 'badge badge-amber',
  ACCOUNTS: 'badge badge-emerald',
};

const UsersPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SALES' });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ limit: 50 });
      setUsers(res.data.data);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      showToast('All fields are required', 'warning');
      return;
    }
    setCreating(true);
    try {
      await usersApi.create(form);
      showToast('User created!', 'success');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'SALES' });
      load();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to create user', 'error');
    } finally { setCreating(false); }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await usersApi.update(u.id, { isActive: !u.isActive });
      showToast(`User ${u.isActive ? 'deactivated' : 'activated'}`, 'success');
      load();
    } catch { showToast('Failed to update user', 'error'); }
  };

  return (
    <Layout
      title="User Management"
      subtitle="Manage team access and roles"
      actions={
        <button id="add-user-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
      }
    >
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="loading-container"><div className="spinner" /> Loading...</div></td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="text-secondary">{u.email}</td>
                  <td><span className={ROLE_BADGE[u.role as Role]}>{u.role}</span></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-emerald' : 'badge-muted'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="fs-12 text-secondary">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <button
                      id={`toggle-user-${u.id}`}
                      className={`btn btn-sm ${u.isActive ? 'btn-outline' : 'btn-success'}`}
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New User</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label htmlFor="u-name" className="form-label required">Full Name</label>
                    <input id="u-name" className="form-input" placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="u-email" className="form-label required">Email</label>
                    <input id="u-email" type="email" className="form-input" placeholder="user@company.com" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="u-password" className="form-label required">Password</label>
                    <input id="u-password" type="password" className="form-input" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="u-role" className="form-label required">Role</label>
                    <select id="u-role" className="form-select" value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                      <option value="SALES">Sales</option>
                      <option value="WAREHOUSE">Warehouse</option>
                      <option value="ACCOUNTS">Accounts</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="create-user-submit" type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UsersPage;
