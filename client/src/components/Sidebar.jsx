import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wifi, Calendar, Monitor, Settings, Shield } from 'lucide-react';

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
              <Icon size={24} />
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
        <Shield className="text-primary" size={28} color="var(--primary)" />
        <h2 style={{ marginLeft: '10px' }}>PassCycle</h2>
      </div>
      <div className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path ? 'active' : '';
          return (
            <Link key={item.path} to={item.path} className={`sidebar-link ${active}`}>
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <p className="text-muted">Beta v0.1</p>
      </div>
    </div>
  );
}
