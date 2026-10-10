const nodemailer = require('nodemailer');
const axios = require('axios');
const { getSettings } = require('./db');

function createTransporter(settings) {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    return null;
  }
  
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: parseInt(settings.smtpPort) || 587,
    secure: parseInt(settings.smtpPort) === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass
    }
  });
}

async function sendEmailNotification(to, subject, text, html) {
  const settings = getSettings();
  const transporter = createTransporter(settings);
  
  if (!transporter) {
    console.warn('Skipping email notification: SMTP settings not configured');
    return false;
  }

  const from = settings.smtpFrom || settings.smtpUser;

  try {
    const info = await transporter.sendMail({
      from: `"Bastion" <${from}>`,
      to,
      subject,
      text,
      html: html || text
    });
    console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return false;
  }
}

async function sendWebhookNotification(payload) {
  const settings = getSettings();
  
  if (!settings.webhookUrl) {
    return false;
  }

  try {
    await axios.post(settings.webhookUrl, payload);
    console.log('Webhook notification sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send webhook notification:', error.message);
    return false;
  }
}

async function sendGlobalNotification(network, newPassword) {
  const settings = getSettings();
  
  const text = `The Wi-Fi password for network "${network.name}" (${network.ssidName || 'No SSID'}) has been rotated.\n\nNew Password: ${newPassword}\n\nThis was an automated rotation by UniFi Pass Manager.`;
  const subject = `Wi-Fi Password Rotated: ${network.name}`;

  // 1. Send Email (if configured and global admin email is set)
  if (settings.globalAdminEmail) {
    await sendEmailNotification(settings.globalAdminEmail, subject, text);
  }

  // 2. Send Webhook (Discord/Slack format or generic ntfy.sh)
  if (settings.webhookUrl) {
    const isNtfy = settings.webhookUrl.includes('ntfy.sh');
    let payload = text;
    
    if (!isNtfy) {
      // Discord/Slack webhook format
      payload = {
        content: text, // Discord/basic fallback
        text: text, // Slack
        title: subject
      };
    }
    
    try {
      await axios.post(settings.webhookUrl, payload, isNtfy ? { headers: { 'Title': subject, 'Tags': 'lock' } } : {});
      console.log('Webhook notification sent successfully');
    } catch (error) {
      console.error('Failed to send webhook notification:', error.message);
    }
  }
}

async function sendClientEmail(emails, network, newPassword, eventTitle) {
  if (!emails || emails.trim() === '') return;
  
  // Clean up comma-separated emails
  const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
  
  if (emailList.length === 0) return;

  const wifiString = `WIFI:S:${network.ssidName || network.name};T:WPA;P:${newPassword};;`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(wifiString)}`;

  const subject = `Bastion: Wi-Fi Credentials for ${eventTitle}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #222834; border-radius: 12px; background: #151921; color: #f3f4f6;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <h2 style="color: #0086d6; margin: 0; font-size: 1.4rem;">Bastion Wi-Fi Access</h2>
      </div>
      <p style="font-size: 1rem; color: #f3f4f6;">Hello,</p>
      <p style="color: #949da8; line-height: 1.6;">Your secure Wi-Fi credentials for <strong>${eventTitle}</strong> are ready. You can join the network manually or scan the QR code below.</p>
      
      <div style="background-color: #0d1117; padding: 20px; border-radius: 8px; border: 1px solid #222834; margin: 20px 0; text-align: center;">
        <div style="margin-bottom: 12px; text-align: left;">
          <strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Network Name (SSID):</strong>
          <div style="color: #fff; font-size: 1.1rem; font-weight: 600; margin-top: 4px;">${network.ssidName || network.name}</div>
        </div>
        <div style="margin-bottom: 16px; text-align: left;">
          <strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Password / Key:</strong>
          <div style="color: #0086d6; font-family: monospace; font-size: 1.25rem; font-weight: 700; background: #151921; padding: 10px 14px; border-radius: 6px; border: 1px solid #222834; margin-top: 4px; word-break: break-all;">${newPassword}</div>
        </div>
        <div style="background: #ffffff; display: inline-block; padding: 14px; border-radius: 8px; margin-top: 10px;">
          <img src="${qrUrl}" alt="Wi-Fi QR Code" width="180" height="180" style="display: block;" />
        </div>
        <p style="color: #5e6774; font-size: 0.8rem; margin: 8px 0 0 0;">Scan with your device camera to connect immediately</p>
      </div>
      
      <p style="color: #5e6774; font-size: 0.85rem; margin-top: 24px; border-top: 1px solid #222834; padding-top: 16px;">
        For security, these credentials are tied to your scheduled booking and will expire automatically when the session ends.
      </p>
    </div>
  `;
  const text = `Hello,\n\nYour Wi-Fi credentials for ${eventTitle} are ready:\n\nNetwork (SSID): ${network.ssidName || network.name}\nPassword: ${newPassword}\n\nScan the QR code or enter the password on your device. Credentials will expire when the session ends.`;

  // Send to all clients using Bcc so they don't see each other's emails
  const bccList = emailList.join(', ');
  const settings = getSettings();
  const transporter = createTransporter(settings);
  if (!transporter) return;
  
  const from = settings.smtpFrom || settings.smtpUser;
  
  try {
    const info = await transporter.sendMail({
      from: `"Bastion" <${from}>`,
      to: from, // Send to self
      bcc: bccList, // BCC the clients
      subject,
      text,
      html: html || text
    });
    console.log(`Client email sent successfully to ${bccList}: ${info.messageId}`);
  } catch (error) {
    console.error(`Failed to send client email to ${bccList}:`, error.message);
  }
}

async function sendBookingReceivedCustomerEmail(booking) {
  const subject = `Bastion: Access Request Received (${booking.company || booking.name})`;
  const durationText = `${booking.durationHours || 1}h ${booking.durationMinutes || 0}m`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #222834; border-radius: 12px; background: #151921; color: #f3f4f6;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <h2 style="color: #0086d6; margin: 0; font-size: 1.4rem;">Bastion Wi-Fi Access</h2>
      </div>
      <p style="font-size: 1rem; color: #f3f4f6;">Hello <strong>${booking.name}</strong>,</p>
      <p style="color: #949da8; line-height: 1.6;">Thank you for your request. Your booking is currently <strong>under administrative review</strong>. Once confirmed, your scheduled credentials will be prepared.</p>
      
      <div style="background-color: #0d1117; padding: 18px; border-radius: 8px; border: 1px solid #222834; margin: 24px 0;">
        <div style="margin-bottom: 8px;"><strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Event / Organization:</strong> <span style="color: #fff;">${booking.company || 'Not Specified'}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Scheduled Date:</strong> <span style="color: #fff;">${booking.date} at ${booking.time}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Duration:</strong> <span style="color: #fff;">${durationText}</span></div>
        <div><strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Status:</strong> <span style="color: #f59e0b; font-weight: 600;">Pending Review</span></div>
      </div>
      
      <p style="color: #5e6774; font-size: 0.85rem; margin-top: 24px; border-top: 1px solid #222834; padding-top: 16px;">
        You will receive a confirmation email once your access window is approved.
      </p>
    </div>
  `;
  const text = `Hello ${booking.name},\n\nThank you for your request. Your Wi-Fi booking is currently under review.\n\nDate: ${booking.date} at ${booking.time}\nDuration: ${durationText}\nStatus: Pending Review\n\nYou will receive a confirmation email once approved.`;
  return sendEmailNotification(booking.email, subject, text, html);
}

async function sendBookingAdminAlertEmail(booking) {
  const settings = getSettings();
  const adminEmail = settings.bookingAlertEmail || settings.globalAdminEmail || settings.testEmailRecipient;
  if (!adminEmail || !adminEmail.includes('@')) return false;

  const subject = `[Bastion Alert] New Wi-Fi Request: ${booking.name} (${booking.company || 'Guest'})`;
  const durationText = `${booking.durationHours || 1}h ${booking.durationMinutes || 0}m`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #222834; border-radius: 12px; background: #151921; color: #f3f4f6;">
      <h2 style="color: #f59e0b; margin: 0 0 16px 0; font-size: 1.3rem;">New Wi-Fi Access Request</h2>
      <p style="color: #949da8;">A new guest access request has been submitted through your booking embed widget:</p>
      
      <div style="background-color: #0d1117; padding: 18px; border-radius: 8px; border: 1px solid #222834; margin: 20px 0;">
        <div style="margin-bottom: 8px;"><strong style="color: #949da8;">Guest Name:</strong> <span style="color: #fff;">${booking.name}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #949da8;">Guest Email:</strong> <span style="color: #fff;">${booking.email}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #949da8;">Company / Event:</strong> <span style="color: #fff;">${booking.company || 'N/A'}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #949da8;">Start Time:</strong> <span style="color: #fff;">${booking.date} at ${booking.time}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #949da8;">Duration:</strong> <span style="color: #fff;">${durationText}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #949da8;">Preferred Network:</strong> <span style="color: #fff;">${booking.requestedNetworkName || 'Any / Auto-Assign'}</span></div>
        <div><strong style="color: #949da8;">Delivery Timing:</strong> <span style="color: #fff;">${booking.sendTiming || 'Standard'}</span></div>
      </div>
      
      <p style="color: #949da8; font-size: 0.9rem;">
        Log into your Bastion dashboard at <a href="https://bastion.directconnect.global/bookings" style="color: #0086d6;">bastion.directconnect.global/bookings</a> to review and approve this request.
      </p>
    </div>
  `;
  const text = `New Wi-Fi Request Received:\n\nGuest: ${booking.name} (${booking.email})\nCompany: ${booking.company || 'N/A'}\nWhen: ${booking.date} at ${booking.time}\nDuration: ${durationText}\n\nReview at https://bastion.directconnect.global/bookings`;
  return sendEmailNotification(adminEmail, subject, text, html);
}

async function sendBookingApprovedEmail(booking, networkName) {
  const subject = `Bastion: Wi-Fi Access Confirmed for ${booking.company || booking.name}`;
  const durationText = `${booking.durationHours || 1}h ${booking.durationMinutes || 0}m`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #222834; border-radius: 12px; background: #151921; color: #f3f4f6;">
      <h2 style="color: #10b981; margin: 0 0 16px 0; font-size: 1.4rem;">Booking Confirmed</h2>
      <p style="font-size: 1rem; color: #f3f4f6;">Hello <strong>${booking.name}</strong>,</p>
      <p style="color: #949da8; line-height: 1.6;">Your Wi-Fi access request has been <strong>approved</strong>. We have provisioned your dedicated access slot.</p>
      
      <div style="background-color: #0d1117; padding: 18px; border-radius: 8px; border: 1px solid #222834; margin: 24px 0;">
        <div style="margin-bottom: 8px;"><strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Network:</strong> <span style="color: #fff; font-weight: 600;">${networkName}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Scheduled Date:</strong> <span style="color: #fff;">${booking.date} at ${booking.time}</span></div>
        <div style="margin-bottom: 8px;"><strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Access Duration:</strong> <span style="color: #fff;">${durationText}</span></div>
        <div><strong style="color: #949da8; font-size: 0.85rem; text-transform: uppercase;">Delivery Notice:</strong> <span style="color: #0086d6; font-weight: 500;">Your unique secure passphrase and connection QR code will be dispatched to this email address automatically prior to your meeting.</span></div>
      </div>
      
      <p style="color: #5e6774; font-size: 0.85rem; margin-top: 24px; border-top: 1px solid #222834; padding-top: 16px;">
        For security, credentials are automatically rotated and deactivated once your ${durationText} meeting duration concludes.
      </p>
    </div>
  `;
  const text = `Hello ${booking.name},\n\nYour Wi-Fi access request for ${networkName} is approved!\n\nDate: ${booking.date} at ${booking.time}\nDuration: ${durationText}\n\nYour unique passphrase and QR code will be dispatched to your email automatically prior to your meeting.`;
  return sendEmailNotification(booking.email, subject, text, html);
}

module.exports = {
  sendGlobalNotification,
  sendClientEmail,
  sendBookingReceivedCustomerEmail,
  sendBookingAdminAlertEmail,
  sendBookingApprovedEmail
};
