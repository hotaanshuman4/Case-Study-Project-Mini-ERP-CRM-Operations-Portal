import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, actions }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1>{title}</h1>
              <span className="badge badge-emerald" style={{ textTransform: 'none', fontSize: 11, padding: '2px 8px' }}>
                ● Operational
              </span>
            </div>
            {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
          </div>
          <div className="topbar-actions">
            {actions}
          </div>
        </header>

        {/* Page content */}
        <div className="page-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
