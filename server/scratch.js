const { createUnifiClient } = require('./unifiApi');
const fs = require('fs');

async function test() {
  const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
  const client = createUnifiClient(data.settings);
  await client.login();
  
  const res = await client.client.get('/proxy/network/api/s/default/rest/networkconf');
  console.log(JSON.stringify(res.data.data.map(n => ({ name: n.name, id: n._id, vlan: n.vlan, purpose: n.purpose })), null, 2));
}

test().catch(console.error);
