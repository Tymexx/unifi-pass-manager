import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Wifi, Calendar, Monitor, Code2, Settings } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Poll pending bookings count
  useEffect(() => {
    let isMounted = true;
    async function checkPending() {
      try {
        const res = await axios.get(`${API_BASE}/api/bookings`);
        if (isMounted && res.data) {
          setPendingCount(res.data.pendingCount || 0);
        }
      } catch {
        // quiet fallback
      }
    }
    checkPending();
    const interval = setInterval(checkPending, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/networks', label: 'Networks', icon: Wifi },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/kiosk', label: 'Kiosk Displays', icon: Monitor },
    { path: '/bookings', label: 'Embed Creator', icon: Code2, badge: pendingCount },
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
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={22} />
                {item.badge > 0 && (
                  <span className="bottom-bar-badge">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
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
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="sidebar-link-badge">
                  {item.badge}
                </span>
              )}
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
