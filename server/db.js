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
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    globalAdminEmail: '',
    webhookUrl: ''
  },
  networks: [
    {
      id: uuidv4(),
      name: 'Default Smart Network',
      mode: 'standard',
      wlanId: '',
      vlanId: '',
      ssidName: 'GuestNetwork',
      currentPassword: 'supersecretpassword123',
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
    }
  ],
  events: [],
  formConfig: {
    title: 'Guest Wi-Fi Booking',
    description: 'Schedule temporary, secure high-speed Wi-Fi access for your upcoming visit.',
    submitButtonText: 'Request Wi-Fi Access',
    fields: [
      { id: 'name', type: 'text', label: 'Your Name', placeholder: 'e.g. Sarah Jenkins', required: true, isSystem: true, locked: true },
      { id: 'email', type: 'email', label: 'Email Address', placeholder: 'Where to send access credentials', required: true, isSystem: true, locked: true },
      { id: 'phone', type: 'phone', label: 'Phone Number', placeholder: 'e.g. +44 7700 900077', required: false, isSystem: true, locked: false },
      { id: 'company', type: 'text', label: 'Company / Event', placeholder: 'e.g. Acme Studio / Client Presentation', required: false, isSystem: true, locked: false },
      { id: 'date', type: 'date', label: 'Visit Date', required: true, isSystem: true, locked: true },
      { id: 'time', type: 'time', label: 'Start Time', required: true, isSystem: true, locked: true },
      { id: 'duration', type: 'duration', label: 'Access Duration', required: true, isSystem: true, locked: true },
      { id: 'network', type: 'network_select', label: 'Preferred Network', required: false, isSystem: true, locked: false },
      { id: 'sendTiming', type: 'timing_select', label: 'When should your password be delivered?', required: true, isSystem: true, locked: false }
    ]
  }
};

const defaultFormConfig = defaultData.formConfig;

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

    // Ensure bookings array exists
    if (!data.bookings) {
      data.bookings = [];
      mutated = true;
    }

    // Ensure formConfig exists
    if (!data.formConfig || !Array.isArray(data.formConfig.fields)) {
      data.formConfig = defaultFormConfig;
      mutated = true;
    }

    // Migrate per-network password policy
    if (data.networks && Array.isArray(data.networks)) {
      data.networks.forEach(net => {
        if (!net.passwordPolicy) {
          net.passwordPolicy = {
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
          };
          mutated = true;
        }
      });
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
  const existingEvents = data.events || [];
  
  data.events = newEvents.map(e => {
    const existing = existingEvents.find(ex => ex.id === e.id) || {};
    return {
      ...e,
      id: e.id || uuidv4(),
      nextPreGeneratedPassword: e.nextPreGeneratedPassword !== undefined ? e.nextPreGeneratedPassword : existing.nextPreGeneratedPassword,
      emailSent: e.emailSent !== undefined ? e.emailSent : existing.emailSent
    };
  });
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

function getBookings() {
  return readDb().bookings || [];
}

function saveBookings(newBookings) {
  const data = readDb();
  data.bookings = newBookings.map(b => ({
    ...b,
    id: b.id || uuidv4()
  }));
  writeDb(data);
  return data.bookings;
}

function addBooking(booking) {
  const data = readDb();
  if (!data.bookings) data.bookings = [];
  const newBooking = {
    ...booking,
    id: booking.id || uuidv4(),
    status: booking.status || 'pending',
    createdAt: booking.createdAt || new Date().toISOString()
  };
  data.bookings.unshift(newBooking); // newest first
  writeDb(data);
  return newBooking;
}

function updateBooking(id, updates) {
  const data = readDb();
  if (!data.bookings) return null;
  const index = data.bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    data.bookings[index] = { ...data.bookings[index], ...updates };
    writeDb(data);
    return data.bookings[index];
  }
  return null;
}

function deleteBooking(id) {
  const data = readDb();
  if (data.bookings) {
    data.bookings = data.bookings.filter(b => b.id !== id);
    writeDb(data);
  }
}

function getFormConfig() {
  const db = readDb();
  return db.formConfig || defaultFormConfig;
}

function saveFormConfig(config) {
  const data = readDb();
  
  // Guarantee system locked fields are not removed
  const existingFields = (config && Array.isArray(config.fields)) ? config.fields : defaultFormConfig.fields;
  const lockedFieldIds = ['name', 'email', 'date', 'time', 'duration'];
  
  const currentFieldIds = existingFields.map(f => f.id);
  const verifiedFields = [...existingFields];
  
  for (const lockedId of lockedFieldIds) {
    if (!currentFieldIds.includes(lockedId)) {
      const defaultField = defaultFormConfig.fields.find(f => f.id === lockedId);
      if (defaultField) verifiedFields.push(defaultField);
    }
  }

  data.formConfig = {
    title: (config && config.title) || defaultFormConfig.title,
    description: (config && config.description !== undefined) ? config.description : defaultFormConfig.description,
    submitButtonText: (config && config.submitButtonText) || defaultFormConfig.submitButtonText,
    fields: verifiedFields
  };
  
  writeDb(data);
  return data.formConfig;
}

module.exports = {
  getSettings,
  saveSettings,
  getNetworks,
  saveNetworks,
  updateNetworkPassword,
  getEvents,
  saveEvents,
  deleteNetwork,
  getBookings,
  saveBookings,
  addBooking,
  updateBooking,
  deleteBooking,
  getFormConfig,
  saveFormConfig
};
