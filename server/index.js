const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { getSettings, saveSettings, getNetworks, saveNetworks, getEvents, saveEvents, deleteNetwork } = require('./db');
const { startScheduler, restartScheduler, rotatePasswords } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3050;

app.use(cors());
app.use(express.json());

// API: Get settings
app.get('/api/settings', (req, res) => {
  res.json({
    settings: getSettings(),
    networks: getNetworks(),
    events: getEvents()
  });
});

// API: Save global settings
app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  const updatedSettings = saveSettings(newSettings);
  
  // Restart scheduler in case cron schedule changed
  restartScheduler();
  
  res.json(updatedSettings);
});

// API: Save networks
app.post('/api/networks', (req, res) => {
  const newNetworks = req.body;
  const updatedNetworks = saveNetworks(newNetworks);
  restartScheduler(); // Networks might affect schedule
  res.json(updatedNetworks);
});

// API: Get all networks (for Display component)
app.get('/api/networks', (req, res) => {
  res.json(getNetworks());
});

// API: Delete a network
app.delete('/api/networks/:id', (req, res) => {
  deleteNetwork(req.params.id);
  restartScheduler(); // Removing a network might affect schedule
  res.json({ success: true });
});

// API: Get all events
app.get('/api/events', (req, res) => {
  res.json(getEvents());
});

// API: Save events
app.post('/api/events', (req, res) => {
  const newEvents = req.body;
  const updatedEvents = saveEvents(newEvents);
  restartScheduler(); // Reload scheduler with new events
  res.json(updatedEvents);
});

// API: Manual password rotation for all networks
app.post('/api/rotate', async (req, res) => {
  try {
    const results = await rotatePasswords();
    if (results && results.length > 0) {
      const anySuccess = results.some(r => r.success);
      if (!anySuccess) {
        return res.status(500).json({ success: false, message: results[0].error });
      }
      res.json({ success: true, results });
    } else {
      res.status(400).json({ success: false, message: 'Settings or Networks incomplete' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.match(/\.[^/]+$/)) {
    return next(); // Let it 404 for API or files (like .js, .css)
  }
  res.sendFile('index.html', { root: path.join(__dirname, '../client/dist') });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  // Start the scheduler on boot
  startScheduler();
});
