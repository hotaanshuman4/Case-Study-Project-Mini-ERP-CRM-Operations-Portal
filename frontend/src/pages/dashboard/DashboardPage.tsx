import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { customersApi, productsApi, challansApi } from '../../api/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Stats {
  customers: { total: number; byStatus: { status: string; _count: number }[] };
  products: { total: number; lowStockItems: number };
  challans: { total: number; totalRevenue: number; byStatus: { status: string; _count: number }[] };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [cust, prod, chall] = await Promise.all([
          customersApi.stats(),
          productsApi.stats(),
          challansApi.stats(),
        ]);
        setStats({
          customers: cust.data.data,
          products: prod.data.data,
          challans: chall.data.data,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeCustomers = stats?.customers.byStatus.find((s) => s.status === 'ACTIVE')?._count || 0;
  const confirmedChallans = stats?.challans.byStatus.find((s) => s.status === 'CONFIRMED')?._count || 0;
  const revenue = Number(stats?.challans.totalRevenue || 0);

  const customerStatusData = stats?.customers.byStatus.map((s) => ({
    name: s.status,
    value: s._count,
  })) || [];

  const challanStatusData = stats?.challans.byStatus.map((s) => ({
    name: s.status,
    value: s._count,
  })) || [];

  // Mock trend data for chart (in real system, this would be time-series data from API)
  const revenueData = [
    { month: 'Mar', revenue: 125000 },
    { month: 'Apr', revenue: 198000 },
    { month: 'May', revenue: 175000 },
    { month: 'Jun', revenue: 234000 },
    { month: 'Jul', revenue: 289000 },
    { month: 'Aug', revenue: revenue > 0 ? revenue : 312000 },
  ];

  return (
    <Layout title="Dashboard" subtitle="Operations Overview">
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span>Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="stat-grid">
            <div className="stat-card blue" id="stat-customers" onClick={() => navigate('/customers')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-header">
                <div className="stat-icon blue">👥</div>
              </div>
              <div className="stat-value">{stats?.customers.total || 0}</div>
              <div className="stat-label">Total Customers</div>
              <div className="stat-trend up">↑ {activeCustomers} Active</div>
            </div>

            <div className="stat-card emerald" id="stat-products" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-header">
                <div className="stat-icon emerald">📦</div>
              </div>
              <div className="stat-value">{stats?.products.total || 0}</div>
              <div className="stat-label">Products</div>
              {(stats?.products.lowStockItems || 0) > 0 && (
                <div className="stat-trend down">⚠️ {stats?.products.lowStockItems} Low Stock</div>
              )}
            </div>

            <div className="stat-card amber" id="stat-challans" onClick={() => navigate('/challans')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-header">
                <div className="stat-icon amber">📋</div>
              </div>
              <div className="stat-value">{stats?.challans.total || 0}</div>
              <div className="stat-label">Sales Challans</div>
              <div className="stat-trend up">↑ {confirmedChallans} Confirmed</div>
            </div>

            <div className="stat-card emerald" id="stat-revenue">
              <div className="stat-card-header">
                <div className="stat-icon emerald">💰</div>
              </div>
              <div className="stat-value">
                ₹{revenue >= 100000
                  ? `${(revenue / 100000).toFixed(1)}L`
                  : revenue >= 1000
                    ? `${(revenue / 1000).toFixed(1)}K`
                    : revenue.toFixed(0)
                }
              </div>
              <div className="stat-label">Confirmed Revenue</div>
              <div className="stat-trend up">↑ Confirmed orders</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            {/* Revenue Trend */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Revenue Trend</div>
                  <div className="card-subtitle">Last 6 months</div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ background: '#0D1526', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#F1F5F9' }}
                      formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2}
                      fill="url(#colorRevenue)" dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customer Status */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Customers</div>
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={customerStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={4} dataKey="value">
                      {customerStatusData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#F1F5F9' }} />
                    <Legend formatter={(v) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Challan Status */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Challans</div>
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={challanStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={4} dataKey="value">
                      {challanStatusData.map((_entry, index) => (
                        <Cell key={`cell-c-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#F1F5F9' }} />
                    <Legend formatter={(v) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Quick Actions</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
              {[
                { label: 'New Customer', icon: '👤', path: '/customers/new', color: 'btn-primary' },
                { label: 'Add Product', icon: '📦', path: '/products/new', color: 'btn-success' },
                { label: 'New Challan', icon: '📋', path: '/challans/new', color: 'btn-outline' },
                { label: 'Manage Users', icon: '🔐', path: '/users', color: 'btn-outline' },
              ].map((action) => (
                <button
                  key={action.path}
                  id={`quick-action-${action.label.toLowerCase().replace(/ /g, '-')}`}
                  className={`btn ${action.color}`}
                  onClick={() => navigate(action.path)}
                  style={{ justifyContent: 'center', padding: 'var(--space-4)' }}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default DashboardPage;
