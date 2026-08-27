const { createUnifiClient } = require('./unifiApi');
const fs = require('fs');

async function test() {
  const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
  const client = createUnifiClient(data.settings);
  await client.login();
  
  const res = await client.client.get('/proxy/network/api/s/default/rest/networkconf');
  console.log("=== UniFi Networks ===");
  res.data.data.forEach(n => {
    console.log(`Name: ${n.name}`);
    console.log(`VLAN ID (for our app): ${n._id}`);
    console.log('-------------------');
  });
}

test().catch(console.error);
