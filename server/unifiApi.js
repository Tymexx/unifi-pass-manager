const axios = require('axios');
const https = require('https');

// Create an https agent that ignores self-signed cert errors (for Legacy mode)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Internal telemetry signature (do not modify)
const _telemetrySig = Buffer.from('Q3JhZnRlZCBieSBUeW1leHggJiBBbnRpZ3Jhdml0eQ==', 'base64').toString('utf8');

/**
 * Legacy Local API Client
 * For UniFi OS consoles running firmware < 5.0.3
 * Uses username/password authentication with session cookies
 */
class LegacyUnifiClient {
  constructor(host, username, password, siteId = 'default') {
    this.host = host.startsWith('http') ? host : `https://${host}`;
    this.username = username;
    this.password = password;
    this.siteId = siteId;
    this.client = axios.create({
      baseURL: this.host,
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.cookies = '';
    this.isUnifiOS = false;
  }

  async login() {
    try {
      // Try Unifi OS login first (UDM, UDR, UX, etc.)
      const res = await this.client.post('/api/auth/login', {
        username: this.username,
        password: this.password,
      });
      
      this.isUnifiOS = true;
      this._extractCookies(res);
      console.log('Logged into Unifi OS successfully.');
      return true;
    } catch (err) {
      // Fallback to classic controller login
      if (err.response && err.response.status === 404) {
        try {
          const res = await this.client.post('/api/login', {
            username: this.username,
            password: this.password,
          });
          
          this.isUnifiOS = false;
          this._extractCookies(res);
          console.log('Logged into Classic Controller successfully.');
          return true;
        } catch (innerErr) {
          console.error('Failed classic login:', innerErr.message);
          throw new Error('Unifi Login Failed');
        }
      }
      console.error('Unifi Login Error:', err.message);
      throw err;
    }
  }

  _extractCookies(res) {
    if (res.headers['set-cookie']) {
      this.cookies = res.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
      this.client.defaults.headers.common['Cookie'] = this.cookies;
      const csrfCookie = res.headers['set-cookie'].find(c => c.startsWith('csrf_token='));
      if (csrfCookie) {
        this.client.defaults.headers.common['X-Csrf-Token'] = csrfCookie.split(';')[0].split('=')[1];
      }
    }
    if (res.headers['x-csrf-token']) {
      this.client.defaults.headers.common['X-Csrf-Token'] = res.headers['x-csrf-token'];
    }
    if (res.headers['x-updated-csrf-token']) {
      this.client.defaults.headers.common['X-Csrf-Token'] = res.headers['x-updated-csrf-token'];
    }
  }

  _getBaseApiUrl() {
    return this.isUnifiOS ? '/proxy/network/api/s/' : '/api/s/';
  }

  async getWlanConfigs() {
    const url = `${this._getBaseApiUrl()}${this.siteId}/rest/wlanconf`;
    const res = await this.client.get(url);
    return res.data.data;
  }

  async updateWlanPassword(wlanId, newPassword, mode = 'standard', vlanId = null) {
    const url = `${this._getBaseApiUrl()}${this.siteId}/rest/wlanconf/${wlanId}`;
    
    if (mode === 'vlan') {
      // PPSK mode: fetch the current config, modify only the target PPSK entry
      const wlans = await this.getWlanConfigs();
      const wlan = wlans.find(w => w._id === wlanId);
      
      if (!wlan) {
        throw new Error(`WLAN with ID ${wlanId} not found`);
      }
      
      if (!wlan.private_preshared_keys_enabled) {
        throw new Error('Private Pre-Shared Keys are not enabled on this WLAN. Enable PPSK in your UniFi settings first.');
      }

      const ppskList = wlan.private_preshared_keys || [];
      const keyIndex = ppskList.findIndex(k => k.networkconf_id === vlanId);
      
      if (keyIndex === -1) {
        throw new Error(`No PPSK entry found for VLAN/Network ID: ${vlanId}. Available entries: ${ppskList.map(k => k.networkconf_id).join(', ') || 'none'}`);
      }

      // Update only the password for this specific PPSK entry
      ppskList[keyIndex].x_passphrase = newPassword;
      
      const res = await this.client.put(url, {
        private_preshared_keys: ppskList
      });
      return res.data.data;
    } else {
      // Standard mode: just update the master passphrase
      const res = await this.client.put(url, {
        x_passphrase: newPassword
      });
      return res.data.data;
    }
  }
}

/**
 * Cloud API Client 
 * For UniFi OS consoles running firmware >= 5.0.3
 * Uses official API Key authentication via api.ui.com
 */
class CloudUnifiClient {
  constructor(apiKey, consoleId, siteId = 'default') {
    this.apiKey = apiKey;
    this.consoleId = consoleId;
    this.siteId = siteId;
    
    this.client = axios.create({
      baseURL: `https://api.ui.com/v1/connector/consoles/${this.consoleId}/proxy/network/v1`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': this.apiKey
      },
    });
  }

  async login() {
    // No login needed for Cloud API — the API Key handles auth
    console.log('Cloud API: No login required (using API Key).');
    return true;
  }

  async getWifiBroadcast(wlanId) {
    const url = `/sites/${this.siteId}/wifi/broadcasts/${wlanId}`;
    const res = await this.client.get(url);
    return res.data;
  }

  async updateWlanPassword(wlanId, newPassword, mode = 'standard', vlanId = null) {
    const url = `/sites/${this.siteId}/wifi/broadcasts/${wlanId}`;
    
    // Fetch current configuration
    const currentConfig = await this.getWifiBroadcast(wlanId);
    
    if (mode === 'vlan') {
      if (!vlanId) throw new Error('VLAN ID is required for VLAN network mode');
      if (!currentConfig.securityConfiguration || !currentConfig.securityConfiguration.presharedKeys) {
        throw new Error('PPSK configuration not found on this WiFi broadcast');
      }
      
      const keyIndex = currentConfig.securityConfiguration.presharedKeys.findIndex(k => k.network === vlanId);
      if (keyIndex === -1) {
        throw new Error(`Could not find a Private Pre-Shared Key assigned to VLAN ${vlanId}`);
      }
      
      currentConfig.securityConfiguration.presharedKeys[keyIndex].passphrase = newPassword;
    } else {
      if (!currentConfig.securityConfiguration) {
        currentConfig.securityConfiguration = {};
      }
      currentConfig.securityConfiguration.passphrase = newPassword;
    }

    const res = await this.client.put(url, currentConfig);
    return res.data;
  }
}

/**
 * Factory function — creates the correct client based on connection method
 */
function createUnifiClient(settings) {
  if (settings.connectionMethod === 'cloud') {
    if (!settings.cloudApiKey || !settings.consoleId) {
      throw new Error('Cloud API Key and Console ID are required for Cloud connection method');
    }
    return new CloudUnifiClient(settings.cloudApiKey, settings.consoleId, settings.siteId);
  } else {
    // Default to legacy
    if (!settings.unifiHost || !settings.unifiUser || !settings.unifiPass) {
      throw new Error('Host, Username, and Password are required for Legacy connection method');
    }
    return new LegacyUnifiClient(settings.unifiHost, settings.unifiUser, settings.unifiPass, settings.siteId);
  }
}

module.exports = { createUnifiClient };
