import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Check, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

export default function Networks() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [networkToDelete, setNetworkToDelete] = useState(null);

  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/networks`);
      setNetworks(res.data || []);
    } catch (error) {
      console.error('Error fetching networks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNetwork = () => {
    const newId = `temp_${Date.now()}`;
    setNetworks([
      ...networks,
      {
        id: newId,
        name: 'New Network',
        mode: 'standard',
        wlanId: '',
        vlanId: '',
        ssidName: '',
        currentPassword: ''
      }
    ]);
  };

  const handleRemove = (network) => {
    setNetworkToDelete(network);
  };

  const confirmRemove = async () => {
    if (!networkToDelete) return;
    
    try {
      await axios.delete(`${API_BASE}/api/networks/${networkToDelete.id}`);
    } catch (error) {
      console.error('Failed to delete network from server', error);
    }
    
    setNetworks(networks.filter(n => n.id !== networkToDelete.id));
    setNetworkToDelete(null);
  };

  const handleChange = (id, field, value) => {
    setNetworks(networks.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const handleSaveAll = async () => {
    try {
      await axios.post(`${API_BASE}/api/networks`, networks);
      setStatus('saved');
      setTimeout(() => setStatus(''), 3000);
      await fetchNetworks();
    } catch (error) {
      console.error('Error saving networks', error);
      setStatus('error');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  if (loading) return <div className="page-header"><p>Loading networks...</p></div>;

  return (
    <div className="networks-page animate-in">
      <div className="page-header flex-between mb-3">
        <div>
          <h1>Networks</h1>
          <p>Manage your UniFi networks and VLANs</p>
        </div>
        <div className="btn-group">
          <button onClick={handleAddNetwork} className="btn btn-secondary">
            <Plus size={16} /> Add Network
          </button>
          <button onClick={handleSaveAll} className="btn btn-primary">
            <Save size={16} /> Save All
          </button>
        </div>
      </div>
      
      {status === 'saved' && (
        <div className="badge badge-success mb-2" style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>
          <Check size={16} className="mr-2" style={{ marginRight: '0.5rem' }}/> Networks saved successfully!
        </div>
      )}
      {status === 'error' && (
        <div className="badge badge-danger mb-2" style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>
          <AlertCircle size={16} className="mr-2" style={{ marginRight: '0.5rem' }}/> Failed to save networks.
        </div>
      )}

      <div className="card-grid mt-2" style={{ gridTemplateColumns: '1fr' }}>
        {networks.map(net => (
          <div key={net.id} className="card relative">
            <div className="flex-between mb-2" style={{ alignItems: 'center' }}>
               <h3 className="card-title" style={{ margin: 0 }}>
                 {net.name ? net.name : 'Network Settings'}
               </h3>
               <button onClick={() => handleRemove(net)} className="btn btn-danger btn-sm btn-icon" title="Delete Network">
                 <Trash2 size={16} />
               </button>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={net.name || ''} 
                  onChange={(e) => handleChange(net.id, 'name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Mode</label>
                <select 
                  value={net.mode || 'standard'} 
                  onChange={(e) => handleChange(net.id, 'mode', e.target.value)}
                >
                  <option value="standard">Standard WLAN</option>
                  <option value="vlan">VLAN Password (PPSK)</option>
                </select>
              </div>
              <div className="form-group">
                <label>WiFi Broadcast ID (WLAN ID)</label>
                <input 
                  type="text" 
                  value={net.wlanId || ''} 
                  onChange={(e) => handleChange(net.id, 'wlanId', e.target.value)}
                />
              </div>
              {net.mode === 'vlan' && (
                <div className="form-group">
                  <label>VLAN ID</label>
                  <input 
                    type="text" 
                    value={net.vlanId || ''} 
                    onChange={(e) => handleChange(net.id, 'vlanId', e.target.value)}
                  />
                </div>
              )}
              <div className="form-group">
                <label>SSID Name</label>
                <input 
                  type="text" 
                  value={net.ssidName || ''} 
                  onChange={(e) => handleChange(net.id, 'ssidName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="text" 
                  value={net.currentPassword || ''} 
                  readOnly
                  className="text-muted"
                  style={{ cursor: 'not-allowed', opacity: 0.7 }}
                />
              </div>
              <div className="form-group full-width" style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '12px 16px', 
                backgroundColor: 'rgba(255,255,255,0.02)', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--card-border)' 
              }}>
                <div>
                  <label htmlFor={`hidden-${net.id}`} style={{ margin: 0, fontWeight: '500', cursor: 'pointer', display: 'block' }}>
                    Hide WiFi Name (Hidden Network)
                  </label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>QR codes will include the hidden network flag</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    id={`hidden-${net.id}`}
                    checked={net.isHidden || false}
                    onChange={(e) => handleChange(net.id, 'isHidden', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        ))}
        {networks.length === 0 && (
          <div className="text-center text-muted mt-3 py-10">
            No networks added yet. Click "Add Network" to get started.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {networkToDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', background: 'var(--card-bg)' }}>
            <h3 style={{ marginTop: 0 }}>Delete Smart Network?</h3>
            <p className="text-muted">Are you sure you want to remove <strong>{networkToDelete.name || 'this network'}</strong>? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setNetworkToDelete(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmRemove} className="btn btn-danger">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
