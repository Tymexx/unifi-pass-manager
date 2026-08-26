const schedule = require('node-schedule');
const niceware = require('niceware');
const { getSettings, getNetworks, getEvents, updateNetworkPassword, saveEvents } = require('./db');
const { createUnifiClient } = require('./unifiApi');

const jobs = {};

function generatePassword() {
  const words = [];
  while (words.length < 3) {
    const word = niceware.generatePassphrase(2)[0];
    if (word.length <= 6) { // Max 6 chars to prevent wrapping
      words.push(word);
    }
  }
  return words.join('-');
}

async function rotatePasswords(specificNetworkId = null) {
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
    if (!network.wlanId) {
      console.warn(`Skipping network ${network.name} due to missing wlanId`);
      continue;
    }

    const newPassword = generatePassword();
    
    try {
      await unifi.updateWlanPassword(network.wlanId, newPassword, network.mode, network.vlanId);
      updateNetworkPassword(network.id, newPassword);
      console.log(`Password rotated successfully for ${network.name} to: ${newPassword}`);
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
  
  for (const event of events) {
    const { id, networkId, type, time, date, recurringType, dayOfWeek, dayOfMonth, month } = event;
    
    if (!networkId || !time) continue;

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
      jobs[id] = schedule.scheduleJob(rule, async () => {
        console.log(`Running scheduled password rotation for event ${id}...`);
        await rotatePasswords(networkId);

        // If it was a one-off event, remove it from the database after running
        if (type === 'one-off') {
          const currentEvents = getEvents();
          const updatedEvents = currentEvents.filter(e => e.id !== id);
          saveEvents(updatedEvents);
          console.log(`Removed completed one-off event ${id}`);
        }
      });
      console.log(`Scheduled job for event ${id} (${type})`);
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
