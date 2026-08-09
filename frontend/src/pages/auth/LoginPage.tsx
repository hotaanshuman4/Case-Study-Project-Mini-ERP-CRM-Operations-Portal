import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter email and password', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Login successful! Welcome back.', 'success');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@erp.com', password: 'Admin@123' },
      sales: { email: 'sales@erp.com', password: 'Sales@123' },
      warehouse: { email: 'warehouse@erp.com', password: 'Warehouse@123' },
      accounts: { email: 'accounts@erp.com', password: 'Accounts@123' },
    };
    const c = creds[role];
    if (c) { setEmail(c.email); setPassword(c.password); }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">⚡</div>
          <h1 className="login-title">ERP/CRM Portal</h1>
          <p className="login-subtitle">Sign in to the Operations System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" id="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label required">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label required">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--color-text-muted)', cursor: 'pointer',
                  fontSize: 16,
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                Signing in...
              </>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="login-demo-creds">
          <strong>🧪 Demo Credentials — Click to fill:</strong>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {['admin', 'sales', 'warehouse', 'accounts'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => fillDemo(role)}
                className="btn btn-outline btn-sm"
                style={{ textTransform: 'capitalize', fontSize: 11 }}
                id={`demo-${role}`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
