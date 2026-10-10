import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wifi, Calendar, Monitor, Settings } from 'lucide-react';

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/networks', label: 'Networks', icon: Wifi },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/kiosk', label: 'Kiosk Displays', icon: Monitor },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  if (isMobile) {
    return (
      <div className="bottom-bar animate-in">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path ? 'active' : '';
          return (
            <Link key={item.path} to={item.path} className={`bottom-bar-link ${active}`}>
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="sidebar animate-in">
      <div className="sidebar-header">
        <img src="/bastion-logo-v2.svg" alt="Bastion" width={26} height={26} />
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Bastion</h2>
      </div>
      <div className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path ? 'active' : '';
          return (
            <Link key={item.path} to={item.path} className={`sidebar-link ${active}`}>
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <div className="version-badge">
          <span className="version-tag">v{__APP_VERSION__}</span>
          <span className="build-tag">({__BUILD_HASH__})</span>
        </div>
      </div>
    </div>
  );
}
