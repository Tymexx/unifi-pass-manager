import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, Check, ExternalLink, Monitor } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

export default function KioskManager() {
  const [networks, setNetworks] = useState([]);
  const [themes, setThemes] = useState({});
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

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

  const handleCopy = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpen = (url) => {
    window.open(url, '_blank');
  };

  if (loading) return <div className="page-header"><p>Loading...</p></div>;

  return (
    <div className="kiosk-manager animate-in">
      <div className="page-header">
        <div>
          <h1>Kiosk Displays</h1>
          <p>Generate QR code displays for tablets or e-ink screens</p>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
        {networks.map(net => {
          const url = getKioskUrl(net.id);
          const currentTheme = themes[net.id] || 'dark';

          return (
            <div key={net.id} className="card">
              <div className="form-grid">
                <div>
                   <h3 className="card-title" style={{ margin: 0, marginBottom: '4px' }}>{net.name}</h3>
                   <span className="text-muted font-mono" style={{ fontSize: '0.8125rem' }}>SSID: {net.ssidName}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div className="segmented-control" style={{ maxWidth: '280px', width: '100%' }}>
                    <button 
                      type="button" 
                      className={`segmented-control-btn ${currentTheme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleThemeChange(net.id, 'dark')}
                    >
                      Dark (Tablets)
                    </button>
                    <button 
                      type="button" 
                      className={`segmented-control-btn ${currentTheme === 'eink' ? 'active' : ''}`}
                      onClick={() => handleThemeChange(net.id, 'eink')}
                    >
                      E-Ink (Contrast)
                    </button>
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label>Kiosk Display URL</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={url} 
                      readOnly 
                      className="font-mono text-muted"
                      style={{ cursor: 'text', flex: 1, minWidth: 0 }}
                    />
                    <div className="btn-group">
                      <button 
                        onClick={() => handleCopy(net.id, url)} 
                        className="btn btn-secondary btn-icon" 
                        title="Copy URL"
                      >
                        {copiedId === net.id ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                      </button>
                      <button 
                        onClick={() => handleOpen(url)} 
                        className="btn btn-primary btn-icon" 
                        title="Open Preview"
                      >
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
