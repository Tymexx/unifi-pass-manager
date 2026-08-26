import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, RefreshCw, Wifi, X } from 'lucide-react';
import moment from 'moment';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

export default function Dashboard() {
  const [networks, setNetworks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [expandedQr, setExpandedQr] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [netRes, eventsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/networks`),
        axios.get(`${API_BASE}/api/events`)
      ]);
      setNetworks(netRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async (networkId) => {
    setRotating(true);
    try {
      await axios.post(`${API_BASE}/api/rotate`, { networkId });
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to rotate password:', error);
      alert('Failed to rotate password. See console for details.');
    } finally {
      setRotating(false);
    }
  };

  const handleCopy = (password) => {
    if (!password) return;
    navigator.clipboard.writeText(password);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="dashboard animate-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Overview of your Wi-Fi networks and passwords</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card card">
          <div className="stat-label">Total Networks</div>
          <div className="stat-value">{networks.length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">Next Rotation</div>
          <div className="stat-value">{events.length > 0 ? moment(events[0].start).fromNow() : 'No events'}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">Active Schedules</div>
          <div className="stat-value">{events.length}</div>
        </div>
      </div>

      {networks.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <Wifi size={48} className="text-muted mb-2" style={{ margin: '0 auto' }} />
          <p className="mb-2">No networks configured yet.</p>
          <Link to="/networks" className="btn btn-primary mt-2">Add Network</Link>
        </div>
      ) : (
        <div className="card-grid mt-3">
          {networks.map(net => {
            const wifiString = `WIFI:T:WPA;S:${net.ssidName};P:${net.currentPassword};;`;
            return (
              <div key={net.id} className="network-card card">
                <div className="network-header">
                  <div className="network-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`network-status ${net.enabled !== false ? 'online' : 'offline'}`}></span>
                    {net.name}
                  </div>
                  {net.currentPassword && (
                    <button 
                      className="mini-qr-btn" 
                      onClick={() => setExpandedQr(net.id)}
                      title="View QR Code"
                    >
                      <QRCodeSVG value={wifiString} size={20} />
                    </button>
                  )}
                </div>
                
                <div className="password-display">
                  {net.currentPassword || 'Not Set'}
                </div>
                
                <div className="flex-between mb-2">
                  <button onClick={() => handleCopy(net.currentPassword)} className="password-copy-btn">
                    <Copy size={16} /> Copy Password
                  </button>
                </div>
                
                <div className="network-footer">
                  <div className="network-meta" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Wifi size={16} /> <span>{net.ssidName}</span>
                  </div>
                  <button 
                    onClick={() => handleRotate(net.id)} 
                    className="btn btn-secondary btn-sm"
                    disabled={rotating}
                  >
                    <RefreshCw size={14} className={rotating ? 'animate-spin' : ''} /> 
                    Rotate Now
                  </button>
                </div>

                {expandedQr === net.id && (
                  <div className="card-qr-overlay" onClick={() => setExpandedQr(null)}>
                    <button className="card-qr-overlay-close" onClick={(e) => { e.stopPropagation(); setExpandedQr(null); }}>
                      <X size={16} />
                    </button>
                    <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }} onClick={e => e.stopPropagation()}>
                      <QRCodeSVG value={wifiString} size={160} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
