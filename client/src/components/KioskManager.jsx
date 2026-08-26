import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, ExternalLink, Monitor } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

export default function KioskManager() {
  const [networks, setNetworks] = useState([]);
  const [themes, setThemes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/networks`);
        setNetworks(res.data);
        const initialThemes = {};
        res.data.forEach(n => {
          initialThemes[n.id] = 'dark';
        });
        setThemes(initialThemes);
      } catch (error) {
        console.error('Error fetching networks', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNetworks();
  }, []);

  const handleThemeChange = (id, theme) => {
    setThemes(prev => ({ ...prev, [id]: theme }));
  };

  const getKioskUrl = (id) => {
    const theme = themes[id] || 'dark';
    return `${window.location.origin}/?kiosk=${id}&theme=${theme}`;
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
  };

  const handleOpen = (url) => {
    window.open(url, '_blank');
  };

  if (loading) return <div className="page-header"><p>Loading...</p></div>;

  return (
    <div className="kiosk-manager animate-in">
      <div className="page-header">
        <h1>Kiosk Displays</h1>
        <p>Generate QR code displays for tablets or e-ink screens</p>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
        {networks.map(net => {
          const url = getKioskUrl(net.id);
          return (
            <div key={net.id} className="card">
              <div className="form-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                   <h3 className="card-title">{net.name}</h3>
                   <p className="text-muted text-sm font-mono" style={{ marginBottom: '1rem' }}>SSID: {net.ssidName}</p>
                </div>
                
                <div className="form-group flex" style={{ alignItems: 'center', gap: '1rem' }}>
                  <label style={{ margin: 0 }}>Theme:</label>
                  <select 
                    value={themes[net.id] || 'dark'} 
                    onChange={(e) => handleThemeChange(net.id, e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="dark">Dark (Tablets)</option>
                    <option value="eink">E-Ink (High Contrast)</option>
                  </select>
                </div>
                
                <div className="form-group full-width" style={{ position: 'relative' }}>
                  <label>Kiosk URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={url} 
                      readOnly 
                      className="font-mono text-muted"
                      style={{ cursor: 'text', flex: 1, minWidth: 0 }}
                    />
                    <div className="btn-group">
                      <button onClick={() => handleCopy(url)} className="btn btn-secondary btn-icon" title="Copy URL">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleOpen(url)} className="btn btn-primary btn-icon" title="Open Preview">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {networks.length === 0 && (
           <div className="card text-center" style={{ padding: '3rem' }}>
             <Monitor size={48} className="text-muted mb-2" style={{ margin: '0 auto' }} />
             <p className="mb-2">No networks available to configure.</p>
           </div>
        )}
      </div>
    </div>
  );
}
