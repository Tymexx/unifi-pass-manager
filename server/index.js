const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { 
  getSettings, saveSettings, 
  getNetworks, saveNetworks, 
  getEvents, saveEvents, deleteNetwork,
  getBookings, saveBookings, addBooking, updateBooking, deleteBooking,
  getFormConfig, saveFormConfig
} = require('./db');
const { startScheduler, restartScheduler, rotatePasswords } = require('./scheduler');
const { 
  sendBookingReceivedCustomerEmail, 
  sendBookingAdminAlertEmail, 
  sendBookingApprovedEmail 
} = require('./notifications');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3050;

app.use(cors());
app.use(express.json());

// API: Version & Health
app.get('/api/version', (req, res) => {
  res.json({
    version: require('./package.json').version || '1.0.0',
    status: 'online'
  });
});

// API: Get settings
app.get('/api/settings', (req, res) => {
  res.json({
    settings: getSettings(),
    networks: getNetworks(),
    events: getEvents()
  });
});

// API: Test Email
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
      to: settings.testEmailRecipient || settings.globalAdminEmail || settings.smtpUser,
      subject: "Bastion: Test Email",
      text: "If you are reading this, your SMTP configuration is working perfectly!"
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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

// API: Get sanitized networks for public embed form (no passwords exposed)
app.get('/api/public/networks', (req, res) => {
  try {
    const publicNetworks = getNetworks()
      .filter(n => n.enabled !== false)
      .map(n => ({
        id: n.id,
        name: n.name,
        ssidName: n.ssidName || n.name
      }));
    res.json(publicNetworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    const { networkId } = req.body;
    const results = await rotatePasswords(networkId);
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

// API: Public form configuration for embed widget
app.get('/api/public/form-config', (req, res) => {
  try {
    res.json(getFormConfig());
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get form configuration (admin)
app.get('/api/form-config', (req, res) => {
  try {
    res.json(getFormConfig());
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Save form configuration (admin)
app.post('/api/form-config', (req, res) => {
  try {
    const updated = saveFormConfig(req.body);
    res.json({ success: true, formConfig: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get all bookings & pending count
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = getBookings();
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    res.json({ bookings, pendingCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Submit a new booking request (Customer Embed Form)
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      date,
      time,
      durationHours,
      durationMinutes,
      requestedNetworkId,
      requestedNetworkName,
      sendTiming,
      customFields
    } = req.body;

    if (!name || !email || !date || !time) {
      return res.status(400).json({ success: false, error: 'Name, email, date, and time are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const booking = addBooking({
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      company: (company || '').trim(),
      date,
      time,
      durationHours: parseInt(durationHours, 10) || 1,
      durationMinutes: parseInt(durationMinutes, 10) || 0,
      requestedNetworkId: requestedNetworkId || 'any',
      requestedNetworkName: requestedNetworkName || 'Any / Auto-Assign',
      sendTiming: sendTiming || '1h',
      customFields: customFields || {},
      status: 'pending'
    });

    // Send thank-you / under-review receipt to customer
    sendBookingReceivedCustomerEmail(booking)
      .catch(err => console.error('Booking customer email error:', err.message));

    // Send instant alert email to administrator
    sendBookingAdminAlertEmail(booking)
      .catch(err => console.error('Booking admin alert email error:', err.message));

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Failed to create booking:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Approve a booking request
app.post('/api/bookings/:id/approve', async (req, res) => {
  try {
    const { assignedNetworkId } = req.body;
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    const networks = getNetworks();
    let targetNetwork = networks.find(n => n.id === assignedNetworkId);
    if (!targetNetwork && booking.requestedNetworkId && booking.requestedNetworkId !== 'any') {
      targetNetwork = networks.find(n => n.id === booking.requestedNetworkId);
    }
    if (!targetNetwork) {
      targetNetwork = networks[0];
    }

    if (!targetNetwork) {
      return res.status(400).json({ success: false, error: 'No Wi-Fi networks available to assign.' });
    }

    // Update booking state
    const updatedBooking = updateBooking(booking.id, {
      status: 'approved',
      assignedNetworkId: targetNetwork.id,
      assignedNetworkName: targetNetwork.name,
      approvedAt: new Date().toISOString()
    });

    // Compute pre-send delivery timing for scheduler (Option B)
    let sendTimingConfig = 'standard';
    let emailSendDate = null;
    let emailSendTime = null;

    if (booking.sendTiming === '1h' || booking.sendTiming === '24h') {
      const offsetHours = booking.sendTiming === '24h' ? 24 : 1;
      const [hour, minute] = booking.time.split(':').map(Number);
      const [year, month, day] = booking.date.split('-').map(Number);
      const startDateTime = new Date(year, month - 1, day, hour, minute, 0);
      const preSendDateTime = new Date(startDateTime.getTime() - offsetHours * 60 * 60 * 1000);

      if (preSendDateTime > new Date()) {
        sendTimingConfig = 'custom';
        const pYear = preSendDateTime.getFullYear();
        const pMonth = String(preSendDateTime.getMonth() + 1).padStart(2, '0');
        const pDay = String(preSendDateTime.getDate()).padStart(2, '0');
        const pHour = String(preSendDateTime.getHours()).padStart(2, '0');
        const pMin = String(preSendDateTime.getMinutes()).padStart(2, '0');
        emailSendDate = `${pYear}-${pMonth}-${pDay}`;
        emailSendTime = `${pHour}:${pMin}`;
      }
    }

    // Provision scheduled calendar event
    const newEvent = {
      id: uuidv4(),
      title: `Guest Access: ${booking.company || booking.name}`,
      networkId: targetNetwork.id,
      type: 'one-off',
      date: booking.date,
      time: booking.time,
      revokeAccess: true,
      revokeHours: parseInt(booking.durationHours || 1, 10),
      revokeMinutes: parseInt(booking.durationMinutes || 0, 10),
      clientEmails: booking.email,
      sendTiming: sendTimingConfig,
      emailSendDate: emailSendDate,
      emailSendTime: emailSendTime,
      bookingId: booking.id
    };

    const currentEvents = getEvents();
    saveEvents([...currentEvents, newEvent]);
    restartScheduler();

    // Send Option B approval confirmation email to customer
    sendBookingApprovedEmail(updatedBooking, targetNetwork.ssidName || targetNetwork.name)
      .catch(err => console.error('Booking approval email error:', err.message));

    res.json({ success: true, booking: updatedBooking, event: newEvent });
  } catch (err) {
    console.error('Failed to approve booking:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Reject a booking request
app.post('/api/bookings/:id/reject', (req, res) => {
  try {
    const { reason } = req.body;
    const updatedBooking = updateBooking(req.params.id, {
      status: 'rejected',
      rejectReason: reason || 'Not approved',
      rejectedAt: new Date().toISOString()
    });
    if (!updatedBooking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }
    res.json({ success: true, booking: updatedBooking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Delete a booking
app.delete('/api/bookings/:id', (req, res) => {
  try {
    deleteBooking(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.match(/\.[^/]+$/)) {
    return next(); // Let it 404 for API or files (like .js, .css)
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile('index.html', { root: path.join(__dirname, '../client/dist') });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  // Start the scheduler on boot
  startScheduler();
});
