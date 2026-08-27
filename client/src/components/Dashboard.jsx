import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, RefreshCw, Wifi, X, Check } from 'lucide-react';
import moment from 'moment';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

function getNextOccurrence(evt) {
  let nextOccurrence = null;
  if (evt.type === 'one-off' && evt.date && evt.time) {
    nextOccurrence = moment(`${evt.date} ${evt.time}`, 'YYYY-MM-DD HH:mm');
  } else if (evt.type === 'recurring') {
    const [hour, minute] = (evt.time || '00:00').split(':');
    let current = moment();
    
    for (let i = 0; i < 365; i++) {
      let match = false;
      if (evt.recurringType === 'daily') {
        match = true;
      } else if (evt.recurringType === 'weekly' && current.day() === parseInt(evt.dayOfWeek)) {
        match = true;
      } else if (evt.recurringType === 'monthly' && current.date() === parseInt(evt.dayOfMonth)) {
        match = true;
      } else if (evt.recurringType === 'yearly' && current.month() === parseInt(evt.month) && current.date() === parseInt(evt.dayOfMonth)) {
        match = true;
      }
      
      if (match) {
        const candidate = current.clone().hour(hour).minute(minute).second(0);
        if (candidate.isAfter(moment())) {
          nextOccurrence = candidate;
          break;
        }
      }
      current.add(1, 'days');
    }
  }
  return nextOccurrence && nextOccurrence.isAfter(moment()) ? nextOccurrence : null;
}

const ScramblingPassword = ({ isScrambling, password }) => {
  const [displayText, setDisplayText] = useState(password || 'Not Set');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  const targetPassword = password || 'Not Set';
  
  useEffect(() => {
    let interval;
    let lockedCount = 0;
    const targetLength = targetPassword.length;
    
    if (isScrambling) {
      interval = setInterval(() => {
        let scrambled = '';
        for (let i = 0; i < targetLength; i++) {
          scrambled += chars[Math.floor(Math.random() * chars.length)];
        }
        setDisplayText(scrambled);
      }, 50);
    } else {
      interval = setInterval(() => {
        if (lockedCount >= targetLength) {
          clearInterval(interval);
          setDisplayText(targetPassword);
          return;
        }
        
        let currentText = targetPassword.substring(0, lockedCount);
        for (let i = lockedCount; i < targetLength; i++) {
          currentText += chars[Math.floor(Math.random() * chars.length)];
        }
        setDisplayText(currentText);
        lockedCount++;
      }, 60); // Speed of character lock-in
    }
    
    return () => clearInterval(interval);
  }, [isScrambling, targetPassword]);

  return <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>{displayText}</span>;
};

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!targetDate) return;
    
    const calculateTimeLeft = () => {
      const now = moment();
      const diff = moment.duration(targetDate.diff(now));
      if (diff.asMilliseconds() <= 0) {
        setTimeLeft('00:00:00');
        return false;
      }
      
      const d = Math.floor(diff.asDays());
      const h = diff.hours();
      const m = diff.minutes();
      const s = diff.seconds();
      
      let str = '';
      if (d > 0) {
        str += `${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else {
        str += `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      setTimeLeft(str);
      return true;
    };
    
    calculateTimeLeft();
    
    const interval = setInterval(() => {
      if (!calculateTimeLeft()) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return <span>No schedule</span>;
  return <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{timeLeft}</span>;
};

export default function Dashboard() {
  const [networks, setNetworks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rotationStatus, setRotationStatus] = useState({});
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
    setRotationStatus(prev => ({ ...prev, [networkId]: 'loading' }));
    try {
      await axios.post(`${API_BASE}/api/rotate`, { networkId });
      await fetchData(); // Refresh data
      setRotationStatus(prev => ({ ...prev, [networkId]: 'success' }));
      
      // Revert back to ready state after 3 seconds
      setTimeout(() => {
        setRotationStatus(prev => ({ ...prev, [networkId]: null }));
      }, 3000);
    } catch (error) {
      console.error('Failed to rotate password:', error);
      setRotationStatus(prev => ({ ...prev, [networkId]: 'error' }));
      
      // Revert back after error
      setTimeout(() => {
        setRotationStatus(prev => ({ ...prev, [networkId]: null }));
      }, 3000);
      alert('Failed to rotate password. See console for details.');
    }
  };

  const handleCopy = (password) => {
    if (!password) return;
    navigator.clipboard.writeText(password);
  };

  const getNextRotationText = () => {
    if (!events || events.length === 0) return 'No schedules';
    let closestMoment = null;
    events.forEach(evt => {
      const nextOcc = getNextOccurrence(evt);
      if (nextOcc) {
        if (!closestMoment || nextOcc.isBefore(closestMoment)) {
          closestMoment = nextOcc;
        }
      }
    });
    return closestMoment ? closestMoment.fromNow() : 'No upcoming schedules';
  };

  const getNetworkCountdownMoment = (networkId) => {
    const netEvents = events.filter(e => e.networkId === networkId);
    if (!netEvents || netEvents.length === 0) return null;
    
    let closestMoment = null;
    netEvents.forEach(evt => {
      const nextOcc = getNextOccurrence(evt);
      if (nextOcc) {
        if (!closestMoment || nextOcc.isBefore(closestMoment)) {
          closestMoment = nextOcc;
        }
      }
    });
    return closestMoment;
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
          <div className="stat-value">{getNextRotationText()}</div>
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
            const wifiString = `WIFI:T:WPA;S:${net.ssidName};P:${net.currentPassword};${net.isHidden ? 'H:true;' : ''};`;
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
                  <ScramblingPassword isScrambling={rotationStatus[net.id] === 'loading'} password={net.currentPassword} />
                </div>
                
                <div className="flex-between mb-2">
                  <button onClick={() => handleCopy(net.currentPassword)} className="password-copy-btn">
                    <Copy size={16} /> Copy Password
                  </button>
                  <span className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getNetworkCountdownMoment(net.id) ? (
                      <>
                        <span>Next:</span> <CountdownTimer targetDate={getNetworkCountdownMoment(net.id)} />
                      </>
                    ) : 'No active schedule'}
                  </span>
                </div>
                
                <div className="network-footer">
                  <div className="network-meta" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Wifi size={16} /> <span>{net.ssidName}</span>
                  </div>
                  <button 
                    onClick={() => handleRotate(net.id)} 
                    className={`btn btn-sm ${rotationStatus[net.id] === 'success' ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={rotationStatus[net.id] === 'loading' || rotationStatus[net.id] === 'success'}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    {rotationStatus[net.id] === 'loading' ? (
                      <><RefreshCw size={14} className="animate-spin" /> Rotating...</>
                    ) : rotationStatus[net.id] === 'success' ? (
                      <><Check size={14} /> Success</>
                    ) : (
                      <><RefreshCw size={14} /> Rotate Now</>
                    )}
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
