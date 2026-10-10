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
app.post('/api/settings/test-email', async (req, res) => {
  try {
    const settings = req.body;
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      return res.status(400).json({ success: false, error: 'Missing SMTP settings' });
    }
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort) || 587,
      secure: parseInt(settings.smtpPort) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass
      }
    });
    const from = settings.smtpFrom || settings.smtpUser;
    await transporter.sendMail({
      from: `"Bastion Test" <${from}>`,
      to: settings.globalAdminEmail || settings.smtpUser,
      subject: "Bastion: Test Email",
      text: "If you are reading this, your SMTP configuration is working perfectly!"
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
