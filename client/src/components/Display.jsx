import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, RefreshCw, ChevronDown } from 'lucide-react';
import axios from 'axios';

export default function Display() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');

  const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/networks`);
      const nets = res.data || [];
      setNetworks(nets);
      
      // If we don't have a selected ID but we have networks, select the first one
      if (nets.length > 0 && !selectedId) {
        setSelectedId(nets[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch networks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every minute in case it changes
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [selectedId]);

  if (loading && networks.length === 0) {
    return <div className="display-content"><RefreshCw className="animate-spin" size={48} color="var(--primary-color)" /></div>;
  }

  if (networks.length === 0) {
    return (
      <div className="display-content">
        <p style={{ color: 'var(--text-secondary)' }}>No smart networks configured yet. Go to Settings to add one.</p>
      </div>
    );
  }

  const selectedNetwork = networks.find(n => n.id === selectedId) || networks[0];
  
  // WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;;
  const qrValue = selectedNetwork.currentPassword 
    ? `WIFI:S:${selectedNetwork.ssidName};T:WPA;P:${selectedNetwork.currentPassword};;` 
    : '';

  return (
    <div className="display-content">
      
      {/* Dropdown Selector */}
      <div style={{ position: 'relative', minWidth: '300px' }}>
        <select 
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            width: '100%',
            padding: '1rem 3rem 1rem 1.5rem',
            appearance: 'none',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: '500',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          {networks.map(n => (
            <option key={n.id} value={n.id} style={{ background: '#0f172a' }}>
              {n.name}
            </option>
          ))}
        </select>
        <ChevronDown 
          style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} 
        />
      </div>

      <div className="password-container">
        <div className="password-label">Current Wi-Fi Password</div>
        <div className="password-value">{selectedNetwork.currentPassword || 'Not Set'}</div>
      </div>
      
      {selectedNetwork.currentPassword && (
        <div className="qr-container">
          <QRCodeSVG 
            value={qrValue} 
            size={256} 
            level="H" 
            includeMargin={true}
          />
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
        <Wifi size={20} />
        <span>Network: <strong>{selectedNetwork.ssidName || 'Not Set'}</strong></span>
      </div>
    </div>
  );
}
