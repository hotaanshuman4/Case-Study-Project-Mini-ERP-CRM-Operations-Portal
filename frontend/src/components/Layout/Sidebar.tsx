import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  { path: '/customers', label: 'Customers', icon: '👥', roles: ['ADMIN', 'SALES'] },
  { path: '/products', label: 'Products', icon: '📦', roles: ['ADMIN', 'SALES', 'WAREHOUSE'] },
  { path: '/challans', label: 'Sales Challans', icon: '📋', roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { path: '/users', label: 'User Management', icon: '🔐', roles: ['ADMIN'] },
];

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'text-red',
  SALES: 'text-blue',
  WAREHOUSE: 'text-amber',
  ACCOUNTS: 'text-emerald',
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const filteredNav = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div>
          <div className="sidebar-logo-text">ERP Portal</div>
          <div className="sidebar-logo-sub">Operations System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Click to logout" role="button" tabIndex={0}>
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className={`sidebar-user-role ${user ? ROLE_COLORS[user.role] : ''}`}>
              {user?.role} · Sign Out
            </div>
          </div>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>→</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
