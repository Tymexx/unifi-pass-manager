const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, 'data.json');

const defaultData = {
  settings: {
    connectionMethod: 'legacy',
    unifiHost: '192.168.1.1',
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
  },
  networks: [
    {
      id: uuidv4(),
      name: 'Default Smart Network',
      mode: 'standard',
      wlanId: '',
      vlanId: '',
      ssidName: 'GuestNetwork',
      currentPassword: 'supersecretpassword123'
    }
  ],
  events: []
};

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    writeDb(defaultData);
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    
    let mutated = false;

    // Ensure events array exists
    if (!data.events) {
      data.events = [];
      mutated = true;
    }

    // Migration from old schema (v1, v2)
    if (data.settings && data.settings.cronSchedule) {
      delete data.settings.cronSchedule;
      mutated = true;
    }
    
    // Clean up old schedule fields from networks to avoid bloat
    if (data.networks) {
      data.networks = data.networks.map(n => {
        if (n.scheduleType) {
          mutated = true;
          // We could auto-convert these to events here, but for simplicity we just drop them
          // since it was only a very brief intermediate schema
          delete n.scheduleType;
          delete n.scheduleTime;
          delete n.scheduleDate;
          delete n.scheduleDayOfWeek;
          delete n.scheduleDayOfMonth;
          delete n.scheduleMonth;
        }
        return n;
      });
    }

    if (mutated) {
      writeDb(data);
    }
    
    return data;
  } catch (err) {
    console.error('Error reading db:', err);
    return defaultData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db:', err);
  }
}

function getSettings() {
  return readDb().settings;
}

function saveSettings(newSettings) {
  const data = readDb();
  data.settings = { ...data.settings, ...newSettings };
  writeDb(data);
  return data.settings;
}

function getNetworks() {
  return readDb().networks || [];
}

function saveNetworks(newNetworks) {
  const data = readDb();
  data.networks = newNetworks.map(n => ({
    ...n,
    id: n.id || uuidv4()
  }));
  writeDb(data);
  return data.networks;
}

function updateNetworkPassword(networkId, newPassword) {
  const data = readDb();
  if (!data.networks) return;
  const network = data.networks.find(n => n.id === networkId);
  if (network) {
    network.currentPassword = newPassword;
    writeDb(data);
  }
}

function getEvents() {
  return readDb().events || [];
}

function saveEvents(newEvents) {
  const data = readDb();
  data.events = newEvents.map(e => ({
    ...e,
    id: e.id || uuidv4()
  }));
  writeDb(data);
  return data.events;
}

function deleteNetwork(id) {
  const data = readDb();
  if (data.networks) {
    data.networks = data.networks.filter(n => n.id !== id);
    writeDb(data);
  }
}

module.exports = {
  getSettings,
  saveSettings,
  getNetworks,
  saveNetworks,
  updateNetworkPassword,
  getEvents,
  saveEvents,
  deleteNetwork
};
