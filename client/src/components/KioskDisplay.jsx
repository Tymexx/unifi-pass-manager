import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, RefreshCw, Eye, X } from 'lucide-react';
import axios from 'axios';

export default function KioskDisplay({ networkId, theme }) {
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/networks`);
      const nets = res.data || [];
      const target = nets.find(n => n.id === networkId);
      
      if (target) {
        setNetwork(target);
        setError('');
      } else {
        setError('Network not found');
      }
    } catch (err) {
      console.error('Failed to fetch networks', err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds to automatically update the kiosk when passwords rotate
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [networkId]);

  const isEink = theme === 'eink';

  // Styling maps based on theme
  const containerStyle = isEink ? {
    backgroundColor: 'white',
    color: 'black',
    fontFamily: 'monospace, sans-serif',
  } : {
    backgroundColor: 'var(--bg)',
    color: 'var(--text-primary)',
  };

  if (loading && !network) {
    return (
      <div className="kiosk-container" style={containerStyle}>
        <RefreshCw className="animate-spin" size={64} color={isEink ? 'black' : 'var(--primary)'} />
      </div>
    );
  }

  if (error || !network) {
    return (
      <div className="kiosk-container" style={containerStyle}>
        <h1 style={{ fontSize: '2rem' }}>{error || 'Network Error'}</h1>
      </div>
    );
  }

  // WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;;
  const qrValue = network.currentPassword 
    ? `WIFI:S:${network.ssidName};T:WPA;P:${network.currentPassword};;` 
    : '';

  return (
    <>
      <div className="kiosk-container" style={containerStyle}>
        <div className="kiosk-text-section">
          <div className="kiosk-text-wrapper">
            <div style={{
              fontSize: '1.5rem',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              color: isEink ? '#333' : 'var(--text-muted)',
              marginBottom: '1rem'
            }}>
              {network.name} Wi-Fi
            </div>
            
            <button 
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '1.2rem',
                padding: '1rem 2rem',
                margin: '1rem auto'
              }}
              onClick={() => setShowPassphrase(true)}
            >
              <Eye size={24} /> View Passphrase
            </button>
          </div>
        </div>

        {network.currentPassword && (
          <div className="kiosk-qr-section">
            <div className="kiosk-qr-box" style={isEink ? {
              borderRadius: '0',
              boxShadow: 'none',
              border: '8px solid black'
            } : {
              borderRadius: 'var(--radius-card)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid var(--card-border)'
            }}>
              <QRCodeSVG 
                value={qrValue} 
                level="M" 
                includeMargin={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {showPassphrase && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          backgroundColor: isEink ? 'white' : 'var(--bg)',
          color: isEink ? 'black' : 'var(--text-primary)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem'
        }}>
          <button 
            onClick={() => setShowPassphrase(false)}
            style={{ 
              position: 'absolute', top: '2rem', right: '2rem', 
              background: isEink ? 'rgba(0,0,0,0.1)' : 'var(--card-bg)', 
              border: isEink ? 'none' : '1px solid var(--card-border)', 
              color: 'inherit', 
              cursor: 'pointer', borderRadius: '50%', width: '64px', height: '64px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={32} />
          </button>
          
          <h1 style={{ 
            fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '4px', 
            marginBottom: '4rem', color: isEink ? '#333' : 'var(--text-muted)'
          }}>
            {network.name} Wi-Fi
          </h1>
          
          <div style={{
            fontSize: 'clamp(1rem, 7.5vw, 6rem)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center',
            width: '100%',
            maxWidth: '100%',
            color: isEink ? 'black' : 'var(--primary)'
          }}>
            {network.currentPassword}
          </div>
        </div>
      )}
    </>
  );
}
