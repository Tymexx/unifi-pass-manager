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
      from: `"UniFi Pass Manager" <${from}>`,
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

  const subject = `Wi-Fi Access for: ${eventTitle}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #0f172a;">Your Wi-Fi Access is Ready</h2>
      <p>Hello,</p>
      <p>The Wi-Fi credentials for your scheduled event "<strong>${eventTitle}</strong>" are now active.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Network Name (SSID):</strong> ${network.ssidName || network.name}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${newPassword}</span></p>
      </div>
      
      <p style="color: #64748b; font-size: 0.9em;">These credentials will remain active for the duration of your schedule.</p>
    </div>
  `;
  const text = `Hello,\n\nThe Wi-Fi credentials for your scheduled event "${eventTitle}" are now active.\n\nNetwork Name (SSID): ${network.ssidName || network.name}\nPassword: ${newPassword}\n\nThese credentials will remain active for the duration of your schedule.`;

  // Send to all clients using Bcc so they don't see each other's emails
  const bccList = emailList.join(', ');
  const settings = getSettings();
  const transporter = createTransporter(settings);
  if (!transporter) return;
  
  const from = settings.smtpFrom || settings.smtpUser;
  
  try {
    const info = await transporter.sendMail({
      from: `"UniFi Pass Manager" <${from}>`,
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

module.exports = {
  sendGlobalNotification,
  sendClientEmail
};
