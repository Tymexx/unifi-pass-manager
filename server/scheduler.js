const schedule = require('node-schedule');
const niceware = require('niceware');
const { getSettings, getNetworks, getEvents, updateNetworkPassword, saveEvents } = require('./db');
const { createUnifiClient } = require('./unifiApi');
const { sendGlobalNotification, sendClientEmail } = require('./notifications');

const jobs = {};

function generatePassword(policy = {}) {
  const p = {
    type: 'passphrase',
    wordCount: 3,
    separator: '-',
    capitalize: false,
    includeNumber: false,
    length: 14,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
    ...policy
  };

  if (p.type === 'passphrase') {
    const words = [];
    while (words.length < p.wordCount) {
      let word = niceware.generatePassphrase(2)[0];
      if (word.length <= 8) { 
        if (p.capitalize) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        words.push(word);
      }
    }
    let sep = p.separator;
    if (sep === 'none') sep = '';
    if (sep === 'space') sep = ' ';
    
    let pass = words.join(sep);
    if (p.includeNumber) {
      pass += Math.floor(Math.random() * 10);
    }
    return pass;
  } else {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const syms = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let chars = '';
    if (p.uppercase) chars += upper;
    if (p.lowercase) chars += lower;
    if (p.numbers) chars += nums;
    if (p.symbols) chars += syms;
    if (!chars) chars = lower + nums; // fallback

    let pass = '';
    for (let i = 0; i < p.length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }
}

async function rotatePasswords(specificNetworkId = null, event = null, customPassword = null) {
  const settings = getSettings();
  let networks = getNetworks();
  
  if (specificNetworkId) {
    networks = networks.filter(n => n.id === specificNetworkId);
  }
  
  if (!networks || networks.length === 0) {
    console.error('Cannot rotate passwords: No networks configured');
    return null;
  }

  const results = [];
  let unifi = null;

  try {
    unifi = createUnifiClient(settings);
    await unifi.login();
  } catch (err) {
    console.error('Failed to connect to Unifi for rotation:', err.message);
    throw err;
  }

  for (const network of networks) {
    if (network.enabled === false) {
      console.warn(`Skipping network ${network.name} because it is disabled`);
      continue;
    }
    if (!network.wlanId) {
      console.warn(`Skipping network ${network.name} due to missing wlanId`);
      continue;
    }

    const newPassword = customPassword || generatePassword(network.passwordPolicy);
    
    try {
      await unifi.updateWlanPassword(network.wlanId, newPassword, network.mode, network.vlanId);
      updateNetworkPassword(network.id, newPassword);
      console.log(`Password rotated successfully for ${network.name} to: ${newPassword}`);
      
      // Global Notification (fire and forget)
      sendGlobalNotification(network, newPassword).catch(e => console.error('Global notification error:', e.message));

      // Client Emails (if triggered by a scheduled event)
      if (event && event.clientEmails) {
        if (event.sendTiming !== 'custom' || !event.emailSent) {
          sendClientEmail(event.clientEmails, network, newPassword, event.title).catch(e => console.error('Client email error:', e.message));
        }
      }

      // Check for Revoke Access
      if (event && event.revokeAccess) {
        const revokeHours = parseInt(event.revokeHours || 0, 10);
        const revokeMinutes = parseInt(event.revokeMinutes || 0, 10);
        
        if (revokeHours > 0 || revokeMinutes > 0) {
          const totalMs = (revokeHours * 60 * 60 * 1000) + (revokeMinutes * 60 * 1000);
          const revokeDate = new Date(Date.now() + totalMs);
          
          console.log(`Scheduling REVOKE auto-rotation for ${network.name} at ${revokeDate.toISOString()}`);
          schedule.scheduleJob(revokeDate, async function() {
            console.log(`Executing REVOKE auto-rotation for ${network.name} to kick clients...`);
            try {
              // Passing event=null so it DOES NOT email the clients the new scrambled password
              await rotatePasswords(network.id, null, null); 
            } catch(e) {
              console.error('Revoke rotation failed:', e);
            }
          });
        }
      }

      results.push({ id: network.id, name: network.name, success: true, newPassword });
    } catch (err) {
      console.error(`Failed to rotate password for ${network.name}:`, err.message);
      results.push({ id: network.id, name: network.name, success: false, error: err.message });
    }
  }

  return results;
}

function startScheduler() {
  // Cancel existing jobs
  for (const id in jobs) {
    if (jobs[id]) jobs[id].cancel();
    delete jobs[id];
  }

  const events = getEvents();
  const networks = getNetworks();
  
  for (const event of events) {
    const { id, networkId, type, time, date, recurringType, dayOfWeek, dayOfMonth, month, sendTiming, emailSendDate, emailSendTime, emailSendOffset, clientEmails } = event;
    
    if (!networkId || !time) continue;
    const targetNetwork = networks.find(n => n.id === networkId);
    if (!targetNetwork) continue;

    let hour = 0, minute = 0;
    if (time) {
      const parts = time.split(':');
      hour = parseInt(parts[0] || '0', 10);
      minute = parseInt(parts[1] || '0', 10);
    }

    let rule = null;

    if (type === 'one-off') {
      if (date) {
         const parts = date.split('-'); // YYYY-MM-DD
         if (parts.length === 3) {
           const y = parseInt(parts[0], 10);
           const m = parseInt(parts[1], 10) - 1; 
           const d = parseInt(parts[2], 10);
           const dateObj = new Date(y, m, d, hour, minute, 0);
           if (dateObj > new Date()) {
             rule = dateObj;
           } else {
             console.log(`Skipping one-off event ${id}, date is in the past.`);
           }
         }
      }
    } else if (type === 'recurring') {
      rule = new schedule.RecurrenceRule();
      rule.hour = hour;
      rule.minute = minute;
      
      if (recurringType === 'weekly') {
        rule.dayOfWeek = parseInt(dayOfWeek || '0', 10);
      } else if (recurringType === 'monthly') {
        rule.date = parseInt(dayOfMonth || '1', 10);
      } else if (recurringType === 'yearly') {
        rule.month = parseInt(month || '0', 10);
        rule.date = parseInt(dayOfMonth || '1', 10);
      }
    }

    if (rule) {
      // 1. Schedule Rotation Job
      const rotationJobId = `${id}_rotation`;
      jobs[rotationJobId] = schedule.scheduleJob(rule, async () => {
        console.log(`Running scheduled password rotation for event ${id}...`);
        try {
          const currentEvents = getEvents();
          const currentEvent = currentEvents.find(e => e.id === id);
          
          let passwordToUse = null;
          if (currentEvent && currentEvent.sendTiming === 'custom') {
            passwordToUse = currentEvent.nextPreGeneratedPassword;
          }

          await rotatePasswords(networkId, currentEvent, passwordToUse);

          if (currentEvent) {
            // Clean up custom states
            if (currentEvent.sendTiming === 'custom') {
              currentEvent.nextPreGeneratedPassword = null;
              currentEvent.emailSent = false;
              saveEvents(getEvents()); // Save the cleared state
            }
            
            // If it was a one-off event, remove it from the database after running
            if (currentEvent.type === 'one-off') {
              const updatedEvents = getEvents().filter(e => e.id !== id);
              saveEvents(updatedEvents);
              console.log(`Removed completed one-off event ${id}`);
            } else {
              // Recurring event just finished a rotation. Restart scheduler to calculate next pre-send job!
              restartScheduler();
            }
          }
        } catch (error) {
          console.error(`Scheduled job for event ${id} failed:`, error.message);
        }
      });
      console.log(`Scheduled rotation job for event ${id} (${type})`);

      // 2. Schedule Pre-Send Email Job (if custom)
      if (sendTiming === 'custom' && clientEmails) {
        let emailDateObj = null;

        if (type === 'one-off' && emailSendDate && emailSendTime) {
          const eParts = emailSendDate.split('-');
          const tParts = emailSendTime.split(':');
          if (eParts.length === 3 && tParts.length === 2) {
            emailDateObj = new Date(
              parseInt(eParts[0], 10),
              parseInt(eParts[1], 10) - 1,
              parseInt(eParts[2], 10),
              parseInt(tParts[0], 10),
              parseInt(tParts[1], 10),
              0
            );
          }
        } else if (type === 'recurring' && emailSendOffset && jobs[rotationJobId]) {
          // Calculate offset based on next invocation
          const nextInvocation = jobs[rotationJobId].nextInvocation();
          if (nextInvocation) {
            const offsetHours = parseInt(emailSendOffset, 10) || 24;
            emailDateObj = new Date(nextInvocation.getTime() - (offsetHours * 60 * 60 * 1000));
          }
        }

        if (emailDateObj && emailDateObj > new Date() && !event.emailSent) {
          const emailJobId = `${id}_email`;
          jobs[emailJobId] = schedule.scheduleJob(emailDateObj, async () => {
            console.log(`Running pre-send email job for event ${id}...`);
            try {
              const currentEvents = getEvents();
              const currentEvent = currentEvents.find(e => e.id === id);
              if (!currentEvent) return;

              // Generate the password now
              const policy = targetNetwork.passwordPolicy || getSettings().passwordPolicy;
              const preGenerated = generatePassword(policy);
              
              currentEvent.nextPreGeneratedPassword = preGenerated;
              currentEvent.emailSent = true;
              saveEvents(currentEvents); // Save the password and state

              await sendClientEmail(currentEvent.clientEmails, targetNetwork, preGenerated, currentEvent.title);
              console.log(`Successfully sent pre-generated password for ${id}`);
            } catch (err) {
              console.error(`Pre-send email failed for ${id}:`, err.message);
            }
          });
          console.log(`Scheduled pre-send email job for event ${id} at ${emailDateObj.toISOString()}`);
        } else if (emailDateObj && emailDateObj <= new Date() && !event.emailSent) {
          console.log(`Pre-send email time for ${id} is in the past! Email was missed.`);
        }
      }
    }
  }
}

function restartScheduler() {
  startScheduler();
}

module.exports = {
  startScheduler,
  restartScheduler,
  rotatePasswords,
  generatePassword
};
