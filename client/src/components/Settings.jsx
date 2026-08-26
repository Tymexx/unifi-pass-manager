import { useState, useEffect } from 'react';
import { Save, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
  const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

  const [settings, setSettings] = useState({
    connectionMethod: 'legacy',
    unifiHost: '',
    unifiUser: '',
    unifiPass: '',
    cloudApiKey: '',
    consoleId: '',
    siteId: 'default'
  });
  
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/settings`);
        setSettings(prev => ({ ...prev, ...res.data.settings }));
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/settings`, settings);
      setStatus('saved');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error('Failed to save', err);
      setStatus('error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your UniFi connection</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Connection Method</label>
              <select 
                name="connectionMethod" 
                value={settings.connectionMethod || 'legacy'} 
                onChange={handleSettingChange}
              >
                <option value="legacy">Legacy Local API (Firmware &lt; 5.0.3)</option>
                <option value="cloud">Official Cloud API (Firmware ≥ 5.0.3)</option>
              </select>
            </div>

            {(settings.connectionMethod || 'legacy') === 'legacy' ? (
              <>
                <div className="form-group full-width">
                  <label>Unifi Controller Host (IP or Domain)</label>
                  <input 
                    type="text" 
                    name="unifiHost" 
                    value={settings.unifiHost || ''} 
                    onChange={handleSettingChange} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    name="unifiUser" 
                    value={settings.unifiUser || ''} 
                    onChange={handleSettingChange} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    name="unifiPass" 
                    value={settings.unifiPass || ''} 
                    onChange={handleSettingChange} 
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group full-width">
                  <label>UniFi Cloud API Key</label>
                  <input 
                    type="password" 
                    name="cloudApiKey" 
                    value={settings.cloudApiKey || ''} 
                    onChange={handleSettingChange} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Console ID</label>
                  <input 
                    type="text" 
                    name="consoleId" 
                    value={settings.consoleId || ''} 
                    onChange={handleSettingChange} 
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Site ID</label>
              <input 
                type="text" 
                name="siteId" 
                value={settings.siteId || 'default'} 
                onChange={handleSettingChange} 
                required 
              />
            </div>
          </div>
        </div>

        <div className="form-group full-width" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary">
            <Save size={20} style={{ marginRight: '0.5rem' }} /> Save Settings
          </button>
          
          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {status === 'saved' ? <Check color="var(--success, #10b981)" /> : <AlertCircle color="var(--danger, #ef4444)" />}
              {status === 'saved' ? 'Settings saved successfully' : 'Error saving settings'}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
