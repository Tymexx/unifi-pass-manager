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
    siteId: 'default',
    passwordPolicy: {
      type: 'passphrase',
      wordCount: 3,
      separator: '-',
      capitalize: false,
      includeNumber: false,
      length: 14,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false
    }
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

  const handlePolicyChange = (name, value) => {
    setSettings({
      ...settings,
      passwordPolicy: {
        ...settings.passwordPolicy,
        [name]: value
      }
    });
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

        <div className="card mt-3">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Password Generator Policy</h2>
          
          <div className="form-group mb-3">
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                className={`btn ${settings.passwordPolicy?.type === 'password' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handlePolicyChange('type', 'password')}
                style={{ flex: 1 }}
              >
                Password
              </button>
              <button 
                type="button" 
                className={`btn ${settings.passwordPolicy?.type === 'passphrase' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handlePolicyChange('type', 'passphrase')}
                style={{ flex: 1 }}
              >
                Passphrase
              </button>
            </div>
          </div>

          <div className="form-grid">
            {settings.passwordPolicy?.type === 'passphrase' ? (
              <>
                <div className="form-group">
                  <label>Number of Words: {settings.passwordPolicy?.wordCount}</label>
                  <input 
                    type="range" 
                    min="3" max="20" 
                    value={settings.passwordPolicy?.wordCount} 
                    onChange={(e) => handlePolicyChange('wordCount', parseInt(e.target.value))} 
                  />
                </div>
                <div className="form-group">
                  <label>Word Separator</label>
                  <select 
                    value={settings.passwordPolicy?.separator} 
                    onChange={(e) => handlePolicyChange('separator', e.target.value)}
                  >
                    <option value="-">Hyphen (-)</option>
                    <option value=" ">Space ( )</option>
                    <option value=".">Period (.)</option>
                    <option value="_">Underscore (_)</option>
                    <option value=",">Comma (,)</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="capitalize" 
                    checked={settings.passwordPolicy?.capitalize} 
                    onChange={(e) => handlePolicyChange('capitalize', e.target.checked)} 
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="capitalize" style={{ margin: 0 }}>Capitalize Words</label>
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="includeNumber" 
                    checked={settings.passwordPolicy?.includeNumber} 
                    onChange={(e) => handlePolicyChange('includeNumber', e.target.checked)} 
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="includeNumber" style={{ margin: 0 }}>Include Number</label>
                </div>
              </>
            ) : (
              <>
                <div className="form-group full-width">
                  <label>Length: {settings.passwordPolicy?.length}</label>
                  <input 
                    type="range" 
                    min="5" max="64" 
                    value={settings.passwordPolicy?.length} 
                    onChange={(e) => handlePolicyChange('length', parseInt(e.target.value))} 
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="uppercase" 
                    checked={settings.passwordPolicy?.uppercase} 
                    onChange={(e) => handlePolicyChange('uppercase', e.target.checked)} 
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="uppercase" style={{ margin: 0 }}>A-Z (Uppercase)</label>
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="lowercase" 
                    checked={settings.passwordPolicy?.lowercase} 
                    onChange={(e) => handlePolicyChange('lowercase', e.target.checked)} 
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="lowercase" style={{ margin: 0 }}>a-z (Lowercase)</label>
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="numbers" 
                    checked={settings.passwordPolicy?.numbers} 
                    onChange={(e) => handlePolicyChange('numbers', e.target.checked)} 
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="numbers" style={{ margin: 0 }}>0-9 (Numbers)</label>
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="symbols" 
                    checked={settings.passwordPolicy?.symbols} 
                    onChange={(e) => handlePolicyChange('symbols', e.target.checked)} 
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="symbols" style={{ margin: 0 }}>!@#$% (Symbols)</label>
                </div>
              </>
            )}
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
