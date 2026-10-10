import { useState, useEffect } from 'react';
import { Save, Check, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [testingEmail, setTestingEmail] = useState(false);

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

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await axios.post(`${API_BASE}/api/settings/test-email`, settings);
      if (res.data.success) {
        alert("Test email sent successfully! Check your inbox.");
      } else {
        alert("Error: " + res.data.error);
      }
    } catch (err) {
      alert("Error sending test email: " + (err.response?.data?.error || err.message));
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="settings-page animate-in">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure your UniFi connection, alerts, and notification services</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* UniFi Connection Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">UniFi Console Connection</h2>
              <p className="card-subtitle">Authenticate with your UniFi Dream Machine or Express controller</p>
            </div>
          </div>
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
                  <label>UniFi Controller Host (IP or Domain)</label>
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

        {/* SMTP Email Notifications Card */}
        <div className="card mt-4">
          <div className="card-header flex-between">
            <div>
              <h2 className="card-title">Email Notifications (SMTP)</h2>
              <p className="card-subtitle">Configure outbound mail server for automated alerts</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="email" 
                placeholder="Send test to..." 
                value={settings.testEmailRecipient || ''} 
                onChange={(e) => setSettings({...settings, testEmailRecipient: e.target.value})}
                style={{ width: '220px', height: '32px', fontSize: '0.8125rem' }}
              />
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={handleTestEmail}
                disabled={testingEmail}
              >
                {testingEmail ? (
                  <><RefreshCw size={13} className="animate-spin" /> Sending...</>
                ) : 'Test Connection'}
              </button>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>SMTP Host</label>
              <input type="text" name="smtpHost" value={settings.smtpHost || ''} onChange={handleSettingChange} placeholder="mail.smtp2go.com" />
            </div>
            <div className="form-group">
              <label>SMTP Port</label>
              <input type="text" name="smtpPort" value={settings.smtpPort || ''} onChange={handleSettingChange} placeholder="2525 or 587" />
            </div>
            <div className="form-group">
              <label>From Address</label>
              <input type="text" name="smtpFrom" value={settings.smtpFrom || ''} onChange={handleSettingChange} placeholder="Bastion@directconnect.global" />
            </div>
            <div className="form-group">
              <label>SMTP Username</label>
              <input type="text" name="smtpUser" value={settings.smtpUser || ''} onChange={handleSettingChange} />
            </div>
            <div className="form-group">
              <label>SMTP Password</label>
              <input type="password" name="smtpPass" value={settings.smtpPass || ''} onChange={handleSettingChange} />
            </div>
          </div>
        </div>

        {/* Global Notifications Card */}
        <div className="card mt-4">
          <div className="card-header">
            <div>
              <h2 className="card-title">Global Notifications</h2>
              <p className="card-subtitle">Broadcast password rotations to external channels and admin inboxes</p>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Webhook URL (Discord, Slack, ntfy.sh)</label>
              <input 
                type="text" 
                name="webhookUrl" 
                value={settings.webhookUrl || ''} 
                onChange={handleSettingChange} 
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="form-group full-width">
              <label>Global Admin Email (Receives all password rotation alerts)</label>
              <input type="text" name="globalAdminEmail" value={settings.globalAdminEmail || ''} onChange={handleSettingChange} placeholder="admin@directconnect.global" />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="mt-4 flex-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Settings
            </button>
            
            {status && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                {status === 'saved' ? (
                  <><Check size={16} color="var(--success)" /> <span style={{ color: 'var(--success)' }}>Settings saved</span></>
                ) : (
                  <><AlertCircle size={16} color="var(--danger)" /> <span style={{ color: 'var(--danger)' }}>Error saving settings</span></>
                )}
              </div>
            )}
          </div>

          <div className="version-badge">
            <span className="version-tag">Bastion v{__APP_VERSION__}</span>
            <span className="build-tag">• build {__BUILD_HASH__}</span>
          </div>
        </div>
      </form>
    </div>
  );
}
